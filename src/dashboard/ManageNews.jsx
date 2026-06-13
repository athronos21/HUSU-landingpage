import { useState } from 'react'
import { deleteDocument, useCollection } from '../hooks/useFirestore'
import { useAuth } from '../context/AuthContext'
import './Dashboard.css'

const CATEGORIES = ['Announcement', 'Academic', 'Service', 'Discipline']
const catColors  = { Announcement: '#4a7fd4', Academic: '#10b981', Service: '#e8a020', Discipline: '#a78bfa' }

const TELEGRAM_NEWS_CHANNEL = 'HUSU_News'

export default function ManageNews() {
  const { profile } = useAuth()
  const { docs, loading } = useCollection('news', 'date')
  const [search,  setSearch]  = useState('')
  const [catFilter, setCatFilter] = useState('All')

  const isAdmin = profile?.role === 'admin'

  const filtered = docs.filter(n => {
    const matchSearch = !search ||
      n.title?.toLowerCase().includes(search.toLowerCase()) ||
      n.summary?.toLowerCase().includes(search.toLowerCase()) ||
      n.affair?.toLowerCase().includes(search.toLowerCase())
    const matchCat = catFilter === 'All' || n.category === catFilter
    return matchSearch && matchCat
  })

  const handleDelete = async (id) => {
    if (!confirm('Delete this news item?')) return
    await deleteDocument('news', id)
  }

  return (
    <div className="dash-page">
      <div className="dash-page-header">
        <div>
          <h1>📰 News</h1>
          <p>News is posted via the Telegram channel and appears here automatically.</p>
        </div>
        <a
          href={`https://t.me/${TELEGRAM_NEWS_CHANNEL}`}
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
        background: 'rgba(74,127,212,0.08)', border: '1px solid rgba(74,127,212,0.2)',
        borderRadius: 12, padding: '16px 20px', marginBottom: 24,
        fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7,
      }}>
        <strong style={{ color: '#4a7fd4' }}>📋 How to post news:</strong> Open the Telegram channel and send a message in this format:
        <pre style={{ margin: '10px 0 0', padding: '10px 14px', background: 'rgba(0,0,0,0.3)', borderRadius: 8, fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', overflowX: 'auto' }}>{`Title: Your news headline
Category: Academic
Affair: Academic

Full description of the news here...`}</pre>
        <p style={{ margin: '8px 0 0', fontSize: '0.78rem' }}>
          Valid categories: <strong>Announcement · Academic · Service · Discipline</strong> &nbsp;|&nbsp;
          Attach a photo to include an image. Affair heads post from the shared channel and tag their affair.
        </p>
      </div>

      {/* Search + filter */}
      <div className="db-search-bar" style={{ gap: 8, flexWrap: 'wrap' }}>
        <input
          className="db-search-input"
          placeholder="Search news…"
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
                <th>Source</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', padding: '40px' }}>
                    No news yet. Post in the Telegram channel to publish news.
                  </td>
                </tr>
              )}
              {filtered.map(item => (
                <tr key={item.id}>
                  <td style={{ maxWidth: 300 }}>
                    <span style={{ color: '#fff', fontWeight: 600 }}>{item.title}</span>
                    {item.image && <span style={{ marginLeft: 8, fontSize: '0.72rem', color: '#10b981' }}>📷</span>}
                    <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.38)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>
                      {item.summary}
                    </p>
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
                  <td>
                    <span style={{
                      fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                      background: item.source === 'telegram' ? 'rgba(42,163,239,0.12)' : 'rgba(255,255,255,0.06)',
                      color: item.source === 'telegram' ? '#29a3ef' : 'rgba(255,255,255,0.4)',
                      border: item.source === 'telegram' ? '1px solid rgba(42,163,239,0.25)' : '1px solid rgba(255,255,255,0.1)',
                    }}>
                      {item.source === 'telegram' ? '✈️ Telegram' : '🖊️ Manual'}
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
