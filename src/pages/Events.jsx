import { useState, useMemo } from 'react'
import { events } from '../data/data'
import { TelegramIcon } from '../components/SocialIcons'
import './Events.css'

const TELEGRAM_CHANNEL = 'HUSUEvents'

const categoryStyles = {
  Sports:   { bg: '#05966922', color: '#10b981', border: '#05966944', icon: '⚽' },
  Academic: { bg: '#1a3a6b22', color: '#4a7fd4', border: '#1a3a6b44', icon: '🎓' },
  Workshop: { bg: '#7c3aed22', color: '#a78bfa', border: '#7c3aed44', icon: '🛠️' },
  Culture:  { bg: '#e8a02022', color: '#e8a020', border: '#e8a02044', icon: '🎭' },
}

const ALL_CATS = ['All', ...Object.keys(categoryStyles)]

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return {
    day:   d.toLocaleDateString('en-US', { day: '2-digit' }),
    month: d.toLocaleDateString('en-US', { month: 'short' }),
    year:  d.toLocaleDateString('en-US', { year: 'numeric' }),
  }
}

function isPast(dateStr) {
  return new Date(dateStr) < new Date()
}

export default function Events() {
  const [activeFilter, setActiveFilter] = useState('All')

  const filtered = useMemo(() => {
    if (activeFilter === 'All') return events
    return events.filter(e => e.category === activeFilter)
  }, [activeFilter])

  const upcoming = filtered.filter(e => !isPast(e.date))
  const past     = filtered.filter(e => isPast(e.date))

  return (
    <div className="events-page">

      {/* Hero */}
      <section className="page-hero events-hero">
        <div className="events-hero-bg" />
        <div className="container">
          <p className="page-hero-sub">What's Happening</p>
          <h1>Events &amp; Activities</h1>
          <p>Upcoming events, programs, and activities organized by Haramaya University Students' Union.</p>
        </div>
      </section>

      {/* Events list */}
      <section className="section events-section">
        <div className="container">

          <div className="events-top-row">
            <div>
              <p className="section-subtitle">Upcoming</p>
              <h2 className="section-title">Events Calendar</h2>
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

          {/* Category filters */}
          <div className="events-filters" role="tablist" aria-label="Filter by category">
            {ALL_CATS.map(cat => (
              <button
                key={cat}
                role="tab"
                aria-selected={activeFilter === cat}
                className={`event-filter-btn${activeFilter === cat ? ' active' : ''}`}
                onClick={() => setActiveFilter(cat)}
                style={cat !== 'All' && activeFilter === cat ? {
                  background: categoryStyles[cat]?.bg,
                  borderColor: categoryStyles[cat]?.border,
                  color: categoryStyles[cat]?.color,
                } : {}}
              >
                {cat !== 'All' && <span>{categoryStyles[cat]?.icon}</span>}
                {cat}
              </button>
            ))}
          </div>

          {/* Upcoming events */}
          {upcoming.length > 0 && (
            <>
              <div className="events-group-label">
                <span className="egl-dot upcoming" />
                Upcoming Events ({upcoming.length})
              </div>
              <div className="events-grid">
                {upcoming.map(event => {
                  const date = formatDate(event.date)
                  const cat  = categoryStyles[event.category] || categoryStyles.Academic
                  return (
                    <article key={event.id} className="event-card">
                      <div className="ec-date-block">
                        <span className="ec-day">{date.day}</span>
                        <span className="ec-month">{date.month}</span>
                        <span className="ec-year">{date.year}</span>
                      </div>
                      <div className="ec-body">
                        <div className="ec-meta">
                          <span
                            className="ec-category"
                            style={{ background: cat.bg, color: cat.color, borderColor: cat.border }}
                          >
                            {cat.icon} {event.category}
                          </span>
                          <span className="ec-upcoming-badge">Upcoming</span>
                        </div>
                        <h3>{event.title}</h3>
                        <p className="ec-desc">{event.description}</p>
                        <div className="ec-details">
                          <span className="ec-detail">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                            </svg>
                            {event.time}
                          </span>
                          <span className="ec-detail">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                            </svg>
                            {event.location}
                          </span>
                        </div>
                      </div>
                      <div className="ec-accent" />
                    </article>
                  )
                })}
              </div>
            </>
          )}

          {/* Past events */}
          {past.length > 0 && (
            <>
              <div className="events-group-label" style={{ marginTop: 40 }}>
                <span className="egl-dot past" />
                Past Events ({past.length})
              </div>
              <div className="events-grid past-events">
                {past.map(event => {
                  const date = formatDate(event.date)
                  const cat  = categoryStyles[event.category] || categoryStyles.Academic
                  return (
                    <article key={event.id} className="event-card past-card">
                      <div className="ec-date-block">
                        <span className="ec-day">{date.day}</span>
                        <span className="ec-month">{date.month}</span>
                        <span className="ec-year">{date.year}</span>
                      </div>
                      <div className="ec-body">
                        <div className="ec-meta">
                          <span
                            className="ec-category"
                            style={{ background: cat.bg, color: cat.color, borderColor: cat.border }}
                          >
                            {cat.icon} {event.category}
                          </span>
                          <span className="ec-past-badge">Completed</span>
                        </div>
                        <h3>{event.title}</h3>
                        <p className="ec-desc">{event.description}</p>
                        <div className="ec-details">
                          <span className="ec-detail">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                            </svg>
                            {event.time}
                          </span>
                          <span className="ec-detail">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                            </svg>
                            {event.location}
                          </span>
                        </div>
                      </div>
                      <div className="ec-accent" />
                    </article>
                  )
                })}
              </div>
            </>
          )}

          {filtered.length === 0 && (
            <div className="events-empty">
              <span>📭</span>
              <p>No events found for this category.</p>
            </div>
          )}

          {/* Telegram CTA */}
          <div className="events-tg-cta">
            <TelegramIcon size={32} />
            <div>
              <h4>Never miss an event</h4>
              <p>Follow our Telegram channel for real-time event updates and reminders.</p>
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

        </div>
      </section>
    </div>
  )
}
