import { useState, useMemo } from 'react'
import { useEvents } from '../hooks/usePublicData'
import { TelegramIcon } from '../components/SocialIcons'
import './Events.css'

const TELEGRAM_CHANNEL = 'HUSU_Events'

const CAT = {
  Sports:   { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.25)',  icon: '⚽' },
  Academic: { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.25)',  icon: '🎓' },
  Workshop: { color: '#c084fc', bg: 'rgba(192,132,252,0.12)', border: 'rgba(192,132,252,0.25)', icon: '🛠️' },
  Culture:  { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.25)',  icon: '🎭' },
}

function isPast(d)  { return d && new Date(d) < new Date() }
function daysLeft(d) {
  if (!d || isPast(d)) return null
  const n = Math.ceil((new Date(d) - new Date()) / 86400000)
  if (n === 0) return 'Today'
  if (n === 1) return 'Tomorrow'
  return `${n} days left`
}

function parseDMY(d) {
  if (!d) return { day: '—', month: '—', year: '—' }
  const dt = new Date(d)
  return {
    day:   dt.toLocaleDateString('en-US', { day: '2-digit' }),
    month: dt.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    year:  dt.toLocaleDateString('en-US', { year: 'numeric' }),
    full:  dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
  }
}

function CatChip({ cat }) {
  const s = CAT[cat] || CAT.Academic
  return (
    <span className="ev2-chip" style={{ color: s.color, background: s.bg, borderColor: s.border }}>
      {s.icon} {cat}
    </span>
  )
}

export default function Events() {
  const { data: events, loading } = useEvents()
  const [activeCat,  setActiveCat]  = useState('All')
  const [activeTime, setActiveTime] = useState('All') // All | Upcoming | Past
  const [selected,   setSelected]   = useState(null)

  const filtered = useMemo(() => events.filter(e =>
    (activeCat  === 'All' || e.category === activeCat) &&
    (activeTime === 'All' || (activeTime === 'Upcoming' && !isPast(e.date)) || (activeTime === 'Past' && isPast(e.date)))
  ), [events, activeCat, activeTime])

  const upcoming = events.filter(e => !isPast(e.date))
  const past     = events.filter(e =>  isPast(e.date))

  // Next upcoming event (hero feature)
  const nextEvent = upcoming[0]

  return (
    <div className="ev2-page">

      {/* ── Hero ── */}
      <section className="ev2-hero">
        <div className="ev2-hero-bg" />
        <div className="container">
          <div className="ev2-hero-eyebrow">
            <span className="ev2-pulse" />
            What's Happening
          </div>
          <h1 className="ev2-hero-title">Events &amp; Activities</h1>
          <p className="ev2-hero-sub">
            Upcoming events, programs, and activities organized by Haramaya University Students' Union.
          </p>
          {/* Stats */}
          <div className="ev2-hero-stats">
            <div className="ev2-stat">
              <strong>{upcoming.length}</strong>
              <span>Upcoming</span>
            </div>
            <div className="ev2-stat-div" />
            <div className="ev2-stat">
              <strong>{past.length}</strong>
              <span>Completed</span>
            </div>
            <div className="ev2-stat-div" />
            <div className="ev2-stat">
              <strong>{events.length}</strong>
              <span>Total</span>
            </div>
          </div>
          <a href={`https://t.me/${TELEGRAM_CHANNEL}`} target="_blank" rel="noreferrer" className="ev2-tg-btn">
            <TelegramIcon size={18} /> Follow on Telegram
          </a>
        </div>
        {/* Next event spotlight */}
        {nextEvent && (
          <div className="ev2-next-wrap container">
            <div className="ev2-next" onClick={() => setSelected(nextEvent)}>
              <div className="ev2-next-label">
                <span className="ev2-next-dot" />
                Next Event
              </div>
              <div className="ev2-next-date">
                {(() => { const d = parseDMY(nextEvent.date); return `${d.month} ${d.day}, ${d.year}` })()}
              </div>
              <h3 className="ev2-next-title">{nextEvent.title}</h3>
              <div className="ev2-next-meta">
                <CatChip cat={nextEvent.category} />
                {nextEvent.location && <span className="ev2-next-loc">📍 {nextEvent.location}</span>}
                {daysLeft(nextEvent.date) && <span className="ev2-countdown">{daysLeft(nextEvent.date)}</span>}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Filters ── */}
      <div className="ev2-filters-bar">
        <div className="container ev2-filters-inner">
          {/* Time */}
          <div className="ev2-time-btns">
            {['All', 'Upcoming', 'Past'].map(t => (
              <button key={t} className={`ev2-time-btn${activeTime === t ? ' active' : ''}`}
                onClick={() => setActiveTime(t)}>
                {t === 'Upcoming' && <span className="ev2-pulse-sm" />}
                {t}
              </button>
            ))}
          </div>
          <div className="ev2-divider" />
          {/* Category */}
          <div className="ev2-cat-btns">
            <button className={`ev2-cat-btn${activeCat === 'All' ? ' active' : ''}`}
              onClick={() => setActiveCat('All')}>All</button>
            {Object.entries(CAT).map(([c, s]) => (
              <button key={c}
                className={`ev2-cat-btn${activeCat === c ? ' active' : ''}`}
                style={activeCat === c ? { color: s.color, borderColor: s.border, background: s.bg } : {}}
                onClick={() => setActiveCat(activeCat === c ? 'All' : c)}>
                {s.icon} {c}
              </button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>
            {filtered.length} event{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <section className="ev2-body">
        <div className="container">
          {loading ? (
            <div className="ev2-loading">
              <div className="ev2-spinner" />
              Loading events…
            </div>
          ) : filtered.length === 0 ? (
            <div className="ev2-empty">
              <span>📭</span>
              <p>No events found for this filter.</p>
              <button className="ev2-tg-btn" style={{ background: 'rgba(255,255,255,0.08)' }}
                onClick={() => { setActiveCat('All'); setActiveTime('All') }}>
                Clear filters
              </button>
            </div>
          ) : (
            <div className="ev2-grid">
              {filtered.map(event => {
                const d   = parseDMY(event.date)
                const cat = CAT[event.category] || CAT.Academic
                const p   = isPast(event.date)
                const dl  = daysLeft(event.date)
                return (
                  <article key={event.id} className={`ev2-card${p ? ' past' : ''}`}
                    onClick={() => setSelected(event)}>
                    {/* Image */}
                    <div className="ev2-card-img">
                      {event.image
                        ? <img src={event.image} alt={event.title} loading="lazy" />
                        : <div className="ev2-card-img-ph" style={{ background: cat.bg }}>{cat.icon}</div>
                      }
                      {/* Date badge */}
                      <div className="ev2-date-badge" style={{ borderColor: cat.border }}>
                        <span className="ev2-db-day" style={{ color: cat.color }}>{d.day}</span>
                        <span className="ev2-db-month">{d.month}</span>
                      </div>
                      {/* Status */}
                      {dl && !p && <div className="ev2-soon">{dl}</div>}
                      {p && <div className="ev2-done">Completed</div>}
                    </div>
                    {/* Body */}
                    <div className="ev2-card-body">
                      <div className="ev2-card-meta">
                        <CatChip cat={event.category} />
                        {event.affair && <span className="ev2-affair">🏛️ {event.affair}</span>}
                      </div>
                      <h3 className="ev2-card-title">{event.title}</h3>
                      {event.description && (
                        <p className="ev2-card-desc">{event.description}</p>
                      )}
                      <div className="ev2-card-info">
                        <span className="ev2-info-row">📅 {d.full}</span>
                        {event.time     && <span className="ev2-info-row">⏰ {event.time}</span>}
                        {event.location && <span className="ev2-info-row">📍 {event.location}</span>}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          {/* Telegram CTA */}
          {!loading && events.length > 0 && (
            <div className="ev2-cta">
              <div style={{ color: '#229ED9' }}><TelegramIcon size={28} /></div>
              <div>
                <h4>Never miss an event</h4>
                <p>Follow our Telegram channel for real-time event updates and reminders.</p>
              </div>
              <a href={`https://t.me/${TELEGRAM_CHANNEL}`} target="_blank" rel="noreferrer" className="ev2-tg-btn">
                Join Channel
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ── Detail modal ── */}
      {selected && (
        <div className="ev2-modal-overlay" onClick={() => setSelected(null)}>
          <div className="ev2-modal" onClick={e => e.stopPropagation()}>
            <button className="ev2-modal-close" onClick={() => setSelected(null)}>✕</button>
            {selected.image && (
              <div className="ev2-modal-img">
                <img src={selected.image} alt={selected.title} />
              </div>
            )}
            <div className="ev2-modal-body">
              <div className="ev2-modal-meta">
                <CatChip cat={selected.category} />
                {isPast(selected.date)
                  ? <span className="ev2-done" style={{ position: 'static', fontSize: '0.72rem' }}>Completed</span>
                  : daysLeft(selected.date) && <span className="ev2-countdown">{daysLeft(selected.date)}</span>
                }
                {selected.affair && <span className="ev2-affair">🏛️ {selected.affair}</span>}
              </div>
              <h2 className="ev2-modal-title">{selected.title}</h2>
              <div className="ev2-modal-info">
                <span>📅 {parseDMY(selected.date).full}</span>
                {selected.time     && <span>⏰ {selected.time}</span>}
                {selected.location && <span>📍 {selected.location}</span>}
              </div>
              {selected.description && (
                <p className="ev2-modal-desc">{selected.description}</p>
              )}
              {selected.postedBy && <p className="ev2-modal-by">Posted by {selected.postedBy}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
