import { useState } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { auth, secondaryAuth, db } from '../firebase'
import { useCollection } from '../hooks/useFirestore'
import { deleteDocument } from '../hooks/useFirestore'
import { ROLE_LABELS, ROLE_COLORS, DASHBOARD_ROLES, HIGHER_MGMT_ROLES } from './roles'
import './Dashboard.css'

// Roles admin can assign
const ASSIGNABLE_ROLES = [
  'member', 'president', 'vice_president', 'general_secretary',
  'general_speaker', 'general_auditor', 'affair_head', 'assoc_head',
  'news_org', 'events_org', 'admin',
]

// Roles that need affair assignment
const AFFAIR_ROLES = ['affair_head', 'assoc_head']

const emptyForm = {
  name: '', email: '', password: '',
  role: 'member', affairId: '', affairName: '',
}

export default function ManageUsers() {
  const { docs: allUsers, loading } = useCollection('users',   'createdAt')
  const { docs: affairs }           = useCollection('affairs', 'createdAt')
  const [modal,        setModal]        = useState(false)
  const [approveModal, setApproveModal] = useState(null)
  const [form,         setForm]         = useState(emptyForm)
  const [editId,       setEditId]       = useState(null)
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState('')

  const pending = allUsers.filter(u => u.status === 'pending')
  const active  = allUsers.filter(u => u.status !== 'pending')

  const openAdd  = () => { setForm(emptyForm); setEditId(null); setError(''); setModal(true) }
  const openEdit = (u) => {
    setForm({
      name: u.name || '', email: u.email || '', password: '',
      role: u.role || 'member', affairId: u.affairId || '', affairName: u.affairName || '',
    })
    setEditId(u.id); setError(''); setModal(true)
  }
  const closeModal = () => { setModal(false); setForm(emptyForm); setEditId(null); setError('') }

  // ── Approve pending user ──
  const openApprove = (u) => {
    setForm({ name: u.name || '', email: u.email || '', password: '', role: 'member', affairId: '', affairName: '' })
    setApproveModal(u); setError('')
  }

  const handleApprove = async e => {
    e.preventDefault()
    if (!approveModal) return
    setSaving(true)
    try {
      await updateDoc(doc(db, 'users', approveModal.id), {
        role:       form.role,
        affairId:   form.affairId   || '',
        affairName: form.affairName || '',
        status:     'active',
      })

      // Update affair assignment if needed
      if (AFFAIR_ROLES.includes(form.role) && form.affairId) {
        const field = form.role === 'affair_head' ? 'headUid' : 'assocUid'
        await updateDoc(doc(db, 'affairs', form.affairId), { [field]: approveModal.id })
      }

      // Send welcome letter
      await sendSystemLetter({
        toUid: approveModal.id,
        toName: approveModal.name,
        subject: 'Welcome to HUSU — Your account has been approved',
        body: `Dear ${approveModal.name},\n\nYour account has been approved by the administrator. You have been assigned the role of ${ROLE_LABELS[form.role] || form.role}${form.affairName ? ` for ${form.affairName}` : ''}.\n\nPlease log in and complete your profile.\n\nWelcome!\nHUSU Administration`,
      })

      setApproveModal(null)
    } catch (err) {
      setError(err.message || 'Failed to approve.')
    } finally {
      setSaving(false)
    }
  }

  const handleReject = async (id) => {
    if (!confirm('Reject and remove this signup request?')) return
    await deleteDocument('users', id)
  }

  // ── Send system letter ──
  const sendSystemLetter = async ({ toUid, toName, subject, body }) => {
    if (!toUid) return
    await addDoc(collection(db, 'letters'), {
      subject, body,
      fromUid:   'system',
      fromName:  'HUSU Administration',
      fromRole:  'admin',
      toUids:    [toUid],
      reads:     {},
      responses: {},
      createdAt: serverTimestamp(),
    })
  }

  // ── Save (add/edit) ──
  const handleSave = async e => {
    e.preventDefault()
    if (!form.name || !form.email) { setError('Name and email are required.'); return }
    if (!editId && !form.password) { setError('Password is required for new users.'); return }
    setSaving(true)
    try {
      if (editId) {
        const prev = allUsers.find(u => u.id === editId)
        await updateDoc(doc(db, 'users', editId), {
          name:       form.name,
          role:       form.role,
          affairId:   form.affairId   || '',
          affairName: form.affairName || '',
        })

        // Update affair assignments if role changed
        if (AFFAIR_ROLES.includes(form.role) && form.affairId) {
          const field = form.role === 'affair_head' ? 'headUid' : 'assocUid'
          await updateDoc(doc(db, 'affairs', form.affairId), { [field]: editId })
        }
        // Clear old affair if changed
        if (prev?.affairId && prev.affairId !== form.affairId) {
          const prevAffair = affairs.find(a => a.id === prev.affairId)
          if (prevAffair) {
            const prevField = prev.role === 'affair_head' ? 'headUid' : 'assocUid'
            if (prevAffair[prevField] === editId) {
              await updateDoc(doc(db, 'affairs', prev.affairId), { [prevField]: '' })
            }
          }
        }

        // Send role change letter if role changed
        if (prev?.role !== form.role || prev?.affairId !== form.affairId) {
          await sendSystemLetter({
            toUid: editId,
            toName: form.name,
            subject: 'Your position has been updated',
            body: `Dear ${form.name},\n\nYour position has been updated to: ${ROLE_LABELS[form.role] || form.role}${form.affairName ? ` — ${form.affairName}` : ''}.\n\nPlease update your profile if needed.\n\nHUSU Administration`,
          })
        }
      } else {
        const cred = await createUserWithEmailAndPassword(secondaryAuth, form.email, form.password)
        await setDoc(doc(db, 'users', cred.user.uid), {
          name: form.name, email: form.email,
          role: form.role, affairId: form.affairId || '',
          affairName: form.affairName || '',
          status: 'active', createdAt: new Date().toISOString(),
        })
        // Sign out the secondary auth instance — admin session is unaffected
        await secondaryAuth.signOut()
      }
      closeModal()
    } catch (err) {
      setError(err.message || 'Failed to save user.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this user? (Auth account remains)')) return
    await deleteDocument('users', id)
  }

  const AffairSelect = ({ value, onChange }) => (
    <div className="db-field">
      <label>Assigned Affair</label>
      <select value={value} onChange={e => {
        const sel = affairs.find(a => a.id === e.target.value)
        onChange(e.target.value, sel?.name || '')
      }}>
        <option value="">— Select affair —</option>
        {affairs.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
      </select>
    </div>
  )

  const RoleForm = ({ form, setForm }) => (
    <>
      <div className="db-field">
        <label>Position / Role *</label>
        <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value, affairId: '', affairName: '' }))}>
          {ASSIGNABLE_ROLES.map(r => (
            <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>
          ))}
        </select>
      </div>
      {AFFAIR_ROLES.includes(form.role) && (
        <AffairSelect value={form.affairId} onChange={(id, name) => setForm(f => ({ ...f, affairId: id, affairName: name }))} />
      )}
    </>
  )

  return (
    <div className="dash-page">
      <div className="dash-page-header">
        <div>
          <h1>🔐 Members & Roles</h1>
          <p>Manage members, approve signups, and assign positions</p>
        </div>
        <button className="db-btn db-btn-primary" onClick={openAdd}>+ Add Member</button>
      </div>

      {/* ── Pending requests ── */}
      {pending.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>⏳ Pending Approval</h2>
            <span style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 20, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 700 }}>
              {pending.length}
            </span>
          </div>
          <div className="db-table-wrap">
            <table className="db-table">
              <thead><tr><th>Name</th><th>Email</th><th>Requested</th><th>Actions</th></tr></thead>
              <tbody>
                {pending.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#4a7fd4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', color: '#fff', flexShrink: 0 }}>
                          {(u.name || '?')[0].toUpperCase()}
                        </div>
                        <span style={{ color: '#fff', fontWeight: 600 }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>{u.email}</td>
                    <td style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem' }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                    <td>
                      <div className="db-table-actions">
                        <button className="db-btn db-btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={() => openApprove(u)}>✓ Approve</button>
                        <button className="db-btn db-btn-danger"  style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleReject(u.id)}>✕ Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Active members ── */}
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: 14 }}>👥 Members ({active.length})</h2>
      {loading ? <p style={{ color: 'rgba(255,255,255,0.35)' }}>Loading…</p> : (
        <div className="db-table-wrap">
          <table className="db-table">
            <thead><tr><th>Name</th><th>Email</th><th>Position</th><th>Affair</th><th>Actions</th></tr></thead>
            <tbody>
              {active.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', padding: '32px' }}>No active members yet.</td></tr>
              )}
              {active.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {u.image
                        ? <img src={u.image} alt={u.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        : <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#1a3a6b,#2a5298)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', color: '#fff', flexShrink: 0 }}>
                            {(u.name || '?')[0].toUpperCase()}
                          </div>
                      }
                      <span style={{ color: '#fff', fontWeight: 600 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>{u.email}</td>
                  <td>
                    <span className="db-tag" style={{ color: ROLE_COLORS[u.role] || '#64748b' }}>
                      {ROLE_LABELS[u.role] || u.role || 'Member'}
                    </span>
                  </td>
                  <td style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem' }}>{u.affairName || '—'}</td>
                  <td>
                    <div className="db-table-actions">
                      <button className="db-btn db-btn-ghost"  style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => openEdit(u)}>Edit</button>
                      <button className="db-btn db-btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleDelete(u.id)}>Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Approve modal ── */}
      {approveModal && (
        <div className="db-modal-overlay" onClick={e => e.target === e.currentTarget && setApproveModal(null)}>
          <div className="db-modal">
            <button className="db-modal-close" onClick={() => setApproveModal(null)}>✕</button>
            <h2>✓ Approve Member</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.88rem', marginBottom: 20 }}>
              Approving <strong style={{ color: '#fff' }}>{approveModal.name}</strong>.<br />
              Optionally assign a position now, or leave as Member and assign later.
            </p>
            {error && <div className="db-error" style={{ marginBottom: 16 }}>{error}</div>}
            <form onSubmit={handleApprove} className="db-form">
              <RoleForm form={form} setForm={setForm} />
              <div className="db-form-actions">
                <button type="button" className="db-btn db-btn-danger" onClick={() => handleReject(approveModal.id)}>✕ Reject</button>
                <button type="submit" className="db-btn db-btn-primary" disabled={saving}>{saving ? 'Approving…' : '✓ Approve & Activate'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add/Edit modal ── */}
      {modal && (
        <div className="db-modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="db-modal">
            <button className="db-modal-close" onClick={closeModal}>✕</button>
            <h2>{editId ? 'Edit Member' : 'Add New Member'}</h2>
            {error && <div className="db-error" style={{ marginBottom: 16 }}>{error}</div>}
            <form onSubmit={handleSave} className="db-form">
              <div className="db-form-row">
                <div className="db-field">
                  <label>Full Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
                </div>
                <div className="db-field">
                  <label>Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@haramaya.edu.et" disabled={!!editId} />
                </div>
              </div>
              {!editId && (
                <div className="db-field">
                  <label>Password *</label>
                  <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" />
                </div>
              )}
              <RoleForm form={form} setForm={setForm} />
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
