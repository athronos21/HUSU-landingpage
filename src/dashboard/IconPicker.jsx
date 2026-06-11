/**
 * IconPicker
 * Combines:
 *   - Option 2: upload a custom image (PNG/SVG) via Cloudinary
 *   - Option 3: searchable built-in icon grid from react-icons
 *   - Legacy: plain emoji / text fallback
 *
 * Props:
 *   value        — current icon value: { type: 'emoji'|'image'|'ri', value: string }
 *                  OR a plain string (legacy emoji) for backwards compat
 *   onChange(v)  — called with { type, value }
 *   label        — field label
 */

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import * as FaIcons  from 'react-icons/fa'
import * as MdIcons  from 'react-icons/md'
import * as BiIcons  from 'react-icons/bi'
import * as GiIcons  from 'react-icons/gi'
import * as HiIcons  from 'react-icons/hi'
import * as BsIcons  from 'react-icons/bs'
import './IconPicker.css'

const CLOUD_NAME    = 'dvc5ijanb'
const UPLOAD_PRESET = 'i0ysxxhc'

/* ── Build searchable icon catalog ── */
const SETS = [
  { prefix: 'Fa', label: 'Font Awesome', icons: FaIcons },
  { prefix: 'Md', label: 'Material',     icons: MdIcons },
  { prefix: 'Bi', label: 'BoxIcons',     icons: BiIcons },
  { prefix: 'Gi', label: 'Game Icons',   icons: GiIcons },
  { prefix: 'Hi', label: 'Heroicons',    icons: HiIcons },
  { prefix: 'Bs', label: 'Bootstrap',    icons: BsIcons },
]

// Flatten into [{ name, component, keywords }]
const ALL_ICONS = SETS.flatMap(({ icons }) =>
  Object.entries(icons)
    .filter(([name]) => typeof icons[name] === 'function')
    .map(([name, Comp]) => ({
      name,
      Comp,
      keywords: name.toLowerCase().replace(/[^a-z0-9]/g, ' '),
    }))
)

function searchIcons(query) {
  if (!query || query.trim().length < 2) return ALL_ICONS.slice(0, 80)
  const q = query.toLowerCase().replace(/[^a-z0-9]/g, '')
  return ALL_ICONS.filter(i => i.keywords.includes(q)).slice(0, 120)
}

/* ── Render the current icon value — always returns a React node or null ── */
export function renderIcon(value, size = 24, color = 'currentColor') {
  if (!value) return null

  // Legacy plain string → treat as emoji
  if (typeof value === 'string') {
    return <span style={{ fontSize: size }}>{value}</span>
  }

  // Must be an object from here
  if (typeof value !== 'object') return null

  if (value.type === 'emoji') {
    return <span style={{ fontSize: size }}>{value.value}</span>
  }

  if (value.type === 'image') {
    return (
      <img
        src={value.value}
        alt="icon"
        style={{ width: size, height: size, objectFit: 'contain' }}
      />
    )
  }

  if (value.type === 'ri') {
    const found = ALL_ICONS.find(i => i.name === value.value)
    if (found) return <found.Comp size={size} color={color} />
    return null
  }

  return null
}

/* ── Main component ── */
export default function IconPicker({ value, onChange, label = 'Icon' }) {
  const [open, setOpen]       = useState(false)
  const [tab, setTab]         = useState('library') // 'library' | 'upload' | 'emoji'
  const [query, setQuery]     = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState('')
  const [emoji, setEmoji]     = useState(typeof value === 'string' ? value : value?.type === 'emoji' ? value.value : '')
  const fileRef = useRef(null)

  const results = useMemo(() => searchIcons(query), [query])

  const select = (v) => {
    onChange(v)
    // Small timeout lets the parent state update settle before closing
    setTimeout(() => setOpen(false), 50)
  }

  const handleUpload = async (file) => {
    if (!file) return
    if (!file.type.match(/image\/(png|svg\+xml|jpeg|webp|gif)/)) {
      setUploadErr('Only PNG, SVG, JPG, WebP, GIF allowed.'); return
    }
    if (file.size > 5 * 1024 * 1024) { setUploadErr('Max 5MB.'); return }
    setUploadErr(''); setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('upload_preset', UPLOAD_PRESET)
      fd.append('folder', 'icons')
      const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || 'Upload failed')
      select({ type: 'image', value: data.secure_url })
    } catch (e) {
      setUploadErr(e.message)
    } finally {
      setUploading(false)
    }
  }

  // Global paste listener — active whenever the modal is open
  // Intercepts Ctrl+V even when no input is focused
  const handleGlobalPaste = useCallback((e) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          setTab('upload')
          setUploadErr('')
          handleUpload(file)
        }
        return
      }
    }
  }, []) // eslint-disable-line

  useEffect(() => {
    if (!open) return
    window.addEventListener('paste', handleGlobalPaste)
    return () => window.removeEventListener('paste', handleGlobalPaste)
  }, [open, handleGlobalPaste])

  const currentDisplay = (() => {
    if (!value) return <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>No icon</span>
    return renderIcon(value, 28)
  })()

  return (
    <div className="ip-wrap">
      {label && <span className="ip-label">{label}</span>}

      <button type="button" className="ip-trigger" onClick={() => setOpen(true)}>
        <span className="ip-preview">{currentDisplay}</span>
        <span className="ip-trigger-text">Change icon</span>
        <span className="ip-trigger-arrow">▾</span>
      </button>

      {open && (
        <div className="ip-overlay" onClick={e => e.target === e.currentTarget && setOpen(false)}>
          <div className="ip-modal">
            <div className="ip-modal-header">
              <span className="ip-modal-title">Choose Icon</span>
              <button type="button" className="ip-close" onClick={() => setOpen(false)}>✕</button>
            </div>

            {/* Global paste hint */}
            <div className="ip-paste-hint">
              <kbd>Ctrl</kbd><span>+</span><kbd>V</kbd>
              <span>paste a copied image anywhere in this dialog</span>
            </div>

            {/* Tabs */}
            <div className="ip-tabs">
              <button type="button" className={`ip-tab${tab === 'library' ? ' active' : ''}`} onClick={() => setTab('library')}>
                🔍 Icon Library
              </button>
              <button type="button" className={`ip-tab${tab === 'upload' ? ' active' : ''}`} onClick={() => setTab('upload')}>
                📤 Upload Image
              </button>
              <button type="button" className={`ip-tab${tab === 'emoji' ? ' active' : ''}`} onClick={() => setTab('emoji')}>
                😊 Emoji
              </button>
            </div>

            {/* ── Library tab ── */}
            {tab === 'library' && (
              <div className="ip-library">
                <input
                  className="ip-search"
                  placeholder="Search icons… (e.g. graduation, book, star)"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  autoFocus
                />
                <p className="ip-hint">
                  {query.length < 2 ? 'Type to search 180,000+ icons' : `${results.length} results`}
                </p>
                <div className="ip-grid">
                  {results.map(({ name, Comp }) => (
                    <button
                      key={name}
                      type="button"
                      className={`ip-icon-btn${value?.type === 'ri' && value?.value === name ? ' selected' : ''}`}
                      onClick={() => select({ type: 'ri', value: name })}
                      title={name}
                    >
                      <Comp size={22} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Upload tab ── */}
            {tab === 'upload' && (
              <div className="ip-upload">
                <div
                  className="ip-dropzone"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); handleUpload(e.dataTransfer.files[0]) }}
                >
                  {uploading ? (
                    <span>Uploading…</span>
                  ) : (
                    <>
                      <span className="ip-dz-icon">📁</span>
                      <span>Click or drag a file here</span>
                      <div className="ip-dz-paste-badge">
                        <kbd>Ctrl</kbd><span>+</span><kbd>V</kbd> paste from clipboard
                      </div>
                      <span className="ip-dz-hint">PNG · SVG · JPG · WebP · GIF · max 5MB</span>
                      <span className="ip-dz-hint" style={{ marginTop: 4 }}>
                        Copy any image from Flaticon, Google or any website → paste here
                      </span>
                    </>
                  )}
                </div>
                {uploadErr && <p className="ip-upload-err">{uploadErr}</p>}
                {value?.type === 'image' && (
                  <div className="ip-upload-preview">
                    <img src={value.value} alt="current icon" />
                    <span>Current uploaded icon</span>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/svg+xml,image/jpeg,image/webp"
                  style={{ display: 'none' }}
                  onChange={e => handleUpload(e.target.files?.[0])}
                />
              </div>
            )}

            {/* ── Emoji tab ── */}
            {tab === 'emoji' && (
              <div className="ip-emoji-tab">
                <p className="ip-hint">Type or paste any emoji below</p>
                <div className="ip-emoji-row">
                  <input
                    className="ip-emoji-input"
                    value={emoji}
                    onChange={e => setEmoji(e.target.value)}
                    placeholder="e.g. 🎓"
                    maxLength={8}
                  />
                  <button
                    type="button"
                    className="db-btn db-btn-primary"
                    onClick={() => emoji && select({ type: 'emoji', value: emoji })}
                  >
                    Use this emoji
                  </button>
                </div>
                <p className="ip-hint" style={{ marginTop: 8 }}>
                  Open system emoji picker: <strong>Win + .</strong> or <strong>⌘ Ctrl + Space</strong>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
