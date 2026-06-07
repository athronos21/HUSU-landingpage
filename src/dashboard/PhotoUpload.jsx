import { useState, useRef } from 'react'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '../firebase'
import './PhotoUpload.css'

/**
 * PhotoUpload — reusable image upload component
 * Props:
 *   value       — current image URL (string or null)
 *   onChange    — called with new URL after upload
 *   folder      — storage folder (e.g. 'team', 'affairs')
 *   label       — optional label text
 *   size        — 'sm' | 'md' | 'lg' (default 'md')
 *   shape       — 'circle' | 'square' (default 'circle')
 *   initials    — fallback text if no image
 */
export default function PhotoUpload({
  value, onChange, folder = 'uploads',
  label = 'Photo', size = 'md', shape = 'circle', initials = '?'
}) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]  = useState(0)
  const [error, setError]        = useState('')
  const inputRef = useRef(null)

  const sizeMap = { sm: 56, md: 80, lg: 120 }
  const px = sizeMap[size] || 80

  const handleFile = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Only image files allowed.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Max file size is 5MB.'); return }

    setError('')
    setUploading(true)
    setProgress(0)

    const ext      = file.name.split('.').pop()
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const storageRef = ref(storage, fileName)
    const task = uploadBytesResumable(storageRef, file)

    task.on('state_changed',
      snap => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      err  => { setError('Upload failed: ' + err.message); setUploading(false) },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref)
        onChange(url)
        setUploading(false)
        setProgress(0)
      }
    )
  }

  const handleRemove = async () => {
    if (!confirm('Remove this photo?')) return
    if (value) {
      try {
        const storageRef = ref(storage, value)
        await deleteObject(storageRef)
      } catch {
        // ignore if already deleted
      }
    }
    onChange(null)
  }

  return (
    <div className="pu-wrap">
      {label && <span className="pu-label">{label}</span>}

      <div className="pu-row">
        {/* Preview */}
        <div
          className={`pu-preview pu-${shape}`}
          style={{ width: px, height: px, minWidth: px }}
        >
          {value
            ? <img src={value} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span className="pu-initials" style={{ fontSize: px * 0.35 }}>{initials}</span>
          }
          {uploading && (
            <div className="pu-overlay">
              <div className="pu-progress-ring">
                <span>{progress}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="pu-controls">
          <button
            type="button"
            className="db-btn db-btn-ghost"
            style={{ fontSize: '0.8rem', padding: '7px 14px' }}
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? `Uploading ${progress}%…` : (value ? '🔄 Change photo' : '📷 Upload photo')}
          </button>
          {value && !uploading && (
            <button
              type="button"
              className="db-btn db-btn-danger"
              style={{ fontSize: '0.8rem', padding: '7px 14px' }}
              onClick={handleRemove}
            >
              Remove
            </button>
          )}
          <span className="pu-hint">JPG, PNG, WebP · max 5MB</span>
          {error && <span className="pu-error">{error}</span>}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files?.[0])}
      />
    </div>
  )
}
