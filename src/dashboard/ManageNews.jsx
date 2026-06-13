import { useState, useMemo } from 'react'
import { deleteDocument, useCollection } from '../hooks/useFirestore'
import { useAuth } from '../context/AuthContext'
import './Dashboard.css'

const CATEGORIES = ['Announcement', 'Academic', 'Service', 'Discipline']
const CAT_COLORS = {
  Announcement: { color: '#4a7fd4', bg: 'rgba(74,127,212,0.12)',  border: 'rgba(74,127,212,0.25)'  },
  Academic:     { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)'  },
  Service:      { color: '#e8a020', bg: 'rgba(232,160,32,0.12)',  border: 'rgba(232,160,32,0.25)'  },
  Discipline:   { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.25)' },
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function timeAgo(d) {
  if (!d) return ''
  const diff = Date.now() - new Date(d).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return formatDate(d)
}

export default function ManageNews() {
  const { profile } = useAuth()
  const { docs, loading } = useCollection('news', 'date')

  const [search,    setSearch]    = useState('')
  const [catFilter, setCatFilter] = useState('All')
  const [view,      setView]      = useState('grid') // 'grid' | 'list'
  const [preview,   setPreview]   = useState(null)   // item being previewed

  const isAdmin = profile?.role === 'admin'

  const filtered = useMemo(() => docs.filter(n => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      n.title?.toLowerCase().includes(q) ||
      n.summary?.toLowerCase().includes(q) ||
      n.affair?.toLowerCase().includes(q)
    return matchSearch && (catFilter === 'All' || n.category === catFilter)
  }), [docs, search, catFilter])

  // Stats
  const total     = docs.length
  const withPhoto = docs.filter(n => n.image).length
  const byCat     = CATEGORIES.map(c => ({ cat: c, count: docs.filter(n => n.category === c).length }))
  const latest    = docs[0]

  const handleDelete = async (id) => {
    if (!confirm('Delete this news item? This cannot be undone.')) return
    if (preview?.id === id) setPreview(null)
    await deleteDocument('news', id)
  }

  const CatBadge = ({ cat }) => {
    const s = CAT_COLORS[cat] || CAT_COLORS.Announcement
    return (
      <span style={{
        fontSize: '0.65rem', fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase',
        padding: '3px 10px', borderRadius: 20, border: `1px solid ${s.border}`,
        background: s.bg, color: s.color, whiteSpace: 'nowrap',
      }}>{cat}</span>
    )
  }

  return (
    <div className="dash-page">

      {/* ── Header ── */}
      <div className="dash-page-header">
        <div>
          <h1>📰 News</h1>
          <p>Published via Telegram bot — appears on the website automatically.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <a
            href="https://t.me/HUSUOfficialBot"
            target="_blank" rel="noreferrer"
            className="db-btn db-btn-primary"
            style={{ textDecoration: 'none' }}
          >
            🤖 Open Bot
          </a>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Total Articles', value: total, icon: '📰', color: '#4a7fd4' },
          { label: 'With Photo',     value: withPhoto, icon: '📷', color: '#10b981' },
          ...byCat.slice(0,2).map(b => ({ label: b.cat, value: b.count, icon: '📂', color: CAT_COLORS[b.cat]?.color })),
        ].map(s => (
          <div key={s.label} style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{ fontSize: '1.6rem' }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 3 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Category pills ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {['All', ...CATEGORIES].map(c => {
          const active = catFilter === c
          const s = c !== 'All' ? CAT_COLORS[c] : null
          return (
            <button key={c} onClick={() => setCatFilter(c)} style={{
              padding: '5px 16px', borderRadius: 20, border: `1px solid ${active && s ? s.border : 'rgba(255,255,255,0.12)'}`,
              background: active ? (s ? s.bg : 'rgba(232,160,32,0.15)') : 'rgba(255,255,255,0.04)',
              color: active ? (s ? s.color : '#e8a020') : 'rgba(255,255,255,0.5)',
              fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {c} {c !== 'All' && <span style={{ opacity: 0.6 }}>({docs.filter(n => n.category === c).length})</span>}
            </button>
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
            placeholder="Search by title, summary, affair…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>
          {filtered.length} of {total}
        </span>
        {/* Grid / List toggle */}
        <div style={{ display: 'flex', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, overflow: 'hidden' }}>
          {['grid', 'list'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '7px 12px', border: 'none', cursor: 'pointer', fontSize: '0.85rem',
              background: view === v ? 'rgba(232,160,32,0.2)' : 'rgba(255,255,255,0.04)',
              color: view === v ? '#e8a020' : 'rgba(255,255,255,0.4)',
              transition: 'all 0.15s',
            }}>
              {v === 'grid' ? '⊞' : '☰'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>
          <div style={{ width: 32, height: 32, border: '3px solid rgba(232,160,32,0.2)', borderTopColor: '#e8a020', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          Loading news…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 24px', color: 'rgba(255,255,255,0.25)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔍</div>
          <p>No news found{search ? ` for "${search}"` : ''}.</p>
          {search && <button className="db-btn db-btn-ghost" style={{ marginTop: 12 }} onClick={() => setSearch('')}>Clear search</button>}
        </div>
      ) : view === 'grid' ? (

        /* ── GRID VIEW ── */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
          {filtered.map(item => (
            <div key={item.id} onClick={() => setPreview(item)} style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
              transition: 'all 0.2s', display: 'flex', flexDirection: 'column',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(232,160,32,0.3)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'none' }}
            >
              {/* Image */}
              {item.image ? (
                <div style={{ width: '100%', height: 160, overflow: 'hidden', background: '#0a1628' }}>
                  <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ width: '100%', height: 80, background: `linear-gradient(135deg, ${CAT_COLORS[item.category]?.bg || 'rgba(74,127,212,0.1)'}, rgba(10,22,40,0.8))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                  📰
                </div>
              )}
              {/* Body */}
              <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <CatBadge cat={item.category} />
                  {item.affair && (
                    <span style={{ fontSize: '0.65rem', color: 'rgba(232,160,32,0.7)', background: 'rgba(232,160,32,0.08)', border: '1px solid rgba(232,160,32,0.2)', borderRadius: 20, padding: '2px 8px' }}>
                      🏛️ {item.affair}
                    </span>
                  )}
                </div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', lineHeight: 1.4, margin: 0 }}>{item.title}</h3>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, margin: 0, flex: 1,
                  display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {item.summary}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>{timeAgo(item.date)}</span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {item.source === 'telegram' && (
                      <span style={{ fontSize: '0.65rem', color: '#29a3ef', background: 'rgba(42,163,239,0.1)', border: '1px solid rgba(42,163,239,0.2)', borderRadius: 20, padding: '2px 8px' }}>✈️</span>
                    )}
                    {isAdmin && (
                      <button className="db-btn db-btn-danger" style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                        onClick={e => { e.stopPropagation(); handleDelete(item.id) }}>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      ) : (

        /* ── LIST VIEW ── */
        <div className="db-table-wrap">
          <table className="db-table">
            <thead>
              <tr>
                <th>Article</th>
                <th>Category</th>
                <th>Affair</th>
                <th>Date</th>
                <th>Source</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} onClick={() => setPreview(item)} style={{ cursor: 'pointer' }}>
                  <td style={{ maxWidth: 320 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {item.image
                        ? <img src={item.image} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                        : <div style={{ width: 40, height: 40, borderRadius: 8, background: CAT_COLORS[item.category]?.bg || 'rgba(74,127,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>📰</div>
                      }
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 240 }}>{item.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 240 }}>{item.summary?.slice(0,70)}…</div>
                      </div>
                    </div>
                  </td>
                  <td><CatBadge cat={item.category} /></td>
                  <td style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>{item.affair || '—'}</td>
                  <td style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>{formatDate(item.date)}</td>
                  <td>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '3px 9px', borderRadius: 20,
                      background: item.source === 'telegram' ? 'rgba(42,163,239,0.1)' : 'rgba(255,255,255,0.06)',
                      color: item.source === 'telegram' ? '#29a3ef' : 'rgba(255,255,255,0.4)',
                      border: item.source === 'telegram' ? '1px solid rgba(42,163,239,0.2)' : '1px solid rgba(255,255,255,0.1)',
                    }}>{item.source === 'telegram' ? '✈️ Telegram' : '🖊️ Manual'}</span>
                  </td>
                  {isAdmin && (
                    <td onClick={e => e.stopPropagation()}>
                      <button className="db-btn db-btn-danger" style={{ padding: '5px 10px', fontSize: '0.78rem' }} onClick={() => handleDelete(item.id)}>Delete</button>
                    </td>
                  )}
                </tr>
              ))}
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
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <CatBadge cat={preview.category} />
              {preview.affair && <span style={{ fontSize: '0.65rem', color: 'rgba(232,160,32,0.7)', background: 'rgba(232,160,32,0.08)', border: '1px solid rgba(232,160,32,0.2)', borderRadius: 20, padding: '3px 10px' }}>🏛️ {preview.affair} Affair</span>}
              <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', alignSelf: 'center' }}>{formatDate(preview.date)}</span>
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginBottom: 12, lineHeight: 1.4 }}>{preview.title}</h2>
            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{preview.summary}</p>
            {preview.postedBy && <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: 16 }}>Posted by {preview.postedBy}</p>}
            {isAdmin && (
              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                <button className="db-btn db-btn-danger" onClick={() => handleDelete(preview.id)}>Delete Article</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
