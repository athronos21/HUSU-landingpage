import { useState } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { useCollection } from '../hooks/useFirestore'
import { updateDocument, deleteDocument } from '../hooks/useFirestore'
import './Dashboard.css'

const ROLES = ['admin', 'affair_head', 'news_org', 'events_org']
const roleLabel = { admin: 'Administrator', affair_head: 'Affair Head', news_org: 'News Organizer', events_org: 'Events Organizer' }
const roleColors = { admin: '#e8a020', affair_head: '#4a7fd4', news_org: '#10b981', events_org: '#a78bfa' }

const emptyForm = { name: '', email: '', password: '', role: 'news_org', affairId: '', affairName: '' }

export default function ManageUsers() {
  const { docs: users, loading } = useCollection('users', 'createdAt')
  const { docs: affairs }        = useCollection('affairs', 'createdAt')
  const [modal, setModal]   = useState(false)
  const [form, setForm]     = useState(emptyForm)
  const [editId, setEditId] = useState(null)  // uid for role-only edit
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const openAdd  = () => { setForm(emptyForm); setEditId(null); setError(''); setModal(true) }
  const openEdit = (u) => {
    setForm({ name: u.name || '', email: u.email || '', password: '', role: u.role || 'news_org', affairId: u.affairId || '', affairName: u.affairName || '' })
    setEditId(u.id); setError(''); setModal(true)
  }
  const closeModal = () => { setModal(false); setForm(emptyForm); setEditId(null); setError('') }

  const handleSave = async e => {
    e.preventDefault()
    if (!form.name || !form.email) { setError('Name and email are required.'); return }
    if (!editId && !form.password) { setError('Password is required for new users.'); return }
    setSaving(true)
    try {
      if (editId) {
        // Update role/name only (can't change email/password here)
        await updateDocument('users', editId, { name: form.name, role: form.role, affairId: form.affairId, affairName: form.affairName })
      } else {
        // Create new user
        const cred = await createUserWithEmailAndPassword(auth, form.email, form.password)
        await setDoc(doc(db, 'users', cred.user.uid), {
          name:        form.name,
          email:       form.email,
          role:        form.role,
          affairId:    form.affairId,
          affairName:  form.affairName,
          createdAt:   new Date(),
        })
      }
      closeModal()
    } catch (err) {
      setError(err.message || 'Failed to save user.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this user from the system? (Auth account remains)')) return
    await deleteDocument('users', id)
  }

  return (
    <div className="dash-page">
      <div className="dash-page-header">
        <div>
          <h1>🔐 User Management</h1>
          <p>Create accounts and assign roles to staff members</p>
        </div>
        <button className="db-btn db-btn-primary" onClick={openAdd}>+ Add User</button>
      </div>

      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.35)' }}>Loading…</p>
      ) : (
        <div className="db-table-wrap">
          <table className="db-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Affair</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', padding: '32px' }}>No users yet. Add your first user above.</td></tr>
              )}
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#1a3a6b,#2a5298)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', color: '#fff', flexShrink: 0 }}>
                        {(u.name || '?')[0].toUpperCase()}
                      </div>
                      <span style={{ color: '#fff', fontWeight: 600 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>{u.email}</td>
                  <td>
                    <span className="db-tag" style={{ color: roleColors[u.role] || '#e8a020' }}>{roleLabel[u.role] || u.role}</span>
                  </td>
                  <td style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem' }}>{u.affairName || '—'}</td>
                  <td>
                    <div className="db-table-actions">
                      <button className="db-btn db-btn-ghost" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => openEdit(u)}>Edit Role</button>
                      <button className="db-btn db-btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleDelete(u.id)}>Remove</button>
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
            <h2>{editId ? 'Edit User Role' : 'Add New User'}</h2>
            {error && <div className="db-error" style={{ marginBottom: 16 }}>{error}</div>}
            <form onSubmit={handleSave} className="db-form">
              <div className="db-form-row">
                <div className="db-field">
                  <label>Full Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
                </div>
                <div className="db-field">
                  <label>Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="user@haramaya.edu.et" disabled={!!editId} />
                </div>
              </div>
              {!editId && (
                <div className="db-field">
                  <label>Password *</label>
                  <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" />
                </div>
              )}
              <div className="db-field">
                <label>Role *</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  {ROLES.map(r => <option key={r} value={r}>{roleLabel[r]}</option>)}
                </select>
              </div>
              {form.role === 'affair_head' && (
                <div className="db-field">
                  <label>Assigned Affair</label>
                  <select value={form.affairId} onChange={e => {
                    const sel = affairs.find(a => a.id === e.target.value)
                    setForm(f => ({ ...f, affairId: e.target.value, affairName: sel?.name || '' }))
                  }}>
                    <option value="">— Select affair —</option>
                    {affairs.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              )}
              <div className="db-form-actions">
                <button type="button" className="db-btn db-btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="db-btn db-btn-primary" disabled={saving}>{saving ? 'Saving…' : (editId ? 'Update' : 'Create User')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
