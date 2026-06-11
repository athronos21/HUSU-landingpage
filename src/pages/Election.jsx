import { usePublicElection } from '../hooks/usePublicData'
import { useCollection } from '../hooks/useFirestore'
import { ROLE_LABELS } from '../dashboard/roles'
import './Election.css'

export default function Election() {
  const { election, loading } = usePublicElection()
  const { docs: allUsers }    = useCollection('users', 'createdAt')

  const getUser = (uid) => allUsers.find(u => u.id === uid)

  if (loading) return (
    <div className="election-page">
      <div className="election-loading">Loading…</div>
    </div>
  )

  if (!election) return (
    <div className="election-page">
      <section className="page-hero election-hero">
        <div className="container">
          <p className="page-hero-sub">Democracy in Action</p>
          <h1>Elections</h1>
          <p>No active election at this time. Check back later.</p>
        </div>
      </section>
    </div>
  )

  const isActive    = election.status === 'active'
  const isPublished = election.status === 'published'

  const counts = {}
  election.nomineeUids?.forEach(uid => { counts[uid] = 0 })
  Object.values(election.votes || {}).forEach(uid => {
    counts[uid] = (counts[uid] || 0) + 1
  })
  const totalVotes = Object.keys(election.votes || {}).length

  const sorted = [...(election.nomineeUids || [])].sort(
    (a, b) => (counts[b] || 0) - (counts[a] || 0)
  )

  return (
    <div className="election-page">

      {/* Hero */}
      <section className="page-hero election-hero">
        <div className="election-hero-shapes">
          <div className="ehs ehs-1" /><div className="ehs ehs-2" />
        </div>
        <div className="container">
          <p className="page-hero-sub">Democracy in Action</p>
          <h1>{election.title}</h1>
          <div className="election-meta">
            <span className={`election-status-badge ${election.status}`}>
              {isActive ? '🟢 Voting Open' : isPublished ? '🏆 Results Published' : '🔒 Closed'}
            </span>
            <span>Position: <strong>{ROLE_LABELS[election.position] || election.position}</strong></span>
            {isActive && <span>Voting ends: <strong>{election.endDate}</strong></span>}
            <span><strong>{totalVotes}</strong> vote{totalVotes !== 1 ? 's' : ''} cast</span>
          </div>
        </div>
      </section>

      <section className="section election-body">
        <div className="container">

          {/* Active — show nominees info only, no vote counts */}
          {isActive && (
            <>
              <div className="election-section-header">
                <h2>Nominees</h2>
                <p>Voting is currently open for HUSU members. Cast your vote through the member dashboard.</p>
              </div>
              <div className="election-nominees">
                {(election.nomineeUids || []).map(uid => {
                  const u = getUser(uid)
                  return (
                    <div key={uid} className="election-nominee-card">
                      <div className="enc-avatar">
                        {u?.image
                          ? <img src={u.image} alt={u.name} />
                          : <span>{(u?.name || '?')[0]}</span>
                        }
                      </div>
                      <h3>{u?.name || 'Unknown'}</h3>
                      <p className="enc-role">{ROLE_LABELS[u?.role] || u?.role || 'Member'}</p>
                      {u?.bio && <p className="enc-bio">{u.bio.slice(0, 120)}{u.bio?.length > 120 ? '…' : ''}</p>}
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* Published — show full results */}
          {isPublished && (
            <>
              <div className="election-section-header">
                <h2>🏆 Final Results</h2>
                <p>The votes have been counted and results have been officially published.</p>
              </div>
              <div className="election-results">
                {sorted.map((uid, i) => {
                  const u       = getUser(uid)
                  const pct     = totalVotes > 0 ? Math.round(((counts[uid] || 0) / totalVotes) * 100) : 0
                  const isWinner = election.winnerId === uid
                  return (
                    <div key={uid} className={`election-result-row${isWinner ? ' winner' : ''}`}>
                      <div className="err-rank">{isWinner ? '🏆' : `#${i + 1}`}</div>
                      <div className="err-avatar">
                        {u?.image
                          ? <img src={u.image} alt={u.name} />
                          : <span>{(u?.name || '?')[0]}</span>
                        }
                      </div>
                      <div className="err-info">
                        <h4>{u?.name || uid}</h4>
                        <p>{ROLE_LABELS[u?.role] || u?.role || 'Member'}</p>
                      </div>
                      <div className="err-bar-wrap">
                        <div className="err-bar">
                          <div className="err-bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="err-pct">{counts[uid] || 0} votes ({pct}%)</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {election.winnerId && (() => {
                const winner = getUser(election.winnerId)
                return winner ? (
                  <div className="election-winner-spotlight">
                    <div className="ews-avatar">
                      {winner.image ? <img src={winner.image} alt={winner.name} /> : <span>{winner.name[0]}</span>}
                    </div>
                    <div className="ews-info">
                      <span className="ews-label">Elected {ROLE_LABELS[election.position]}</span>
                      <h2>{winner.name}</h2>
                      {winner.bio && <p>{winner.bio}</p>}
                    </div>
                  </div>
                ) : null
              })()}
            </>
          )}

        </div>
      </section>
    </div>
  )
}
