import { useState } from 'react'
import { useCollection, addDocument, updateDocument, deleteDocument } from '../hooks/useFirestore'
import { events as staticEvents } from '../data/data'
import './Dashboard.css'

const CATEGORIES = ['Sports', 'Academic', 'Workshop', 'Culture']
const catColors  = { Sports: '#10b981', Academic: '#4a7fd4', Workshop: '#a78bfa', Culture: '#e8a020' }

const empty = {
  title: '', description: '', category: 'Academic',
  date: new Date().toISOString().split('T')[0],
  time: '', location: '',
}

export default function ManageEvents() {
  const { docs, loading } = useCollection('events', 'date')
  const [modal, setModal]   = useState(false)
  const [form, setForm]     = useState(empty)
  const [editId, setEditId] = useState(null)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const filtered = docs.filter(e =>
    e.title?.toLowerCase().includes(search.toLowerCase()) ||
    e.category?.toLowerCase().includes(search.toLowerCase())
  )

  const openAdd  = () => { setForm(empty); setEditId(null); setError(''); setModal(true) }
  const openEdit = (item) => {
    setForm({ title: item.title, description: item.description, category: item.category, date: item.date, time: item.time || '', location: item.location || '' })
    setEditId(item.id); setError(''); setModal(true)
  }
  const closeModal = () => { setModal(false); setForm(empty); setEditId(null); setError('') }

  const handleSave = async e => {
    e.preventDefault()
    if (!form.title || !form.date) { setError('Title and date are required.'); return }
    setSaving(true)
    try {
      if (editId) await updateDocument('events', editId, form)
      else         await addDocument('events', form)
      closeModal()
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this event?')) return
    await deleteDocument('events', id)
  }

  const seedStatic = async () => {
    if (!confirm('Seed all static events into Firestore?')) return
    for (const item of staticEvents) {
      await addDocument('events', { title: item.title, description: item.description, category: item.category, date: item.date, time: item.time, location: item.location })
    }
  }

  return (
    <div className="dash-page">
      <div className="dash-page-header">
        <div>
          <h1>📅 Events Management</h1>
          <p>Create, edit and delete events</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {docs.length === 0 && (
            <button className="db-btn db-btn-ghost" onClick={seedStatic}>⬆ Seed from static</button>
          )}
          <button className="db-btn db-btn-primary" onClick={openAdd}>+ Add Event</button>
        </div>
      </div>

      <div className="db-search-bar">
        <input className="db-search-input" placeholder="Search events…" value={search} onChange={e => setSearch(e.target.value)} />
        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)' }}>{filtered.length} items</span>
      </div>

      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.35)' }}>Loading…</p>
      ) : (
        <div className="db-table-wrap">
          <table className="db-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Date</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', padding: '32px' }}>No events found. Click "Add Event" to create one.</td></tr>
              )}
              {filtered.map(item => (
                <tr key={item.id}>
                  <td>
                    <span style={{ color: '#fff', fontWeight: 600 }}>{item.title}</span>
                  </td>
                  <td>
                    <span className="db-tag" style={{ color: catColors[item.category] || '#4a7fd4' }}>{item.category}</span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{item.date}</td>
                  <td style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', maxWidth: 180 }}>{item.location}</td>
                  <td>
                    <div className="db-table-actions">
                      <button className="db-btn db-btn-ghost" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => openEdit(item)}>Edit</button>
                      <button className="db-btn db-btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleDelete(item.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="db-modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="db-modal">
            <button className="db-modal-close" onClick={closeModal}>✕</button>
            <h2>{editId ? 'Edit Event' : 'Add Event'}</h2>
            {error && <div className="db-error" style={{ marginBottom: 16 }}>{error}</div>}
            <form onSubmit={handleSave} className="db-form">
              <div className="db-field">
                <label>Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Event name" />
              </div>
              <div className="db-field">
                <label>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the event…" />
              </div>
              <div className="db-form-row">
                <div className="db-field">
                  <label>Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="db-field">
                  <label>Date *</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
              </div>
              <div className="db-form-row">
                <div className="db-field">
                  <label>Time</label>
                  <input value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} placeholder="e.g. 9:00 AM – 1:00 PM" />
                </div>
                <div className="db-field">
                  <label>Location</label>
                  <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Venue / place" />
                </div>
              </div>
              <div className="db-form-actions">
                <button type="button" className="db-btn db-btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="db-btn db-btn-primary" disabled={saving}>{saving ? 'Saving…' : (editId ? 'Update' : 'Publish')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
