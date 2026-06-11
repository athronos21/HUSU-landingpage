import { useState } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import { useCollection, deleteDocument } from '../hooks/useFirestore'
import { useAuth } from '../context/AuthContext'
import { affairs as staticAffairs } from '../data/data'
import IconPicker, { renderIcon } from './IconPicker'
import './Dashboard.css'

const COLORS = [
  '#1a3a6b','#7c3aed','#059669','#dc2626','#d97706',
  '#0891b2','#be185d','#65a30d','#9333ea','#0284c7',
]

const empty = {
  name: '', icon: { type: 'emoji', value: '🏛️' },
  description: '', color: '#1a3a6b',
  headUid: '', assocUid: '', status: 'active', image: null,
}

/* ── Auto-send assignment letter ── */
async function sendAssignmentLetter({ fromUid, fromName, toUid, affairName, roleLabel }) {
  if (!toUid) return
  await addDoc(collection(db, 'letters'), {
    subject:   `You have been assigned as ${roleLabel} of ${affairName}`,
    body:      `Dear colleague,\n\nYou have been officially assigned as the ${roleLabel} of ${affairName} by the administrator.\n\nPlease log in to the dashboard, go to My Profile, and complete your profile information including your photo, bio, phone number, and Telegram username. This information will appear on the public website.\n\nWelcome to your role!\n\nHUSU Administration`,
    fromUid:   fromUid,
    fromName:  fromName || 'HUSU Administration',
    fromRole:  'admin',
    toUids:    [toUid],
    reads:     {},
    responses: {},
    createdAt: serverTimestamp(),
  })
}

export default function ManageAffairs() {
  const { user, profile } = useAuth()
  const { docs, loading }       = useCollection('affairs', 'createdAt')
  const { docs: allUsers }      = useCollection('users',   'createdAt')
  const [modal,   setModal]     = useState(false)
  const [form,    setForm]      = useState(empty)
  const [editId,  setEditId]    = useState(null)
  const [prevHeadUid,  setPrevHeadUid]  = useState('')
  const [prevAssocUid, setPrevAssocUid] = useState('')
  const [saving,  setSaving]    = useState(false)
  const [error,   setError]     = useState('')
  const [search,  setSearch]    = useState('')

  const role    = profile?.role
  const isAdmin = role === 'admin'

  // Users eligible to be heads
  const headCandidates  = allUsers.filter(u => u.role === 'affair_head' && u.status !== 'pending')
  const assocCandidates = allUsers.filter(u => u.role === 'assoc_head'  && u.status !== 'pending')

  const filtered = docs.filter(a => {
    if (!isAdmin && profile?.affairId) return a.id === profile.affairId
    return a.name?.toLowerCase().includes(search.toLowerCase())
  })

  const canEdit = (item) => isAdmin || (role === 'affair_head' && profile?.affairId === item.id)

  const getUser = (uid) => allUsers.find(u => u.id === uid)

  const openAdd = () => {
    setForm(empty); setEditId(null)
    setPrevHeadUid(''); setPrevAssocUid('')
    setError(''); setModal(true)
  }

  const openEdit = (item) => {
    setForm({
      name:        item.name        || '',
      icon:        item.icon        || { type: 'emoji', value: '🏛️' },
      description: item.description || '',
      color:       item.color       || '#1a3a6b',
      headUid:     item.headUid     || '',
      assocUid:    item.assocUid    || '',
      status:      item.status      || 'active',
      image:       item.image       || null,
    })
    setPrevHeadUid(item.headUid   || '')
    setPrevAssocUid(item.assocUid || '')
    setEditId(item.id); setError(''); setModal(true)
  }

  const closeModal = () => { setModal(false); setForm(empty); setEditId(null); setError('') }

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async e => {
    e.preventDefault()
    if (!form.name) { setError('Affair name is required.'); return }
    setSaving(true)

    const headUser  = getUser(form.headUid)
    const assocUser = getUser(form.assocUid)

    const data = {
      name:        form.name,
      icon:        form.icon,
      description: form.description,
      color:       form.color,
      status:      form.status,
      image:       form.image || null,
      headUid:     form.headUid  || '',
      assocUid:    form.assocUid || '',
      // Keep embedded snapshot for display fallback
      head: headUser ? {
        name:     headUser.name     || '',
        image:    headUser.image    || null,
        phone:    headUser.phone    || '',
        telegram: headUser.telegram || '',
        email:    headUser.email    || '',
        title:    'Head',
        uid:      form.headUid,
      } : null,
      associativeHead: assocUser ? {
        name:     assocUser.name     || '',
        image:    assocUser.image    || null,
        phone:    assocUser.phone    || '',
        telegram: assocUser.telegram || '',
        email:    assocUser.email    || '',
        title:    'Associative Head',
        uid:      form.assocUid,
      } : null,
    }

    try {
      let affairId = editId
      if (editId) {
        await updateDoc(doc(db, 'affairs', editId), data)
      } else {
        const ref = await addDoc(collection(db, 'affairs'), {
          ...data, createdAt: serverTimestamp(),
        })
        affairId = ref.id
      }

      // Update users' affairId assignment
      if (form.headUid) {
        await updateDoc(doc(db, 'users', form.headUid), {
          affairId: affairId, affairName: form.name,
        })
      }
      if (form.assocUid) {
        await updateDoc(doc(db, 'users', form.assocUid), {
          affairId: affairId, affairName: form.name,
        })
      }
      // Clear old assignments if changed
      if (prevHeadUid && prevHeadUid !== form.headUid) {
        await updateDoc(doc(db, 'users', prevHeadUid), { affairId: '', affairName: '' })
      }
      if (prevAssocUid && prevAssocUid !== form.assocUid) {
        await updateDoc(doc(db, 'users', prevAssocUid), { affairId: '', affairName: '' })
      }

      // Auto-send assignment letters for new assignments
      if (form.headUid && form.headUid !== prevHeadUid) {
        await sendAssignmentLetter({
          fromUid:   user?.uid,
          fromName:  profile?.name || 'HUSU Administration',
          toUid:     form.headUid,
          affairName: form.name,
          roleLabel: 'Head',
        })
      }
      if (form.assocUid && form.assocUid !== prevAssocUid) {
        await sendAssignmentLetter({
          fromUid:   user?.uid,
          fromName:  profile?.name || 'HUSU Administration',
          toUid:     form.assocUid,
          affairName: form.name,
          roleLabel: 'Associative Head',
        })
      }

      closeModal()
    } catch (err) {
      setError('Failed to save: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this affair permanently?')) return
    await deleteDoc(doc(db, 'affairs', id))
  }

  const seedStatic = async () => {
    if (!confirm(`Seed ${staticAffairs.length} static affairs?`)) return
    for (const a of staticAffairs) {
      await addDoc(collection(db, 'affairs'), {
        name: a.name, icon: a.icon, description: a.description,
        color: a.color, status: 'active', headUid: '', assocUid: '',
        head: a.head, associativeHead: a.associativeHead,
        createdAt: serverTimestamp(),
      })
    }
  }

  const UserSelect = ({ label, value, onChange, candidates, placeholder }) => (
    <div className="db-field">
      <label>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {candidates.map(u => (
          <option key={u.id} value={u.id}>{u.name} {u.affairName ? `(${u.affairName})` : '(unassigned)'}</option>
        ))}
      </select>
      {value && (() => {
        const u = getUser(value)
        if (!u) return null
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.07)' }}>
            {u.image
              ? <img src={u.image} alt={u.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
              : <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1a3a6b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '0.85rem' }}>{(u.name||'?')[0]}</div>
            }
            <div>
              <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600, color: '#fff' }}>{u.name}</p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{u.email}</p>
            </div>
          </div>
        )
      })()}
    </div>
  )

  return (
    <div className="dash-page">
      <div className="dash-page-header">
        <div>
          <h1>🏛️ Affairs Management</h1>
          <p>{isAdmin ? `Managing all ${docs.length} affair${docs.length !== 1 ? 's' : ''}` : `Managing: ${profile?.affairName || 'your affair'}`}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isAdmin && docs.length === 0 && <button className="db-btn db-btn-ghost" onClick={seedStatic}>⬆ Seed</button>}
          {isAdmin && <button className="db-btn db-btn-primary" onClick={openAdd}>+ Add Affair</button>}
        </div>
      </div>

      {isAdmin && docs.length > 0 && (
        <div className="db-search-bar">
          <input className="db-search-input" placeholder="Search affairs…" value={search} onChange={e => setSearch(e.target.value)} />
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)' }}>{filtered.length} affair{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {loading ? <p style={{ color: 'rgba(255,255,255,0.35)' }}>Loading…</p> : (
        <div className="affairs-cards">
          {filtered.length === 0 && (
            <p style={{ color: 'rgba(255,255,255,0.35)', padding: '32px 0' }}>
              {docs.length === 0 ? 'No affairs yet.' : 'No affairs match your search.'}
            </p>
          )}
          {filtered.map(item => {
            const head  = item.headUid  ? getUser(item.headUid)  : null
            const assoc = item.assocUid ? getUser(item.assocUid) : null
            return (
              <div key={item.id} className="affair-mgmt-card" style={{ '--ac': item.color || '#1a3a6b' }}>
                <div className="amc-top">
                  <span className="amc-icon">{renderIcon(item.icon, 32) || '🏛️'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <h3>{item.name}</h3>
                      <span style={{
                        fontSize: '0.62rem', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
                        padding: '2px 8px', borderRadius: 20,
                        background: item.status === 'active' ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.06)',
                        color: item.status === 'active' ? '#22c55e' : 'rgba(255,255,255,0.35)',
                        border: `1px solid ${item.status === 'active' ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.1)'}`,
                      }}>{item.status || 'active'}</span>
                    </div>
                    <div className="amc-leaders">
                      {head  && <span>Head: <strong>{head.name}</strong></span>}
                      {assoc && <span>Assoc: <strong>{assoc.name}</strong></span>}
                    </div>
                  </div>
                </div>
                <p className="amc-desc">{item.description?.slice(0, 130)}{item.description?.length > 130 ? '…' : ''}</p>
                {canEdit(item) && (
                  <div className="db-table-actions" style={{ marginTop: 14 }}>
                    <button className="db-btn db-btn-ghost" style={{ padding: '7px 14px', fontSize: '0.82rem' }} onClick={() => openEdit(item)}>Edit</button>
                    {isAdmin && <button className="db-btn db-btn-danger" style={{ padding: '7px 14px', fontSize: '0.82rem' }} onClick={() => handleDelete(item.id)}>Delete</button>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="db-modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="db-modal" style={{ maxWidth: 580 }}>
            <button className="db-modal-close" onClick={closeModal}>✕</button>
            <h2>{editId ? 'Edit Affair' : 'Add New Affair'}</h2>
            {error && <div className="db-error" style={{ marginBottom: 16 }}>{error}</div>}

            <form onSubmit={handleSave} className="db-form">
              <div className="db-form-row">
                <div className="db-field" style={{ flex: 2 }}>
                  <label>Affair Name *</label>
                  <input value={form.name} onChange={e => setField('name', e.target.value)} placeholder="e.g. HUSU Academic Affair" />
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

              <div className="db-form-row">
                <div className="db-field">
                  <IconPicker value={form.icon} onChange={v => setField('icon', v)} label="Icon" />
                </div>
                <div className="db-field">
                  <label>Color</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                    {COLORS.map(c => (
                      <button key={c} type="button" onClick={() => setField('color', c)} style={{
                        width: 28, height: 28, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer', flexShrink: 0,
                        outline: form.color === c ? `3px solid ${c}` : '3px solid transparent', outlineOffset: 2,
                      }} />
                    ))}
                    <input type="color" value={form.color} onChange={e => setField('color', e.target.value)}
                      style={{ width: 28, height: 28, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }} />
                  </div>
                </div>
              </div>

              <div className="db-field">
                <label>Description</label>
                <textarea value={form.description} onChange={e => setField('description', e.target.value)}
                  placeholder="What does this affair do?" style={{ minHeight: 90 }} />
              </div>

              {/* Leadership assignment */}
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 16, border: '1px solid rgba(255,255,255,0.07)' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>
                  Leadership Assignment
                </p>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>
                  Select from existing users with Affair Head / Assoc. Head roles. They will fill their own profile info.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <UserSelect
                    label="Head"
                    value={form.headUid}
                    onChange={v => setField('headUid', v)}
                    candidates={headCandidates}
                    placeholder="— Select Head —"
                  />
                  <UserSelect
                    label="Associative Head"
                    value={form.assocUid}
                    onChange={v => setField('assocUid', v)}
                    candidates={assocCandidates}
                    placeholder="— Select Assoc. Head —"
                  />
                </div>
                {(form.headUid || form.assocUid) && (
                  <p style={{ fontSize: '0.75rem', color: 'rgba(232,160,32,0.7)', marginTop: 12 }}>
                    📨 An assignment letter will be sent automatically to any newly assigned member.
                  </p>
                )}
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
