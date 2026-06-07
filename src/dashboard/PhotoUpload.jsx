import { useState, useRef } from 'react'
import './PhotoUpload.css'

const CLOUD_NAME   = 'dvc5ijan'
const UPLOAD_PRESET = 'i0ysxxhc'

/**
 * PhotoUpload — uploads to Cloudinary (free, no CORS issues)
 */
export default function PhotoUpload({
  value, onChange, folder = 'husu',
  label = 'Photo', size = 'md', shape = 'circle', initials = '?'
}) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]  = useState(0)
  const [error, setError]        = useState('')
  const inputRef = useRef(null)

  const sizeMap = { sm: 56, md: 80, lg: 120 }
  const px = sizeMap[size] || 80

  const handleFile = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Only image files allowed.'); return }
    if (file.size > 10 * 1024 * 1024) { setError('Max file size is 10MB.'); return }

    setError('')
    setUploading(true)
    setProgress(20)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', UPLOAD_PRESET)
      formData.append('folder', folder)

      setProgress(40)

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      )

      setProgress(80)

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error?.message || `HTTP ${res.status}`)
      }

      const data = await res.json()
      setProgress(100)
      onChange(data.secure_url)
      setError('')
    } catch (err) {
      console.error('Upload error:', err)
      setError('Upload failed: ' + err.message)
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const handleRemove = () => {
    if (!confirm('Remove this photo?')) return
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
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#e8a020' }}>
                {progress}%
              </span>
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
          <span className="pu-hint">JPG, PNG, WebP · max 10MB</span>
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
