import { Link } from 'react-router-dom'
import { management, affairs } from '../data/data'
import { contact } from '../data/data'
import './Home.css'

const stats = [
  { value: '3', label: 'Main Affairs', icon: '🏛️' },
  { value: '5', label: 'Leadership Members', icon: '👥' },
  { value: '1,000+', label: 'Students Served', icon: '🎓' },
  { value: '2024', label: 'Established', icon: '📅' },
]

const values = [
  { icon: '🎯', title: 'Mission-Driven', desc: 'Every action guided by student welfare and academic excellence.' },
  { icon: '🤝', title: 'Inclusive', desc: 'Representing every student regardless of background.' },
  { icon: '⚡', title: 'Empowering', desc: 'Giving students the tools and voice to succeed.' },
  { icon: '🏆', title: 'Excellence', desc: 'Upholding the highest standards in all we do.' },
]

export default function Home() {
  return (
    <div className="home">

      {/* ══════════════ HERO ══════════════ */}
      <section className="hero">
        <div className="hero-particles">
          {[...Array(6)].map((_, i) => <div key={i} className={`particle p${i+1}`} />)}
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
          </div>

          <div className="hero-right">
            <div className="hero-card-stack">
              <div className="hcs-card hcs-back" />
              <div className="hcs-card hcs-mid" />
              <div className="hcs-card hcs-front">
                <div className="hcs-inner">
                  <h3>HUSU</h3>
                  <p>Haramaya University<br/>Students' Union</p>
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
            <div key={s.label} className="stat-item">
              <span className="stat-icon">{s.icon}</span>
              <div className="stat-body">
                <span className="stat-val">{s.value}</span>
                <span className="stat-lbl">{s.label}</span>
              </div>
              {i < stats.length - 1 && <div className="stat-sep" />}
            </div>
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
                  <span className="ac-num">0{i+1}</span>
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

          {/* President spotlight */}
          <div className="president-spotlight">
            <div className="ps-left">
              <div className="ps-avatar">
                {management[0].image
                  ? <img src={management[0].image} alt={management[0].name} />
                  : <span>{management[0].name.split(' ').map(n=>n[0]).join('')}</span>
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

          {/* Other members */}
          <div className="members-grid">
            {management.slice(1).map((m, i) => (
              <div key={m.id} className="member-card">
                <div className="mc-top">
                  <div className="mc-avatar">
                    {m.image
                      ? <img src={m.image} alt={m.name} />
                      : <span>{m.name.split(' ').map(n=>n[0]).join('')}</span>
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
                { label: 'Facebook', url: contact.facebook, color: '#1877F2',
                  icon: <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg> },
                { label: 'TikTok', url: contact.tiktok, color: '#69C9D0',
                  icon: <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/></svg> },
                { label: 'X (Twitter)', url: contact.x, color: '#e2e8f0',
                  icon: <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
                { label: 'LinkedIn', url: contact.linkedin, color: '#0A66C2',
                  icon: <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg> },
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
