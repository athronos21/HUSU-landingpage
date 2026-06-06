import { useState } from 'react'
import { useCollection, addDocument, updateDocument, deleteDocument } from '../hooks/useFirestore'
import { useAuth } from '../context/AuthContext'
import { affairs as staticAffairs } from '../data/data'
import './Dashboard.css'

const empty = {
  name: '', icon: '🏛️', description: '', color: '#1a3a6b',
  headName: '', headTitle: 'Head',
  assocName: '', assocTitle: 'Associative Head',
}

export default function ManageAffairs() {
  const { profile } = useAuth()
  const { docs, loading } = useCollection('affairs', 'createdAt')
  const [modal, setModal]   = useState(false)
  const [form, setForm]     = useState(empty)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const role = profile?.role
  // affair heads can only edit their assigned affair
  const isAdmin = role === 'admin'
  const canEdit = (item) => isAdmin || profile?.affairId === item.id

  const items = docs

  const openAdd  = () => { setForm(empty); setEditId(null); setError(''); setModal(true) }
  const openEdit = (item) => {
    setForm({
      name: item.name || '', icon: item.icon || '🏛️', description: item.description || '',
      color: item.color || '#1a3a6b',
      headName: item.head?.name || '', headTitle: item.head?.title || 'Head',
      assocName: item.associativeHead?.name || '', assocTitle: item.associativeHead?.title || 'Associative Head',
    })
    setEditId(item.id); setError(''); setModal(true)
  }
  const closeModal = () => { setModal(false); setForm(empty); setEditId(null); setError('') }

  const handleSave = async e => {
    e.preventDefault()
    if (!form.name) { setError('Name is required.'); return }
    setSaving(true)
    const data = {
      name: form.name, icon: form.icon, description: form.description, color: form.color,
      head: { name: form.headName, title: form.headTitle },
      associativeHead: { name: form.assocName, title: form.assocTitle },
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
    if (!confirm('Delete this affair?')) return
    await deleteDocument('affairs', id)
  }

  const seedStatic = async () => {
    if (!confirm('Seed static affairs into Firestore?')) return
    for (const a of staticAffairs) {
      await addDocument('affairs', {
        name: a.name, icon: a.icon, description: a.description, color: a.color,
        head: a.head, associativeHead: a.associativeHead,
      })
    }
  }

  return (
    <div className="dash-page">
      <div className="dash-page-header">
        <div>
          <h1>🏛️ Affairs Management</h1>
          <p>{isAdmin ? 'Manage all affairs' : `Managing: ${profile?.affairName || 'your affair'}`}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isAdmin && docs.length === 0 && (
            <button className="db-btn db-btn-ghost" onClick={seedStatic}>⬆ Seed from static</button>
          )}
          {isAdmin && <button className="db-btn db-btn-primary" onClick={openAdd}>+ Add Affair</button>}
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.35)' }}>Loading…</p>
      ) : (
        <div className="affairs-cards">
          {items.length === 0 && (
            <p style={{ color: 'rgba(255,255,255,0.35)', padding: '32px 0' }}>No affairs found. Use "Seed from static" or "Add Affair".</p>
          )}
          {items.map(item => (
            <div key={item.id} className="affair-mgmt-card" style={{ '--ac': item.color || '#1a3a6b' }}>
              <div className="amc-top">
                <span className="amc-icon">{item.icon}</span>
                <div>
                  <h3>{item.name}</h3>
                  <div className="amc-leaders">
                    <span>Head: <strong>{item.head?.name || '—'}</strong></span>
                    <span>Assoc: <strong>{item.associativeHead?.name || '—'}</strong></span>
                  </div>
                </div>
              </div>
              <p className="amc-desc">{item.description?.slice(0, 120)}…</p>
              {canEdit(item) && (
                <div className="db-table-actions" style={{ marginTop: 12 }}>
                  <button className="db-btn db-btn-ghost" style={{ padding: '7px 14px', fontSize: '0.82rem' }} onClick={() => openEdit(item)}>Edit</button>
                  {isAdmin && <button className="db-btn db-btn-danger" style={{ padding: '7px 14px', fontSize: '0.82rem' }} onClick={() => handleDelete(item.id)}>Delete</button>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="db-modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="db-modal" style={{ maxWidth: 620 }}>
            <button className="db-modal-close" onClick={closeModal}>✕</button>
            <h2>{editId ? 'Edit Affair' : 'Add Affair'}</h2>
            {error && <div className="db-error" style={{ marginBottom: 16 }}>{error}</div>}
            <form onSubmit={handleSave} className="db-form">
              <div className="db-form-row">
                <div className="db-field">
                  <label>Affair Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. HUSU Academic Affair" />
                </div>
                <div className="db-form-row" style={{ gap: 8 }}>
                  <div className="db-field">
                    <label>Icon</label>
                    <input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="🎓" style={{ fontSize: '1.3rem' }} />
                  </div>
                  <div className="db-field">
                    <label>Color</label>
                    <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} style={{ padding: '4px', height: 44, cursor: 'pointer' }} />
                  </div>
                </div>
              </div>
              <div className="db-field">
                <label>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What does this affair do?" style={{ minHeight: 80 }} />
              </div>
              <div className="db-form-row">
                <div className="db-field">
                  <label>Head Name</label>
                  <input value={form.headName} onChange={e => setForm(f => ({ ...f, headName: e.target.value }))} placeholder="Full name" />
                </div>
                <div className="db-field">
                  <label>Assoc. Head Name</label>
                  <input value={form.assocName} onChange={e => setForm(f => ({ ...f, assocName: e.target.value }))} placeholder="Full name" />
                </div>
              </div>
              <div className="db-form-actions">
                <button type="button" className="db-btn db-btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="db-btn db-btn-primary" disabled={saving}>{saving ? 'Saving…' : (editId ? 'Update' : 'Create')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
