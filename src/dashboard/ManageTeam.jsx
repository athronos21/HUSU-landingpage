import { useState } from 'react'
import { useCollection, addDocument, updateDocument, deleteDocument } from '../hooks/useFirestore'
import { management as staticTeam } from '../data/data'
import './Dashboard.css'

const TITLES = ['President', 'Vice President', 'General Secretary', 'General Speaker', 'General Auditor', 'Other']
const empty  = { title: 'President', name: '', bio: '', image: null }

export default function ManageTeam() {
  const { docs, loading } = useCollection('team', 'createdAt')
  const [modal, setModal]   = useState(false)
  const [form, setForm]     = useState(empty)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const openAdd  = () => { setForm(empty); setEditId(null); setError(''); setModal(true) }
  const openEdit = (item) => {
    setForm({ title: item.title || '', name: item.name || '', bio: item.bio || '', image: item.image || null })
    setEditId(item.id); setError(''); setModal(true)
  }
  const closeModal = () => { setModal(false); setForm(empty); setEditId(null); setError('') }

  const handleSave = async e => {
    e.preventDefault()
    if (!form.name || !form.title) { setError('Name and title are required.'); return }
    setSaving(true)
    try {
      if (editId) await updateDocument('team', editId, { title: form.title, name: form.name, bio: form.bio, image: null })
      else         await addDocument('team', { title: form.title, name: form.name, bio: form.bio, image: null })
      closeModal()
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this team member?')) return
    await deleteDocument('team', id)
  }

  const seedStatic = async () => {
    if (!confirm('Seed static team members into Firestore?')) return
    for (const m of staticTeam) {
      await addDocument('team', { title: m.title, name: m.name, bio: m.bio, image: null })
    }
  }

  function initials(name) {
    return name?.split(' ').map(n => n[0]).join('') || '?'
  }

  return (
    <div className="dash-page">
      <div className="dash-page-header">
        <div>
          <h1>👥 Leadership Management</h1>
          <p>Manage union leadership team members</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {docs.length === 0 && (
            <button className="db-btn db-btn-ghost" onClick={seedStatic}>⬆ Seed from static</button>
          )}
          <button className="db-btn db-btn-primary" onClick={openAdd}>+ Add Member</button>
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.35)' }}>Loading…</p>
      ) : (
        <div className="team-mgmt-grid">
          {docs.length === 0 && (
            <p style={{ color: 'rgba(255,255,255,0.35)', padding: '32px 0' }}>No team members. Click "Add Member" or seed from static data.</p>
          )}
          {docs.map(member => (
            <div key={member.id} className="team-mgmt-card">
              <div className="tmc-avatar">{initials(member.name)}</div>
              <div className="tmc-body">
                <span className="tmc-title">{member.title}</span>
                <h4>{member.name}</h4>
                <p>{member.bio?.slice(0, 90)}…</p>
              </div>
              <div className="db-table-actions" style={{ marginTop: 12 }}>
                <button className="db-btn db-btn-ghost" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => openEdit(member)}>Edit</button>
                <button className="db-btn db-btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleDelete(member.id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="db-modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="db-modal">
            <button className="db-modal-close" onClick={closeModal}>✕</button>
            <h2>{editId ? 'Edit Member' : 'Add Member'}</h2>
            {error && <div className="db-error" style={{ marginBottom: 16 }}>{error}</div>}
            <form onSubmit={handleSave} className="db-form">
              <div className="db-form-row">
                <div className="db-field">
                  <label>Title / Role *</label>
                  <select value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}>
                    {TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="db-field">
                  <label>Full Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
                </div>
              </div>
              <div className="db-field">
                <label>Bio</label>
                <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Short biography…" />
              </div>
              <div className="db-form-actions">
                <button type="button" className="db-btn db-btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="db-btn db-btn-primary" disabled={saving}>{saving ? 'Saving…' : (editId ? 'Update' : 'Add')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
