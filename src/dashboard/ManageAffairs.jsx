import { useState } from 'react'
import { useCollection, addDocument, updateDocument, deleteDocument } from '../hooks/useFirestore'
import { useAuth } from '../context/AuthContext'
import { affairs as staticAffairs } from '../data/data'
import PhotoUpload from './PhotoUpload'
import './Dashboard.css'

const COLORS = [
  '#1a3a6b', '#7c3aed', '#059669', '#dc2626', '#d97706',
  '#0891b2', '#be185d', '#65a30d', '#9333ea', '#0284c7',
]

const empty = {
  name: '', icon: '🏛️', description: '', color: '#1a3a6b',
  headName: '', headTitle: 'Head', headImage: null,
  assocName: '', assocTitle: 'Associative Head', assocImage: null,
  status: 'active',
  image: null,
}

export default function ManageAffairs() {
  const { profile } = useAuth()
  const { docs, loading } = useCollection('affairs', 'createdAt')
  const [modal, setModal]   = useState(false)
  const [form, setForm]     = useState(empty)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const [search, setSearch] = useState('')

  const role    = profile?.role
  const isAdmin = role === 'admin'

  const filtered = docs.filter(a =>
    a.name?.toLowerCase().includes(search.toLowerCase())
  )

  const canEdit = (item) => isAdmin || profile?.affairId === item.id

  const openAdd  = () => { setForm(empty); setEditId(null); setError(''); setModal(true) }
  const openEdit = (item) => {
    setForm({
      name:       item.name        || '',
      icon:       item.icon        || '🏛️',
      description:item.description || '',
      color:      item.color       || '#1a3a6b',
      headName:   item.head?.name  || '',
      headTitle:  item.head?.title || 'Head',
      headImage:  item.head?.image || null,
      assocName:  item.associativeHead?.name  || '',
      assocTitle: item.associativeHead?.title || 'Associative Head',
      assocImage: item.associativeHead?.image || null,
      status:     item.status      || 'active',
      image:      item.image       || null,
    })
    setEditId(item.id); setError(''); setModal(true)
  }
  const closeModal = () => { setModal(false); setForm(empty); setEditId(null); setError('') }

  const handleSave = async e => {
    e.preventDefault()
    if (!form.name) { setError('Affair name is required.'); return }
    setSaving(true)
    const data = {
      name:        form.name,
      icon:        form.icon,
      description: form.description,
      color:       form.color,
      status:      form.status,
      image:       form.image || null,
      head:        { name: form.headName,  title: form.headTitle,  image: form.headImage  || null },
      associativeHead: { name: form.assocName, title: form.assocTitle, image: form.assocImage || null },
    }
    try {
      if (editId) await updateDocument('affairs', editId, data)
      else         await addDocument('affairs', data)
      closeModal()
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this affair permanently?')) return
    await deleteDocument('affairs', id)
  }

  const seedStatic = async () => {
    if (!confirm(`Seed ${staticAffairs.length} static affairs into Firestore?`)) return
    for (const a of staticAffairs) {
      await addDocument('affairs', {
        name: a.name, icon: a.icon, description: a.description,
        color: a.color, status: 'active',
        head: a.head, associativeHead: a.associativeHead,
      })
    }
  }

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="dash-page">
      <div className="dash-page-header">
        <div>
          <h1>🏛️ Affairs Management</h1>
          <p>
            {isAdmin
              ? `Managing all ${docs.length} affair${docs.length !== 1 ? 's' : ''}`
              : `Managing: ${profile?.affairName || 'your affair'}`
            }
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isAdmin && docs.length === 0 && (
            <button className="db-btn db-btn-ghost" onClick={seedStatic}>⬆ Seed from static</button>
          )}
          {isAdmin && (
            <button className="db-btn db-btn-primary" onClick={openAdd}>+ Add Affair</button>
          )}
        </div>
      </div>

      {/* Search */}
      {docs.length > 0 && (
        <div className="db-search-bar">
          <input
            className="db-search-input"
            placeholder="Search affairs…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)' }}>
            {filtered.length} affair{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.35)' }}>Loading…</p>
      ) : (
        <div className="affairs-cards">
          {filtered.length === 0 && (
            <p style={{ color: 'rgba(255,255,255,0.35)', padding: '32px 0' }}>
              {docs.length === 0
                ? 'No affairs yet. Click "Add Affair" or "Seed from static".'
                : 'No affairs match your search.'}
            </p>
          )}
          {filtered.map(item => (
            <div
              key={item.id}
              className="affair-mgmt-card"
              style={{ '--ac': item.color || '#1a3a6b' }}
            >
              <div className="amc-top">
                <span className="amc-icon">{item.icon || '🏛️'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <h3>{item.name}</h3>
                    <span style={{
                      fontSize: '0.62rem', fontWeight: 700, letterSpacing: 1,
                      textTransform: 'uppercase', padding: '2px 8px', borderRadius: 20,
                      background: item.status === 'active' ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.06)',
                      color: item.status === 'active' ? '#22c55e' : 'rgba(255,255,255,0.35)',
                      border: `1px solid ${item.status === 'active' ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.1)'}`,
                    }}>
                      {item.status || 'active'}
                    </span>
                  </div>
                  <div className="amc-leaders">
                    {item.head?.name && <span>Head: <strong>{item.head.name}</strong></span>}
                    {item.associativeHead?.name && <span>Assoc: <strong>{item.associativeHead.name}</strong></span>}
                  </div>
                </div>
              </div>
              <p className="amc-desc">{item.description?.slice(0, 130)}{item.description?.length > 130 ? '…' : ''}</p>

              {canEdit(item) && (
                <div className="db-table-actions" style={{ marginTop: 14 }}>
                  <button
                    className="db-btn db-btn-ghost"
                    style={{ padding: '7px 14px', fontSize: '0.82rem' }}
                    onClick={() => openEdit(item)}
                  >
                    Edit
                  </button>
                  {isAdmin && (
                    <button
                      className="db-btn db-btn-danger"
                      style={{ padding: '7px 14px', fontSize: '0.82rem' }}
                      onClick={() => handleDelete(item.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="db-modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="db-modal" style={{ maxWidth: 640 }}>
            <button className="db-modal-close" onClick={closeModal}>✕</button>
            <h2>{editId ? 'Edit Affair' : 'Add New Affair'}</h2>
            {error && <div className="db-error" style={{ marginBottom: 16 }}>{error}</div>}

            <form onSubmit={handleSave} className="db-form">
              {/* Name + Status */}
              <div className="db-form-row">
                <div className="db-field" style={{ flex: 2 }}>
                  <label>Affair Name *</label>
                  <input
                    value={form.name}
                    onChange={e => setField('name', e.target.value)}
                    placeholder="e.g. HUSU Academic Affair"
                  />
                </div>
                <div className="db-field">
                  <label>Status</label>
                  <select value={form.status} onChange={e => setField('status', e.target.value)}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="upcoming">Upcoming</option>
                  </select>
                </div>
              </div>

              {/* Icon + Color */}
              <div className="db-form-row">
                <div className="db-field">
                  <label>Icon (emoji)</label>
                  <input
                    value={form.icon}
                    onChange={e => setField('icon', e.target.value)}
                    placeholder="🎓"
                    style={{ fontSize: '1.4rem', textAlign: 'center' }}
                  />
                </div>
                <div className="db-field">
                  <label>Color</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                    {COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setField('color', c)}
                        style={{
                          width: 28, height: 28, borderRadius: '50%', background: c, border: 'none',
                          cursor: 'pointer', flexShrink: 0,
                          outline: form.color === c ? `3px solid ${c}` : '3px solid transparent',
                          outlineOffset: 2,
                        }}
                      />
                    ))}
                    <input
                      type="color"
                      value={form.color}
                      onChange={e => setField('color', e.target.value)}
                      style={{ width: 28, height: 28, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
                      title="Custom color"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="db-field">
                <label>Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setField('description', e.target.value)}
                  placeholder="What does this affair do? What are its responsibilities?"
                  style={{ minHeight: 100 }}
                />
              </div>

              {/* Affair cover image */}
              <PhotoUpload
                value={form.image}
                onChange={url => setField('image', url)}
                folder="affairs"
                label="Affair Cover Image (optional)"
                size="lg"
                shape="square"
                initials={form.icon || '🏛️'}
              />

              {/* Leadership */}
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '16px', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>
                  Leadership
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  {/* Head */}
                  <div className="db-form" style={{ gap: 10 }}>
                    <PhotoUpload
                      value={form.headImage}
                      onChange={url => setField('headImage', url)}
                      folder="affairs/leaders"
                      label="Head Photo"
                      size="md"
                      shape="circle"
                      initials={form.headName?.[0] || 'H'}
                    />
                    <div className="db-field">
                      <label>Head Name</label>
                      <input value={form.headName} onChange={e => setField('headName', e.target.value)} placeholder="Full name" />
                    </div>
                    <div className="db-field">
                      <label>Head Title</label>
                      <input value={form.headTitle} onChange={e => setField('headTitle', e.target.value)} placeholder="Head" />
                    </div>
                  </div>
                  {/* Assoc Head */}
                  <div className="db-form" style={{ gap: 10 }}>
                    <PhotoUpload
                      value={form.assocImage}
                      onChange={url => setField('assocImage', url)}
                      folder="affairs/leaders"
                      label="Assoc. Head Photo"
                      size="md"
                      shape="circle"
                      initials={form.assocName?.[0] || 'A'}
                    />
                    <div className="db-field">
                      <label>Associative Head Name</label>
                      <input value={form.assocName} onChange={e => setField('assocName', e.target.value)} placeholder="Full name" />
                    </div>
                    <div className="db-field">
                      <label>Associative Head Title</label>
                      <input value={form.assocTitle} onChange={e => setField('assocTitle', e.target.value)} placeholder="Associative Head" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="db-form-actions">
                <button type="button" className="db-btn db-btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="db-btn db-btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : (editId ? 'Update Affair' : 'Create Affair')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
