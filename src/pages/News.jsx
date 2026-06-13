import { useState, useMemo } from 'react'
import { useNews } from '../hooks/usePublicData'
import { TelegramIcon } from '../components/SocialIcons'
import './News.css'

const TELEGRAM_CHANNEL = 'HUSU_News'

const categoryColors = {
  Announcement: { bg: '#1a3a6b22', color: '#4a7fd4', border: '#1a3a6b44' },
  Academic:     { bg: '#05966922', color: '#10b981', border: '#05966944' },
  Service:      { bg: '#e8a02022', color: '#e8a020', border: '#e8a02044' },
  Discipline:   { bg: '#7c3aed22', color: '#a78bfa', border: '#7c3aed44' },
}

const ALL_CATEGORIES = ['All', ...Object.keys(categoryColors)]

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export default function News() {
  const { data: news, loading } = useNews()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const filtered = useMemo(() => {
    return news.filter(item => {
      const matchCat = activeCategory === 'All' || item.category === activeCategory
      const q = search.toLowerCase()
      const matchSearch = !q ||
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      return matchCat && matchSearch
    })
  }, [search, activeCategory])

  return (
    <div className="news-page">

      {/* Hero */}
      <section className="page-hero news-hero">
        <div className="news-hero-bg" />
        <div className="container">
          <p className="page-hero-sub">Stay Informed</p>
          <h1>News &amp; Announcements</h1>
          <p>The latest updates, announcements, and news from Haramaya University Students' Union.</p>
        </div>
      </section>

      {/* News list */}
      <section className="section news-section">
        <div className="container">

          <div className="news-top-row">
            <div>
              <p className="section-subtitle">Latest Updates</p>
              <h2 className="section-title">Recent News</h2>
              <div className="accent-bar" />
            </div>
            <a
              href={`https://t.me/${TELEGRAM_CHANNEL}`}
              target="_blank"
              rel="noreferrer"
              className="tg-follow-btn"
            >
              <TelegramIcon size={18} />
              Follow on Telegram
            </a>
          </div>

          {/* Search + Filter bar */}
          <div className="news-controls">
            <div className="news-search-wrap">
              <svg className="ns-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                className="news-search"
                placeholder="Search news…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search news"
              />
              {search && (
                <button className="ns-clear" onClick={() => setSearch('')} aria-label="Clear search">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>

            <div className="news-filters" role="tablist" aria-label="Filter by category">
              {ALL_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  role="tab"
                  aria-selected={activeCategory === cat}
                  className={`news-filter-btn${activeCategory === cat ? ' active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Results count */}
          {loading ? (
            <p style={{ color: 'rgba(255,255,255,0.35)', padding: '40px 0', textAlign: 'center' }}>Loading news…</p>
          ) : (
          <>
          <p className="news-results-count">
            Showing <strong>{filtered.length}</strong> of <strong>{news.length}</strong> articles
          </p>

          {filtered.length === 0 ? (
            <div className="news-empty">
              <span>🔍</span>
              <p>No news found matching your search.</p>
              <button onClick={() => { setSearch(''); setActiveCategory('All') }} className="tg-follow-btn" style={{ background: 'rgba(255,255,255,0.1)', marginTop: 4 }}>
                Clear filters
              </button>
            </div>
          ) : (
            <div className="news-list">
              {filtered.map((item, i) => {
                const cat = categoryColors[item.category] || categoryColors.Announcement
                return (
                  <article key={item.id} className="news-card">
                    {item.image && (
                      <div className="nc-image">
                        <img src={item.image} alt={item.title} loading="lazy" />
                      </div>
                    )}
                    <div className="nc-index">{String(i + 1).padStart(2, '0')}</div>
                    <div className="nc-body">
                      <div className="nc-meta">
                        <span
                          className="nc-category"
                          style={{ background: cat.bg, color: cat.color, borderColor: cat.border }}
                        >
                          {item.category}
                        </span>
                        {item.affair && (
                          <span className="nc-affair">🏛️ {item.affair} Affair</span>
                        )}
                        <span className="nc-date">{formatDate(item.date)}</span>
                      </div>
                      <h3>{item.title}</h3>
                      <p>{item.summary}</p>
                      {item.postedBy && (
                        <p className="nc-posted-by">Posted by {item.postedBy}</p>
                      )}
                    </div>
                    <div className="nc-accent" />
                  </article>
                )
              })}
            </div>
          )}

          {/* Telegram CTA */}
          <div className="news-tg-cta">
            <TelegramIcon size={32} />
            <div>
              <h4>Get real-time updates</h4>
              <p>Follow our Telegram channel for instant news and announcements.</p>
            </div>
            <a
              href={`https://t.me/${TELEGRAM_CHANNEL}`}
              target="_blank"
              rel="noreferrer"
              className="tg-follow-btn"
            >
              Join Channel
            </a>
          </div>
          </>
          )}

        </div>
      </section>
    </div>
  )
}
