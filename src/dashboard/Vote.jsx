import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useCollection } from '../hooks/useFirestore'
import { ROLE_LABELS } from './roles'
import './Dashboard.css'
import './Vote.css'

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
        <div className="vote-empty-state">
          <div className="vote-empty-icon">🗳️</div>
          <p>No active elections at this time.</p>
        </div>
      )}

      {activeElections.map(el => {
        const voted    = hasVoted(el) || done[el.id]
        const myChoice = myVote(el)

        return (
          <div key={el.id} className="vote-election-card">
            <div className="vote-election-header">
              <span className="vote-status-badge">
                🟢 Voting Open
              </span>
              <h2 className="vote-election-title">{el.title}</h2>
              <p className="vote-election-meta">
                Position: <strong>{ROLE_LABELS[el.position] || el.position}</strong>
                &nbsp;·&nbsp; Voting closes: <strong>{el.endDate}</strong>
                &nbsp;·&nbsp; {Object.keys(el.votes || {}).length} votes cast
              </p>
            </div>

            {voted ? (
              <div className="vote-success">
                <p className="vote-success-title">✅ Your vote has been cast</p>
                <p className="vote-success-text">
                  You voted for: <strong>{getUser(myChoice || voting[el.id])?.name || 'Unknown'}</strong>
                </p>
              </div>
            ) : (
              <>
                <p className="vote-instruction">
                  Select one nominee and cast your vote. You can only vote once.
                </p>
                <div className="vote-nominees">
                  {(el.nomineeUids || []).map(uid => {
                    const u        = getUser(uid)
                    const selected = voting[el.id] === uid
                    return (
                      <button
                        key={uid}
                        type="button"
                        onClick={() => setVoting(v => ({ ...v, [el.id]: uid }))}
                        className={`vote-nominee-card ${selected ? 'selected' : ''}`}
                      >
                        {u?.image
                          ? <img src={u.image} alt={u.name} className="vote-nominee-avatar" />
                          : <div className="vote-nominee-avatar-fallback">{(u?.name || '?')[0]}</div>
                        }
                        <div className="vote-nominee-info">
                          <p className="vote-nominee-name">{u?.name || uid}</p>
                          <p className="vote-nominee-role">{ROLE_LABELS[u?.role] || u?.role || 'Member'}</p>
                          {u?.bio && <p className="vote-nominee-bio">{u.bio.slice(0, 80)}{u.bio.length > 80 ? '…' : ''}</p>}
                        </div>
                        <div className="vote-radio">
                          {selected && <div className="vote-radio-dot" />}
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
          <h2 className="vote-results-header">📊 Published Results</h2>
          {closedElections.map(el => {
            const counts = {}
            el.nomineeUids?.forEach(uid => { counts[uid] = 0 })
            Object.values(el.votes || {}).forEach(uid => { counts[uid] = (counts[uid] || 0) + 1 })
            const total = Object.keys(el.votes || {}).length

            return (
              <div key={el.id} className="vote-results-card">
                <h3 className="vote-results-title">{el.title}</h3>
                <p className="vote-results-meta">{total} total votes · {ROLE_LABELS[el.position]}</p>
                {(el.nomineeUids || []).sort((a, b) => (counts[b] || 0) - (counts[a] || 0)).map(uid => {
                  const u = getUser(uid)
                  const pct = total > 0 ? Math.round(((counts[uid] || 0) / total) * 100) : 0
                  const isWinner = el.winnerId === uid
                  return (
                    <div key={uid} className="vote-result-row">
                      <span className={`vote-result-name ${isWinner ? 'winner' : ''}`}>
                        {isWinner ? '🏆 ' : ''}{u?.name || uid}
                      </span>
                      <div className="vote-result-bar-container">
                        <div className={`vote-result-bar ${isWinner ? 'winner' : ''}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="vote-result-stats">{counts[uid] || 0} ({pct}%)</span>
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
