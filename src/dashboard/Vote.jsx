import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useCollection } from '../hooks/useFirestore'
import { ROLE_LABELS } from './roles'
import './Dashboard.css'

export default function Vote() {
  const { user } = useAuth()
  const { docs: allUsers } = useCollection('users', 'createdAt')
  const [elections, setElections] = useState([])
  const [voting,    setVoting]    = useState({}) // electionId -> nomineeUid being voted
  const [saving,    setSaving]    = useState(null)
  const [done,      setDone]      = useState({}) // electionId -> true

  useEffect(() => {
    const q = query(collection(db, 'elections'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setElections(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  const getUser = (uid) => allUsers.find(u => u.id === uid)

  const today = new Date().toISOString().split('T')[0]

  const activeElections = elections.filter(el =>
    el.status === 'active' &&
    el.startDate <= today &&
    el.endDate >= today
  )

  const closedElections = elections.filter(el =>
    el.status === 'published'
  )

  const hasVoted = (election) => !!(election.votes?.[user?.uid])
  const myVote   = (election) => election.votes?.[user?.uid]

  const handleVote = async (election) => {
    const nomineeUid = voting[election.id]
    if (!nomineeUid) return
    setSaving(election.id)
    try {
      await updateDoc(doc(db, 'elections', election.id), {
        [`votes.${user.uid}`]: nomineeUid,
      })
      setDone(d => ({ ...d, [election.id]: true }))
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="dash-page">
      <div className="dash-page-header">
        <div>
          <h1>🗳️ Elections & Voting</h1>
          <p>Cast your vote in active elections</p>
        </div>
      </div>

      {/* Active elections */}
      {activeElections.length === 0 && closedElections.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.25)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🗳️</div>
          <p>No active elections at this time.</p>
        </div>
      )}

      {activeElections.map(el => {
        const voted    = hasVoted(el) || done[el.id]
        const myChoice = myVote(el)

        return (
          <div key={el.id} style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20, padding: 28, marginBottom: 20,
          }}>
            <div style={{ marginBottom: 20 }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: '#22c55e', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 20, padding: '3px 12px' }}>
                🟢 Voting Open
              </span>
              <h2 style={{ color: '#fff', margin: '12px 0 4px', fontSize: '1.3rem', fontWeight: 800 }}>{el.title}</h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', margin: 0 }}>
                Position: <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{ROLE_LABELS[el.position] || el.position}</strong>
                &nbsp;·&nbsp; Voting closes: <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{el.endDate}</strong>
                &nbsp;·&nbsp; {Object.keys(el.votes || {}).length} votes cast
              </p>
            </div>

            {voted ? (
              <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                <p style={{ color: '#86efac', fontWeight: 700, fontSize: '1rem', margin: '0 0 6px' }}>✅ Your vote has been cast</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', margin: 0 }}>
                  You voted for: <strong style={{ color: '#fff' }}>{getUser(myChoice || voting[el.id])?.name || 'Unknown'}</strong>
                </p>
              </div>
            ) : (
              <>
                <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>
                  Select one nominee and cast your vote. You can only vote once.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  {(el.nomineeUids || []).map(uid => {
                    const u        = getUser(uid)
                    const selected = voting[el.id] === uid
                    return (
                      <button
                        key={uid}
                        type="button"
                        onClick={() => setVoting(v => ({ ...v, [el.id]: uid }))}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 16,
                          padding: '14px 18px', borderRadius: 14, cursor: 'pointer',
                          border: `2px solid ${selected ? '#e8a020' : 'rgba(255,255,255,0.08)'}`,
                          background: selected ? 'rgba(232,160,32,0.08)' : 'rgba(255,255,255,0.03)',
                          transition: 'all 0.15s', textAlign: 'left',
                        }}
                      >
                        {u?.image
                          ? <img src={u.image} alt={u.name} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: selected ? '2px solid #e8a020' : '2px solid rgba(255,255,255,0.1)' }} />
                          : <div style={{ width: 52, height: 52, borderRadius: '50%', background: selected ? '#1a3a6b' : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>{(u?.name || '?')[0]}</div>
                        }
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: '0 0 3px', fontWeight: 700, fontSize: '1rem', color: '#fff' }}>{u?.name || uid}</p>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>{ROLE_LABELS[u?.role] || u?.role || 'Member'}</p>
                          {u?.bio && <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)' }}>{u.bio.slice(0, 80)}{u.bio.length > 80 ? '…' : ''}</p>}
                        </div>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${selected ? '#e8a020' : 'rgba(255,255,255,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {selected && <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#e8a020' }} />}
                        </div>
                      </button>
                    )
                  })}
                </div>
                <button
                  className="db-btn db-btn-primary"
                  disabled={!voting[el.id] || saving === el.id}
                  onClick={() => handleVote(el)}
                  style={{ minWidth: 160 }}
                >
                  {saving === el.id ? 'Casting vote…' : '🗳️ Cast My Vote'}
                </button>
              </>
            )}
          </div>
        )
      })}

      {/* Published results */}
      {closedElections.length > 0 && (
        <>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: '32px 0 16px' }}>📊 Published Results</h2>
          {closedElections.map(el => {
            const counts = {}
            el.nomineeUids?.forEach(uid => { counts[uid] = 0 })
            Object.values(el.votes || {}).forEach(uid => { counts[uid] = (counts[uid] || 0) + 1 })
            const total = Object.keys(el.votes || {}).length

            return (
              <div key={el.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24, marginBottom: 16 }}>
                <h3 style={{ color: '#fff', margin: '0 0 4px', fontSize: '1rem' }}>{el.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginBottom: 16 }}>{total} total votes · {ROLE_LABELS[el.position]}</p>
                {(el.nomineeUids || []).sort((a, b) => (counts[b] || 0) - (counts[a] || 0)).map(uid => {
                  const u = getUser(uid)
                  const pct = total > 0 ? Math.round(((counts[uid] || 0) / total) * 100) : 0
                  const isWinner = el.winnerId === uid
                  return (
                    <div key={uid} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <span style={{ minWidth: 120, fontSize: '0.85rem', color: isWinner ? '#e8a020' : 'rgba(255,255,255,0.6)', fontWeight: isWinner ? 700 : 400 }}>
                        {isWinner ? '🏆 ' : ''}{u?.name || uid}
                      </span>
                      <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4 }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: isWinner ? '#e8a020' : '#4a7fd4', borderRadius: 4 }} />
                      </div>
                      <span style={{ minWidth: 60, textAlign: 'right', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>{counts[uid] || 0} ({pct}%)</span>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
