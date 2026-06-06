import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { management, affairs, events, news, contact } from '../data/data'
import { FacebookIcon, TikTokIcon, XIcon, LinkedInIcon, TelegramIcon } from '../components/SocialIcons'
import './Home.css'

/* ── Animated counter hook ── */
function useCounter(target, duration = 1800, shouldStart = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!shouldStart) return
    // Don't animate values that are years or non-numeric
    const raw = target.replace(/[,+K]/g, '')
    const isNumber = !isNaN(raw) && raw !== ''
    const numericVal = parseInt(raw)
    // Skip animation for years (4-digit numbers starting with 20xx / 19xx)
    const isYear = isNumber && numericVal >= 1900 && numericVal <= 2100
    if (!isNumber || isYear) { setCount(target); return }
    const end = numericVal * (target.includes('K') ? 1000 : 1)
    let start = 0
    const step = Math.max(1, Math.ceil(end / (duration / 16)))
    const timer = setInterval(() => {
      start += step
      if (start >= end) { setCount(target); clearInterval(timer) }
      else {
        if (target.includes('K')) setCount(Math.floor(start / 1000) + 'K+')
        else if (target.includes(',')) setCount(start.toLocaleString())
        else setCount(String(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [shouldStart, target, duration])
  return count
}

/* ── Stat item with animation ── */
function StatItem({ value, label, icon, isLast }) {
  const ref = useRef(null)
  const [started, setStarted] = useState(false)
  const count = useCounter(value, 1600, started)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); obs.disconnect() } },
      { threshold: 0.4 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <div className="stat-item" ref={ref}>
      <span className="stat-icon">{icon}</span>
      <div className="stat-body">
        <span className="stat-val">{count || value}</span>
        <span className="stat-lbl">{label}</span>
      </div>
      {!isLast && <div className="stat-sep" />}
    </div>
  )
}

const stats = [
  { value: '3',     label: 'Main Affairs',       icon: '🏛️' },
  { value: '5',     label: 'Leadership Members',  icon: '👥' },
  { value: '1,000', label: 'Students Served',     icon: '🎓' },
  { value: '2024',  label: 'Established',         icon: '📅' },
]

const values = [
  { icon: '🎯', title: 'Mission-Driven', desc: 'Every action guided by student welfare and academic excellence.' },
  { icon: '🤝', title: 'Inclusive',      desc: 'Representing every student regardless of background.' },
  { icon: '⚡', title: 'Empowering',     desc: 'Giving students the tools and voice to succeed.' },
  { icon: '🏆', title: 'Excellence',     desc: 'Upholding the highest standards in all we do.' },
]

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const categoryColors = {
  Announcement: '#4a7fd4',
  Academic:     '#10b981',
  Service:      '#e8a020',
  Discipline:   '#a78bfa',
}

const eventCatColors = {
  Sports:   '#10b981',
  Academic: '#4a7fd4',
  Workshop: '#a78bfa',
  Culture:  '#e8a020',
}

export default function Home() {
  return (
    <div className="home">

      {/* ══════════════ HERO ══════════════ */}
      <section className="hero">
        <div className="hero-particles">
          {[...Array(6)].map((_, i) => <div key={i} className={`particle p${i + 1}`} />)}
        </div>

        <div className="container hero-body">
          <div className="hero-left">
            <div className="hero-eyebrow">
              <span className="eyebrow-dot" />
              Official Students' Representative Body
            </div>

            <h1 className="hero-heading">
              Haramaya University<br />
              <em>Students' Union</em>
            </h1>

            <p className="hero-desc">
              Empowering students, championing academic excellence, and building a united campus community at Haramaya University.
            </p>

            <div className="hero-actions">
              <Link to="/about" className="btn btn-primary">
                About the Union
                <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </Link>
              <Link to="/contact" className="btn btn-glass">Get in Touch</Link>
            </div>

            {/* Quick social links */}
            <div className="hero-socials">
              {[
                { label: 'Facebook', url: contact.facebook, color: '#1877F2', icon: <FacebookIcon size={16} /> },
                { label: 'Telegram', url: contact.telegram, color: '#229ED9', icon: <TelegramIcon size={16} /> },
                { label: 'TikTok',   url: contact.tiktok,   color: '#69C9D0', icon: <TikTokIcon size={16} /> },
                { label: 'X',        url: contact.x,         color: '#e2e8f0', icon: <XIcon size={16} /> },
              ].map(s => (
                <a key={s.label} href={s.url} target="_blank" rel="noreferrer"
                  aria-label={s.label} className="hero-social-btn" style={{ '--sc': s.color }}>
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="hero-right">
            <div className="hero-card-stack">
              <div className="hcs-card hcs-back" />
              <div className="hcs-card hcs-mid" />
              <div className="hcs-card hcs-front">
                <div className="hcs-inner">
                  <div className="hcs-logos-row">
                    <div className="hcs-logo">
                      <img src="/university-logo.png" alt="HU" onError={e => e.target.style.display='none'} />
                    </div>
                    <div className="hcs-logo-sep" />
                    <div className="hcs-logo">
                      <img src="/union-logo.png" alt="Union" onError={e => e.target.style.display='none'} />
                    </div>
                  </div>
                  <h3>HUSU</h3>
                  <p>Haramaya University<br />Students' Union</p>
                  <div className="hcs-divider" />
                  <div className="hcs-stats">
                    <div><strong>3</strong><span>Affairs</span></div>
                    <div><strong>5</strong><span>Leaders</span></div>
                    <div><strong>1K+</strong><span>Students</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-scroll">
          <div className="scroll-mouse"><div className="scroll-dot" /></div>
          <span>Scroll to explore</span>
        </div>
      </section>

      {/* ══════════════ STATS ══════════════ */}
      <section className="stats-band">
        <div className="container stats-row">
          {stats.map((s, i) => (
            <StatItem key={s.label} {...s} isLast={i === stats.length - 1} />
          ))}
        </div>
      </section>

      {/* ══════════════ ABOUT ══════════════ */}
      <section className="section about-section">
        <div className="container about-grid">
          <div className="about-text">
            <p className="section-subtitle">Who we are</p>
            <h2 className="section-title">Your Voice on Campus</h2>
            <div className="accent-bar" />
            <p className="about-body">
              The Haramaya University Students' Union is the official representative body of all students. We advocate for your rights, improve campus life, and bridge the gap between students and university administration.
            </p>
            <p className="about-body" style={{ marginTop: 14 }}>
              Through our three main affairs — Academic, Discipline, and Service — we ensure every student's needs are heard and addressed.
            </p>
            <Link to="/about" className="btn btn-primary" style={{ marginTop: 32, display: 'inline-flex' }}>
              Learn More About Us
            </Link>
          </div>

          <div className="values-grid">
            {values.map(v => (
              <div key={v.title} className="value-card">
                <span className="value-icon">{v.icon}</span>
                <h4>{v.title}</h4>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ AFFAIRS ══════════════ */}
      <section className="section affairs-section">
        <div className="container">
          <div className="sh-row">
            <div>
              <p className="section-subtitle">What we do</p>
              <h2 className="section-title">Our Three Main Affairs</h2>
              <div className="accent-bar" />
            </div>
            <Link to="/affairs" className="btn btn-primary">View All →</Link>
          </div>

          <div className="affairs-row">
            {affairs.map((a, i) => (
              <div key={a.id} className="affair-card" style={{ '--ac': a.color }}>
                <div className="ac-top">
                  <span className="ac-num">0{i + 1}</span>
                  <span className="ac-icon">{a.icon}</span>
                </div>
                <h3>{a.name}</h3>
                <p>{a.description.slice(0, 105)}…</p>
                <Link to="/affairs" className="ac-more">
                  Learn more
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                    <path d="M3 8h10M9 4l4 4-4 4"/>
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ LEADERSHIP ══════════════ */}
      <section className="section leadership-section">
        <div className="container">
          <div className="leadership-header">
            <div>
              <p className="section-subtitle">Who leads us</p>
              <h2 className="section-title">Union Leadership</h2>
              <div className="accent-bar" />
              <p className="leadership-intro">
                Meet the dedicated team representing the voice of every student at Haramaya University.
              </p>
            </div>
            <Link to="/about" className="btn btn-primary">View Full Team →</Link>
          </div>

          <div className="president-spotlight">
            <div className="ps-left">
              <div className="ps-avatar">
                {management[0].image
                  ? <img src={management[0].image} alt={management[0].name} />
                  : <span>{management[0].name.split(' ').map(n => n[0]).join('')}</span>
                }
                <div className="ps-avatar-ring" />
              </div>
            </div>
            <div className="ps-right">
              <span className="ps-role-badge">President</span>
              <h3>{management[0].name}</h3>
              <div className="ps-divider" />
              <p>{management[0].bio}</p>
              <div className="ps-quote">"Leading with integrity, serving with purpose."</div>
            </div>
          </div>

          <div className="members-grid">
            {management.slice(1).map((m) => (
              <div key={m.id} className="member-card">
                <div className="mc-top">
                  <div className="mc-avatar">
                    {m.image
                      ? <img src={m.image} alt={m.name} />
                      : <span>{m.name.split(' ').map(n => n[0]).join('')}</span>
                    }
                  </div>
                </div>
                <div className="mc-body">
                  <span className="mc-role">{m.title}</span>
                  <h4>{m.name}</h4>
                  <p>{m.bio.slice(0, 80)}…</p>
                </div>
                <div className="mc-bar" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ NEWS PREVIEW ══════════════ */}
      <section className="section news-preview-section">
        <div className="container">
          <div className="sh-row">
            <div>
              <p className="section-subtitle">Stay Informed</p>
              <h2 className="section-title">Latest News</h2>
              <div className="accent-bar" />
            </div>
            <Link to="/news" className="btn btn-primary">All News →</Link>
          </div>
          <div className="news-preview-grid">
            {news.slice(0, 3).map(item => (
              <article key={item.id} className="np-card">
                <div className="np-top">
                  <span
                    className="np-category"
                    style={{ color: categoryColors[item.category] || '#4a7fd4' }}
                  >
                    {item.category}
                  </span>
                  <span className="np-date">{formatDate(item.date)}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.summary.slice(0, 100)}…</p>
                <div className="np-footer">
                  <Link to="/news" className="np-read-more">
                    Read more
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                      <path d="M3 8h10M9 4l4 4-4 4"/>
                    </svg>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ EVENTS PREVIEW ══════════════ */}
      <section className="section events-preview-section">
        <div className="container">
          <div className="sh-row">
            <div>
              <p className="section-subtitle">What's Coming</p>
              <h2 className="section-title">Upcoming Events</h2>
              <div className="accent-bar" />
            </div>
            <Link to="/events" className="btn btn-primary">All Events →</Link>
          </div>
          <div className="events-preview-list">
            {events.slice(0, 3).map(ev => {
              const d = new Date(ev.date)
              return (
                <div key={ev.id} className="ep-item">
                  <div className="ep-date">
                    <span className="ep-day">{d.toLocaleDateString('en-US', { day: '2-digit' })}</span>
                    <span className="ep-mon">{d.toLocaleDateString('en-US', { month: 'short' })}</span>
                  </div>
                  <div className="ep-body">
                    <span className="ep-cat" style={{ color: eventCatColors[ev.category] || '#4a7fd4' }}>
                      {ev.category}
                    </span>
                    <h4>{ev.title}</h4>
                    <span className="ep-loc">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      {ev.location}
                    </span>
                  </div>
                  <Link to="/events" className="ep-arrow" aria-label="View event">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <path d="M3 8h10M9 4l4 4-4 4"/>
                    </svg>
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════ CTA BANNER ══════════════ */}
      <section className="cta-banner">
        <div className="cta-banner-bg" />
        <div className="container cta-banner-inner">

          <div className="cta-banner-text">
            <h2>Stay Connected with<br /><span>Your Union</span></h2>
            <p>Get the latest news, upcoming events, and announcements directly from HUSU. We're always here for you.</p>
            <div className="cta-banner-btns">
              <Link to="/news" className="btn btn-primary">Latest News</Link>
              <Link to="/events" className="btn btn-glass">Upcoming Events</Link>
            </div>
          </div>

          <div className="cta-banner-divider" />

          <div className="cta-banner-socials">
            <p className="cta-socials-label">Follow us on</p>
            <div className="cta-socials-row">
              {[
                { label: 'Facebook', url: contact.facebook, color: '#1877F2', icon: <FacebookIcon /> },
                { label: 'Telegram', url: contact.telegram, color: '#229ED9', icon: <TelegramIcon /> },
                { label: 'TikTok',   url: contact.tiktok,   color: '#69C9D0', icon: <TikTokIcon /> },
                { label: 'X',        url: contact.x,         color: '#e2e8f0', icon: <XIcon /> },
                { label: 'LinkedIn', url: contact.linkedin,  color: '#0A66C2', icon: <LinkedInIcon /> },
              ].map(s => (
                <a key={s.label} href={s.url} target="_blank" rel="noreferrer"
                  className="cta-social-pill" style={{ '--sc': s.color }}
                  aria-label={s.label}>
                  {s.icon}
                  <span>{s.label}</span>
                </a>
              ))}
            </div>
          </div>

        </div>
      </section>

    </div>
  )
}
