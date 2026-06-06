import { useState } from 'react'
import { useCollection, addDocument, updateDocument, deleteDocument } from '../hooks/useFirestore'
import { news as staticNews } from '../data/data'
import './Dashboard.css'

const CATEGORIES = ['Announcement', 'Academic', 'Service', 'Discipline']
const catColors  = { Announcement: '#4a7fd4', Academic: '#10b981', Service: '#e8a020', Discipline: '#a78bfa' }

const empty = { title: '', summary: '', category: 'Announcement', date: new Date().toISOString().split('T')[0] }

export default function ManageNews() {
  const { docs, loading } = useCollection('news', 'date')
  const [modal, setModal] = useState(false)
  const [form, setForm]   = useState(empty)
  const [editId, setEditId] = useState(null)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  // Use static data as fallback display only
  const items = docs.length > 0 ? docs : []

  const filtered = items.filter(n =>
    n.title?.toLowerCase().includes(search.toLowerCase()) ||
    n.category?.toLowerCase().includes(search.toLowerCase())
  )

  const openAdd  = () => { setForm(empty); setEditId(null); setError(''); setModal(true) }
  const openEdit = (item) => { setForm({ title: item.title, summary: item.summary, category: item.category, date: item.date }); setEditId(item.id); setError(''); setModal(true) }
  const closeModal = () => { setModal(false); setForm(empty); setEditId(null); setError('') }

  const handleSave = async e => {
    e.preventDefault()
    if (!form.title || !form.summary || !form.date) { setError('All fields are required.'); return }
    setSaving(true)
    try {
      if (editId) await updateDocument('news', editId, form)
      else         await addDocument('news', form)
      closeModal()
    } catch (err) {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this news item?')) return
    await deleteDocument('news', id)
  }

  const seedStatic = async () => {
    if (!confirm('Seed all static news items into Firestore?')) return
    for (const item of staticNews) {
      await addDocument('news', { title: item.title, summary: item.summary, category: item.category, date: item.date })
    }
  }

  return (
    <div className="dash-page">
      <div className="dash-page-header">
        <div>
          <h1>📰 News Management</h1>
          <p>Create, edit and delete news articles</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {docs.length === 0 && (
            <button className="db-btn db-btn-ghost" onClick={seedStatic}>⬆ Seed from static</button>
          )}
          <button className="db-btn db-btn-primary" onClick={openAdd}>+ Add News</button>
        </div>
      </div>

      <div className="db-search-bar">
        <input className="db-search-input" placeholder="Search news…" value={search} onChange={e => setSearch(e.target.value)} />
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', padding: '32px' }}>No news found. Click "Add News" to create one.</td></tr>
              )}
              {filtered.map(item => (
                <tr key={item.id}>
                  <td style={{ maxWidth: 320 }}>
                    <span style={{ color: '#fff', fontWeight: 600 }}>{item.title}</span>
                    <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.38)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>{item.summary}</p>
                  </td>
                  <td>
                    <span className="db-tag" style={{ color: catColors[item.category] || '#4a7fd4' }}>{item.category}</span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{item.date}</td>
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
            <h2>{editId ? 'Edit News' : 'Add News'}</h2>
            {error && <div className="db-error" style={{ marginBottom: 16 }}>{error}</div>}
            <form onSubmit={handleSave} className="db-form">
              <div className="db-field">
                <label>Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="News headline" />
              </div>
              <div className="db-field">
                <label>Summary *</label>
                <textarea value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} placeholder="Brief description of the news…" />
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
