import { useState, useMemo } from 'react'
import { deleteDocument, useCollection } from '../hooks/useFirestore'
import { useAuth } from '../context/AuthContext'
import './Dashboard.css'

const CATEGORIES = ['Sports', 'Academic', 'Workshop', 'Culture']
const CAT_CONFIG = {
  Sports:   { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)',  icon: '⚽' },
  Academic: { color: '#4a7fd4', bg: 'rgba(74,127,212,0.12)',  border: 'rgba(74,127,212,0.25)',  icon: '🎓' },
  Workshop: { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.25)', icon: '🛠️' },
  Culture:  { color: '#e8a020', bg: 'rgba(232,160,32,0.12)',  border: 'rgba(232,160,32,0.25)',  icon: '🎭' },
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function isPast(d) { return d && new Date(d) < new Date() }
function daysUntil(d) {
  if (!d) return null
  const diff = Math.ceil((new Date(d) - new Date()) / 86400000)
  if (diff < 0) return null
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  return `In ${diff} days`
}

export default function ManageEvents() {
  const { profile } = useAuth()
  const { docs, loading } = useCollection('events', 'date')

  const [search,    setSearch]    = useState('')
  const [catFilter, setCatFilter] = useState('All')
  const [timeFilter, setTimeFilter] = useState('All') // 'All' | 'Upcoming' | 'Past'
  const [view,      setView]      = useState('grid')
  const [preview,   setPreview]   = useState(null)

  const isAdmin = profile?.role === 'admin'

  const filtered = useMemo(() => docs.filter(e => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      e.title?.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q) ||
      e.affair?.toLowerCase().includes(q) ||
      e.location?.toLowerCase().includes(q)
    const matchCat  = catFilter === 'All' || e.category === catFilter
    const matchTime = timeFilter === 'All' ||
      (timeFilter === 'Upcoming' && !isPast(e.date)) ||
      (timeFilter === 'Past' && isPast(e.date))
    return matchSearch && matchCat && matchTime
  }), [docs, search, catFilter, timeFilter])

  const total    = docs.length
  const upcoming = docs.filter(e => !isPast(e.date)).length
  const past     = docs.filter(e => isPast(e.date)).length
  const withPhoto = docs.filter(e => e.image).length

  const handleDelete = async (id) => {
    if (!confirm('Delete this event? This cannot be undone.')) return
    if (preview?.id === id) setPreview(null)
    await deleteDocument('events', id)
  }

  const CatBadge = ({ cat }) => {
    const s = CAT_CONFIG[cat] || CAT_CONFIG.Academic
    return (
      <span style={{
        fontSize: '0.65rem', fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase',
        padding: '3px 10px', borderRadius: 20, border: `1px solid ${s.border}`,
        background: s.bg, color: s.color, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4,
      }}>{s.icon} {cat}</span>
    )
  }

  const StatusBadge = ({ date }) => {
    const p = isPast(date)
    const soon = daysUntil(date)
    return (
      <span style={{
        fontSize: '0.65rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20,
        background: p ? 'rgba(255,255,255,0.06)' : 'rgba(34,197,94,0.1)',
        color: p ? 'rgba(255,255,255,0.3)' : '#22c55e',
        border: p ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(34,197,94,0.25)',
      }}>
        {p ? '✓ Completed' : (soon || 'Upcoming')}
      </span>
    )
  }

  return (
    <div className="dash-page">

      {/* ── Header ── */}
      <div className="dash-page-header">
        <div>
          <h1>📅 Events</h1>
          <p>Published via Telegram bot — appears on the website automatically.</p>
        </div>
        <a
          href="https://t.me/HUSUOfficialBot"
          target="_blank" rel="noreferrer"
          className="db-btn db-btn-primary"
          style={{ textDecoration: 'none' }}
        >
          🤖 Open Bot
        </a>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Total Events', value: total,     icon: '📅', color: '#4a7fd4' },
          { label: 'Upcoming',     value: upcoming,  icon: '🟢', color: '#22c55e' },
          { label: 'Completed',    value: past,      icon: '✓',  color: 'rgba(255,255,255,0.35)' },
          { label: 'With Photo',   value: withPhoto, icon: '📷', color: '#10b981' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{ fontSize: '1.5rem' }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 3 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters row ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Time filter */}
        {['All', 'Upcoming', 'Past'].map(t => (
          <button key={t} onClick={() => setTimeFilter(t)} style={{
            padding: '5px 14px', borderRadius: 20, border: `1px solid ${timeFilter === t ? 'rgba(232,160,32,0.4)' : 'rgba(255,255,255,0.1)'}`,
            background: timeFilter === t ? 'rgba(232,160,32,0.12)' : 'rgba(255,255,255,0.04)',
            color: timeFilter === t ? '#e8a020' : 'rgba(255,255,255,0.5)',
            fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
          }}>{t}</button>
        ))}
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
        {/* Category filter */}
        {CATEGORIES.map(c => {
          const active = catFilter === c
          const s = CAT_CONFIG[c]
          return (
            <button key={c} onClick={() => setCatFilter(active ? 'All' : c)} style={{
              padding: '5px 14px', borderRadius: 20, border: `1px solid ${active ? s.border : 'rgba(255,255,255,0.1)'}`,
              background: active ? s.bg : 'rgba(255,255,255,0.04)',
              color: active ? s.color : 'rgba(255,255,255,0.5)',
              fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}>{s.icon} {c}</button>
          )
        })}
      </div>

      {/* ── Search + view toggle ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="db-search-input"
            style={{ paddingLeft: 36 }}
            placeholder="Search by title, description, location, affair…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>
          {filtered.length} of {total}
        </span>
        <div style={{ display: 'flex', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, overflow: 'hidden' }}>
          {['grid', 'list'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '7px 12px', border: 'none', cursor: 'pointer', fontSize: '0.85rem',
              background: view === v ? 'rgba(232,160,32,0.2)' : 'rgba(255,255,255,0.04)',
              color: view === v ? '#e8a020' : 'rgba(255,255,255,0.4)',
              transition: 'all 0.15s',
            }}>{v === 'grid' ? '⊞' : '☰'}</button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>
          <div style={{ width: 32, height: 32, border: '3px solid rgba(232,160,32,0.2)', borderTopColor: '#e8a020', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          Loading events…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 24px', color: 'rgba(255,255,255,0.25)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📭</div>
          <p>No events found{search ? ` for "${search}"` : ''}.</p>
          {(search || catFilter !== 'All' || timeFilter !== 'All') && (
            <button className="db-btn db-btn-ghost" style={{ marginTop: 12 }}
              onClick={() => { setSearch(''); setCatFilter('All'); setTimeFilter('All') }}>
              Clear all filters
            </button>
          )}
        </div>
      ) : view === 'grid' ? (

        /* ── GRID VIEW ── */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
          {filtered.map(item => {
            const past = isPast(item.date)
            const cat  = CAT_CONFIG[item.category] || CAT_CONFIG.Academic
            return (
              <div key={item.id} onClick={() => setPreview(item)} style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
                transition: 'all 0.2s', display: 'flex', flexDirection: 'column',
                opacity: past ? 0.75 : 1,
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = cat.border; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.opacity = '1' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.opacity = past ? '0.75' : '1' }}
              >
                {/* Image or date banner */}
                {item.image ? (
                  <div style={{ width: '100%', height: 160, overflow: 'hidden', background: '#0a1628', position: 'relative' }}>
                    <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {/* Date overlay */}
                    <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.75)', borderRadius: 8, padding: '6px 10px', backdropFilter: 'blur(8px)' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: cat.color, lineHeight: 1 }}>
                        {new Date(item.date).toLocaleDateString('en-US', { day: '2-digit' })}
                      </div>
                      <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1 }}>
                        {new Date(item.date).toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ width: '100%', height: 90, background: `linear-gradient(135deg, ${cat.bg}, rgba(10,22,40,0.9))`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.8rem', fontWeight: 900, color: cat.color, lineHeight: 1 }}>
                        {new Date(item.date).toLocaleDateString('en-US', { day: '2-digit' })}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>
                        {new Date(item.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Body */}
                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <CatBadge cat={item.category} />
                    <StatusBadge date={item.date} />
                  </div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', lineHeight: 1.4, margin: 0 }}>{item.title}</h3>
                  {item.description && (
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, margin: 0,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                    {item.time && (
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span>⏰</span> {item.time}
                      </div>
                    )}
                    {item.location && (
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span>📍</span> {item.location}
                      </div>
                    )}
                    {item.affair && (
                      <div style={{ fontSize: '0.75rem', color: 'rgba(232,160,32,0.7)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span>🏛️</span> {item.affair} Affair
                      </div>
                    )}
                  </div>
                  {isAdmin && (
                    <div style={{ marginTop: 4, display: 'flex', justifyContent: 'flex-end' }}>
                      <button className="db-btn db-btn-danger" style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                        onClick={e => { e.stopPropagation(); handleDelete(item.id) }}>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

      ) : (

        /* ── LIST VIEW ── */
        <div className="db-table-wrap">
          <table className="db-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Category</th>
                <th>Affair</th>
                <th>Date</th>
                <th>Location</th>
                <th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const cat = CAT_CONFIG[item.category] || CAT_CONFIG.Academic
                return (
                  <tr key={item.id} onClick={() => setPreview(item)} style={{ cursor: 'pointer', opacity: isPast(item.date) ? 0.65 : 1 }}>
                    <td style={{ maxWidth: 300 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {item.image
                          ? <img src={item.image} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                          : <div style={{ width: 40, height: 40, borderRadius: 8, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>{cat.icon}</div>
                        }
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>{item.title}</div>
                          {item.time && <div style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>⏰ {item.time}</div>}
                        </div>
                      </div>
                    </td>
                    <td><CatBadge cat={item.category} /></td>
                    <td style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>{item.affair || '—'}</td>
                    <td style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>{formatDate(item.date)}</td>
                    <td style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', maxWidth: 160 }}>{item.location || '—'}</td>
                    <td><StatusBadge date={item.date} /></td>
                    {isAdmin && (
                      <td onClick={e => e.stopPropagation()}>
                        <button className="db-btn db-btn-danger" style={{ padding: '5px 10px', fontSize: '0.78rem' }} onClick={() => handleDelete(item.id)}>Delete</button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Preview modal ── */}
      {preview && (
        <div className="db-modal-overlay" onClick={() => setPreview(null)}>
          <div className="db-modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <button className="db-modal-close" onClick={() => setPreview(null)}>✕</button>
            {preview.image && (
              <div style={{ width: '100%', height: 240, overflow: 'hidden', borderRadius: 10, marginBottom: 20, background: '#0a1628' }}>
                <img src={preview.image} alt={preview.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <CatBadge cat={preview.category} />
              <StatusBadge date={preview.date} />
              {preview.affair && <span style={{ fontSize: '0.65rem', color: 'rgba(232,160,32,0.7)', background: 'rgba(232,160,32,0.08)', border: '1px solid rgba(232,160,32,0.2)', borderRadius: 20, padding: '3px 10px' }}>🏛️ {preview.affair} Affair</span>}
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginBottom: 12, lineHeight: 1.4 }}>{preview.title}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', display: 'flex', gap: 8, alignItems: 'center' }}>
                <span>📅</span> {formatDate(preview.date)}
                {preview.time && <><span style={{ opacity: 0.4 }}>·</span><span>⏰</span> {preview.time}</>}
              </div>
              {preview.location && <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', display: 'flex', gap: 8, alignItems: 'center' }}><span>📍</span> {preview.location}</div>}
            </div>
            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{preview.description}</p>
            {preview.postedBy && <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: 16 }}>Posted by {preview.postedBy}</p>}
            {isAdmin && (
              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                <button className="db-btn db-btn-danger" onClick={() => handleDelete(preview.id)}>Delete Event</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
