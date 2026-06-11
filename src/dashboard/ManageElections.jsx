import { useState, useEffect } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, orderBy, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import { useCollection } from '../hooks/useFirestore'
import { useAuth } from '../context/AuthContext'
import { HIGHER_MGMT_ROLES, ROLE_LABELS } from './roles'
import './Dashboard.css'

export default function ManageElections() {
  const { user } = useAuth()
  const { docs: allUsers } = useCollection('users', 'createdAt')
  const [elections, setElections] = useState([])
  const [modal,     setModal]     = useState(false)
  const [selected,  setSelected]  = useState(null) // election being viewed/managed
  const [form,      setForm]      = useState({
    title: '', position: 'president',
    startDate: '', endDate: '',
    nomineeUids: [],
  })
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  // Live elections
  useEffect(() => {
    const q = query(collection(db, 'elections'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setElections(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  const members = allUsers.filter(u => u.status === 'active')

  const getUser = (uid) => allUsers.find(u => u.id === uid)

  const toggleNominee = (uid) => {
    setForm(f => ({
      ...f,
      nomineeUids: f.nomineeUids.includes(uid)
        ? f.nomineeUids.filter(id => id !== uid)
        : [...f.nomineeUids, uid],
    }))
  }

  const handleCreate = async e => {
    e.preventDefault()
    if (!form.title)         { setError('Title is required.'); return }
    if (!form.startDate)     { setError('Start date is required.'); return }
    if (!form.endDate)       { setError('End date is required.'); return }
    if (form.nomineeUids.length < 2) { setError('At least 2 nominees required.'); return }
    setSaving(true); setError('')
    try {
      await addDoc(collection(db, 'elections'), {
        title:        form.title,
        position:     form.position,
        startDate:    form.startDate,
        endDate:      form.endDate,
        nomineeUids:  form.nomineeUids,
        votes:        {}, // { uid: nomineeUid }
        status:       'active', // active | closed | published
        createdBy:    user?.uid,
        createdAt:    serverTimestamp(),
        results:      null,
      })
      setModal(false)
      setForm({ title: '', position: 'president', startDate: '', endDate: '', nomineeUids: [] })
    } catch (err) {
      setError(err.message || 'Failed to create.')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = async (election) => {
    if (!confirm('Close this election? Members will no longer be able to vote.')) return
    await updateDoc(doc(db, 'elections', election.id), { status: 'closed' })
  }

  const handlePublish = async (election) => {
    if (!confirm('Publish results publicly? This will create a news post and update the Leadership page.')) return
    setSaving(true)
    try {
      // Count votes
      const counts = {}
      election.nomineeUids.forEach(uid => { counts[uid] = 0 })
      Object.values(election.votes || {}).forEach(nomineeUid => {
        counts[nomineeUid] = (counts[nomineeUid] || 0) + 1
      })

      // Find winner
      const winnerId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
      const winner   = getUser(winnerId)
      const totalVotes = Object.keys(election.votes || {}).length

      const resultsText = election.nomineeUids
        .sort((a, b) => (counts[b] || 0) - (counts[a] || 0))
        .map(uid => {
          const u = getUser(uid)
          const pct = totalVotes > 0 ? Math.round(((counts[uid] || 0) / totalVotes) * 100) : 0
          return `• ${u?.name || uid}: ${counts[uid] || 0} votes (${pct}%)`
        }).join('\n')

      // Update election
      await updateDoc(doc(db, 'elections', election.id), {
        status:    'published',
        winnerId,
        results:   counts,
        publishedAt: new Date().toISOString(),
      })

      // Update winner's role in users
      if (winner) {
        await updateDoc(doc(db, 'users', winnerId), {
          role: election.position,
        })
      }

      // Create news announcement
      await addDoc(collection(db, 'news'), {
        title:     `Election Results: ${election.title}`,
        summary:   `The results of the ${election.title} have been announced.\n\n${resultsText}\n\n🏆 Winner: ${winner?.name || 'TBD'} — elected as ${ROLE_LABELS[election.position] || election.position}.\n\nCongratulations to all participants!`,
        category:  'Announcement',
        date:      new Date().toISOString().split('T')[0],
        source:    'election',
        createdAt: new Date().toISOString(),
      })

      // Also update the team collection for public display
      // Find existing team entry for this position and update, or add new
      const teamQuery = query(collection(db, 'team'))
      // We'll just add the winner as a team member if winner exists
      if (winner) {
        await addDoc(collection(db, 'team'), {
          name:      winner.name,
          title:     ROLE_LABELS[election.position] || election.position,
          bio:       winner.bio || '',
          image:     winner.image || null,
          createdAt: serverTimestamp(),
        })
      }

    } catch (err) {
      setError(err.message || 'Failed to publish.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this election permanently?')) return
    await deleteDoc(doc(db, 'elections', id))
  }

  const statusColor = { active: '#22c55e', closed: '#e8a020', published: '#4a7fd4' }
  const statusLabel = { active: '🟢 Active', closed: '🟡 Closed', published: '🔵 Published' }

  return (
    <div className="dash-page">
      <div className="dash-page-header">
        <div>
          <h1>🗳️ Elections</h1>
          <p>Create elections, manage nominees, and publish results</p>
        </div>
        <button className="db-btn db-btn-primary" onClick={() => setModal(true)}>+ New Election</button>
      </div>

      {/* Elections list */}
      {elections.length === 0 && (
        <p style={{ color: 'rgba(255,255,255,0.35)', padding: '32px 0' }}>No elections yet.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {elections.map(el => {
          const voteCount  = Object.keys(el.votes || {}).length
          const counts     = {}
          el.nomineeUids?.forEach(uid => { counts[uid] = 0 })
          Object.values(el.votes || {}).forEach(uid => { counts[uid] = (counts[uid] || 0) + 1 })

          return (
            <div key={el.id} style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16, padding: 24,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                <div>
                  <h3 style={{ color: '#fff', margin: '0 0 6px', fontSize: '1.1rem' }}>{el.title}</h3>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: statusColor[el.status], fontWeight: 700 }}>
                      {statusLabel[el.status]}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
                      Position: {ROLE_LABELS[el.position] || el.position}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
                      {el.startDate} → {el.endDate}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#e8a020', fontWeight: 700 }}>
                      {voteCount} vote{voteCount !== 1 ? 's' : ''} cast
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {el.status === 'active' && (
                    <button className="db-btn db-btn-ghost" style={{ fontSize: '0.8rem', padding: '7px 14px' }} onClick={() => handleClose(el)}>
                      🔒 Close Voting
                    </button>
                  )}
                  {el.status === 'closed' && (
                    <button className="db-btn db-btn-primary" style={{ fontSize: '0.8rem', padding: '7px 14px' }} onClick={() => handlePublish(el)} disabled={saving}>
                      📢 Publish Results
                    </button>
                  )}
                  <button
                    className={`db-btn ${el.showOnWebsite ? 'db-btn-primary' : 'db-btn-ghost'}`}
                    style={{ fontSize: '0.8rem', padding: '7px 14px' }}
                    onClick={() => updateDoc(doc(db, 'elections', el.id), { showOnWebsite: !el.showOnWebsite })}
                  >
                    {el.showOnWebsite ? '🌐 Visible on site' : '🌐 Show on site'}
                  </button>
                  <button className="db-btn db-btn-danger" style={{ fontSize: '0.8rem', padding: '7px 14px' }} onClick={() => handleDelete(el.id)}>Delete</button>
                </div>
              </div>

              {/* Nominee vote counts */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(el.nomineeUids || [])
                  .sort((a, b) => (counts[b] || 0) - (counts[a] || 0))
                  .map(uid => {
                    const u    = getUser(uid)
                    const pct  = voteCount > 0 ? Math.round(((counts[uid] || 0) / voteCount) * 100) : 0
                    const isWinner = el.status === 'published' && el.winnerId === uid
                    return (
                      <div key={uid} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 14px',
                        background: isWinner ? 'rgba(232,160,32,0.08)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isWinner ? 'rgba(232,160,32,0.3)' : 'rgba(255,255,255,0.06)'}`,
                        borderRadius: 10,
                      }}>
                        {u?.image
                          ? <img src={u.image} alt={u.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                          : <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1a3a6b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>{(u?.name || '?')[0]}</div>
                        }
                        <span style={{ flex: 1, color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
                          {u?.name || uid} {isWinner && '🏆'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 120 }}>
                          <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3 }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: isWinner ? '#e8a020' : '#4a7fd4', borderRadius: 3, transition: 'width 0.5s' }} />
                          </div>
                          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', minWidth: 60, textAlign: 'right' }}>
                            {counts[uid] || 0} ({pct}%)
                          </span>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Create election modal */}
      {modal && (
        <div className="db-modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="db-modal" style={{ maxWidth: 580 }}>
            <button className="db-modal-close" onClick={() => setModal(false)}>✕</button>
            <h2>🗳️ New Election</h2>
            {error && <div className="db-error" style={{ marginBottom: 16 }}>{error}</div>}
            <form onSubmit={handleCreate} className="db-form">
              <div className="db-field">
                <label>Election Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. President Election 2025" />
              </div>
              <div className="db-form-row">
                <div className="db-field">
                  <label>Position *</label>
                  <select value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))}>
                    {HIGHER_MGMT_ROLES.map(r => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="db-form-row">
                <div className="db-field">
                  <label>Voting Start *</label>
                  <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div className="db-field">
                  <label>Voting End *</label>
                  <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                </div>
              </div>
              <div className="db-field">
                <label>Select Nominees * (minimum 2)</label>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 12, maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {members.map(u => (
                    <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '6px 8px', borderRadius: 8, background: form.nomineeUids.includes(u.id) ? 'rgba(232,160,32,0.1)' : 'transparent' }}>
                      <input
                        type="checkbox"
                        checked={form.nomineeUids.includes(u.id)}
                        onChange={() => toggleNominee(u.id)}
                        style={{ width: 16, height: 16 }}
                      />
                      {u.image
                        ? <img src={u.image} alt={u.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                        : <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1a3a6b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>{(u.name||'?')[0]}</div>
                      }
                      <div>
                        <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600, color: '#fff' }}>{u.name}</p>
                        <p style={{ margin: 0, fontSize: '0.73rem', color: 'rgba(255,255,255,0.4)' }}>{ROLE_LABELS[u.role] || u.role}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>
                  {form.nomineeUids.length} selected
                </p>
              </div>
              <div className="db-form-actions">
                <button type="button" className="db-btn db-btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="db-btn db-btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create Election'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
