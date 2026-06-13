import { useState, useMemo } from 'react'
import { useNews } from '../hooks/usePublicData'
import { TelegramIcon } from '../components/SocialIcons'
import './News.css'

const TELEGRAM_CHANNEL = 'HUSU_News'

const CAT = {
  Announcement: { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.25)'  },
  Academic:     { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.25)'  },
  Service:      { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.25)'  },
  Discipline:   { color: '#c084fc', bg: 'rgba(192,132,252,0.12)', border: 'rgba(192,132,252,0.25)' },
}
const ALL_CATS = ['All', ...Object.keys(CAT)]

function timeAgo(d) {
  if (!d) return ''
  const days = Math.floor((Date.now() - new Date(d)) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7)  return `${days} days ago`
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function CatChip({ cat }) {
  const s = CAT[cat] || CAT.Announcement
  return (
    <span className="n2-chip" style={{ color: s.color, background: s.bg, borderColor: s.border }}>
      {cat}
    </span>
  )
}

export default function News() {
  const { data: news, loading } = useNews()
  const [search,  setSearch]  = useState('')
  const [activeCat, setActiveCat] = useState('All')
  const [expanded, setExpanded]   = useState(null)

  const filtered = useMemo(() => news.filter(item => {
    const q = search.toLowerCase()
    return (activeCat === 'All' || item.category === activeCat) &&
      (!q || item.title?.toLowerCase().includes(q) || item.summary?.toLowerCase().includes(q))
  }), [news, search, activeCat])

  const featured = filtered[0]
  const rest     = filtered.slice(1)

  return (
    <div className="n2-page">

      {/* ── Hero ── */}
      <section className="n2-hero">
        <div className="n2-hero-shapes">
          <div className="n2-hs n2-hs1" />
          <div className="n2-hs n2-hs2" />
        </div>
        <div className="container">
          <div className="n2-hero-eyebrow">
            <span className="n2-live-dot" />
            Live Updates
          </div>
          <h1 className="n2-hero-title">News &amp; Announcements</h1>
          <p className="n2-hero-sub">
            The latest from Haramaya University Students' Union — straight from our Telegram channels.
          </p>
          <div className="n2-hero-actions">
            <a href={`https://t.me/${TELEGRAM_CHANNEL}`} target="_blank" rel="noreferrer" className="n2-tg-btn">
              <TelegramIcon size={18} /> Follow on Telegram
            </a>
            <div className="n2-hero-count">
              <strong>{news.length}</strong> articles published
            </div>
          </div>
        </div>
      </section>

      {/* ── Toolbar ── */}
      <div className="n2-toolbar">
        <div className="container n2-toolbar-inner">
          {/* Search */}
          <div className="n2-search-wrap">
            <svg className="n2-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="n2-search"
              placeholder="Search news…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button className="n2-search-clear" onClick={() => setSearch('')}>×</button>}
          </div>
          {/* Category pills */}
          <div className="n2-cats">
            {ALL_CATS.map(c => (
              <button
                key={c}
                className={`n2-cat-btn${activeCat === c ? ' active' : ''}`}
                style={activeCat === c && c !== 'All' ? { color: CAT[c]?.color, borderColor: CAT[c]?.border, background: CAT[c]?.bg } : {}}
                onClick={() => setActiveCat(c)}
              >
                {c}
                <span className="n2-cat-count">
                  {c === 'All' ? news.length : news.filter(n => n.category === c).length}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <section className="n2-body">
        <div className="container">
          {loading ? (
            <div className="n2-loading">
              <div className="n2-spinner" />
              Loading news…
            </div>
          ) : filtered.length === 0 ? (
            <div className="n2-empty">
              <span>🔍</span>
              <p>No articles found{search ? ` for "${search}"` : ''}.</p>
              <button className="n2-tg-btn" style={{ background: 'rgba(255,255,255,0.08)' }}
                onClick={() => { setSearch(''); setActiveCat('All') }}>
                Clear filters
              </button>
            </div>
          ) : (
            <>
              {/* Featured article */}
              {featured && (
                <div className="n2-featured" onClick={() => setExpanded(expanded?.id === featured.id ? null : featured)}>
                  <div className="n2-featured-img">
                    {featured.image
                      ? <img src={featured.image} alt={featured.title} loading="lazy" />
                      : <div className="n2-featured-img-placeholder">📰</div>
                    }
                    <div className="n2-featured-overlay" />
                    <div className="n2-featured-badge">Featured</div>
                  </div>
                  <div className="n2-featured-body">
                    <div className="n2-featured-meta">
                      <CatChip cat={featured.category} />
                      {featured.affair && <span className="n2-affair">🏛️ {featured.affair}</span>}
                      <span className="n2-date">{timeAgo(featured.date)}</span>
                    </div>
                    <h2 className="n2-featured-title">{featured.title}</h2>
                    <p className="n2-featured-summary">{featured.summary}</p>
                    {featured.postedBy && <p className="n2-posted-by">By {featured.postedBy}</p>}
                    <button className="n2-read-btn">
                      {expanded?.id === featured.id ? 'Close ↑' : 'Read more →'}
                    </button>
                  </div>
                  {expanded?.id === featured.id && (
                    <div className="n2-expand" onClick={e => e.stopPropagation()}>
                      <p>{featured.summary}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Grid */}
              {rest.length > 0 && (
                <div className="n2-grid">
                  {rest.map(item => (
                    <article
                      key={item.id}
                      className={`n2-card${expanded?.id === item.id ? ' open' : ''}`}
                      onClick={() => setExpanded(expanded?.id === item.id ? null : item)}
                    >
                      <div className="n2-card-img">
                        {item.image
                          ? <img src={item.image} alt={item.title} loading="lazy" />
                          : <div className="n2-card-img-ph" style={{ background: CAT[item.category]?.bg || 'rgba(74,127,212,0.1)' }}>📰</div>
                        }
                      </div>
                      <div className="n2-card-body">
                        <div className="n2-card-meta">
                          <CatChip cat={item.category} />
                          {item.affair && <span className="n2-affair">🏛️ {item.affair}</span>}
                        </div>
                        <h3 className="n2-card-title">{item.title}</h3>
                        <p className="n2-card-summary">{item.summary}</p>
                        <div className="n2-card-footer">
                          <span className="n2-date">{timeAgo(item.date)}</span>
                          {item.postedBy && <span className="n2-posted-by">{item.postedBy}</span>}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Telegram CTA */}
          {!loading && news.length > 0 && (
            <div className="n2-cta">
              <div className="n2-cta-icon"><TelegramIcon size={28} /></div>
              <div>
                <h4>Get notified instantly</h4>
                <p>Follow our Telegram channel for real-time news and announcements.</p>
              </div>
              <a href={`https://t.me/${TELEGRAM_CHANNEL}`} target="_blank" rel="noreferrer" className="n2-tg-btn">
                Join Channel
              </a>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
