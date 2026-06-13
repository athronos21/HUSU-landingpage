import { useState } from 'react'
import { deleteDocument, useCollection } from '../hooks/useFirestore'
import { useAuth } from '../context/AuthContext'
import './Dashboard.css'

const CATEGORIES = ['Sports', 'Academic', 'Workshop', 'Culture']
const catColors  = { Sports: '#10b981', Academic: '#4a7fd4', Workshop: '#a78bfa', Culture: '#e8a020' }

const TELEGRAM_EVENTS_CHANNEL = 'HUSU_Events'

function isPast(dateStr) {
  return new Date(dateStr) < new Date()
}

export default function ManageEvents() {
  const { profile } = useAuth()
  const { docs, loading } = useCollection('events', 'date')
  const [search,    setSearch]    = useState('')
  const [catFilter, setCatFilter] = useState('All')

  const isAdmin = profile?.role === 'admin'

  const filtered = docs.filter(e => {
    const matchSearch = !search ||
      e.title?.toLowerCase().includes(search.toLowerCase()) ||
      e.description?.toLowerCase().includes(search.toLowerCase()) ||
      e.affair?.toLowerCase().includes(search.toLowerCase())
    const matchCat = catFilter === 'All' || e.category === catFilter
    return matchSearch && matchCat
  })

  const handleDelete = async (id) => {
    if (!confirm('Delete this event?')) return
    await deleteDocument('events', id)
  }

  return (
    <div className="dash-page">
      <div className="dash-page-header">
        <div>
          <h1>📅 Events</h1>
          <p>Events are posted via the Telegram channel and appear here automatically.</p>
        </div>
        <a
          href={`https://t.me/${TELEGRAM_EVENTS_CHANNEL}`}
          target="_blank"
          rel="noreferrer"
          className="db-btn db-btn-primary"
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          ✈️ Post on Telegram
        </a>
      </div>

      {/* How to post info box */}
      <div style={{
        background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
        borderRadius: 12, padding: '16px 20px', marginBottom: 24,
        fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7,
      }}>
        <strong style={{ color: '#10b981' }}>📋 How to post events:</strong> Open the Telegram channel and send a message in this format:
        <pre style={{ margin: '10px 0 0', padding: '10px 14px', background: 'rgba(0,0,0,0.3)', borderRadius: 8, fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', overflowX: 'auto' }}>{`Title: Event Name
Date: 2026-07-15
Time: 9:00 AM - 1:00 PM
Location: HU Main Hall
Category: Workshop
Affair: Service

Full description of the event here...`}</pre>
        <p style={{ margin: '8px 0 0', fontSize: '0.78rem' }}>
          Valid categories: <strong>Sports · Academic · Workshop · Culture</strong> &nbsp;|&nbsp;
          Date format: <strong>YYYY-MM-DD</strong>. Attach a photo to include an image.
        </p>
      </div>

      {/* Search + filter */}
      <div className="db-search-bar" style={{ gap: 8, flexWrap: 'wrap' }}>
        <input
          className="db-search-input"
          placeholder="Search events…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 180 }}
        />
        <select
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', padding: '8px 12px', fontSize: '0.85rem' }}
        >
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', alignSelf: 'center' }}>
          {filtered.length} item{filtered.length !== 1 ? 's' : ''}
        </span>
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
                <th>Affair</th>
                <th>Date</th>
                <th>Location</th>
                <th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', padding: '40px' }}>
                    No events yet. Post in the Telegram channel to publish events.
                  </td>
                </tr>
              )}
              {filtered.map(item => {
                const past = isPast(item.date)
                return (
                  <tr key={item.id} style={{ opacity: past ? 0.6 : 1 }}>
                    <td style={{ maxWidth: 260 }}>
                      <span style={{ color: '#fff', fontWeight: 600 }}>{item.title}</span>
                      {item.image && <span style={{ marginLeft: 8, fontSize: '0.72rem', color: '#10b981' }}>📷</span>}
                    </td>
                    <td>
                      <span className="db-tag" style={{ color: catColors[item.category] || '#4a7fd4' }}>
                        {item.category}
                      </span>
                    </td>
                    <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>
                      {item.affair || '—'}
                    </td>
                    <td style={{ whiteSpace: 'nowrap', color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>
                      {item.date}
                    </td>
                    <td style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', maxWidth: 160 }}>
                      {item.location || '—'}
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                        background: past ? 'rgba(255,255,255,0.06)' : 'rgba(34,197,94,0.1)',
                        color: past ? 'rgba(255,255,255,0.3)' : '#22c55e',
                        border: past ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(34,197,94,0.25)',
                      }}>
                        {past ? 'Completed' : 'Upcoming'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td>
                        <button
                          className="db-btn db-btn-danger"
                          style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                          onClick={() => handleDelete(item.id)}
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
