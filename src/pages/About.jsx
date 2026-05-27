import { management } from '../data/data'
import './About.css'

const mvItems = [
  {
    icon: '🎯',
    label: 'Mission',
    title: 'Our Mission',
    text: 'To represent, advocate, and serve the interests of all Haramaya University students by fostering academic excellence, promoting student welfare, and building a united and inclusive campus community.',
    color: '#1a3a6b',
  },
  {
    icon: '🌟',
    label: 'Vision',
    title: 'Our Vision',
    text: "To be a leading students' union in Ethiopia that empowers students to reach their full potential, contributes to national development, and upholds the values of integrity, unity, and excellence.",
    color: '#e8a020',
  },
  {
    icon: '💎',
    label: 'Values',
    title: 'Our Values',
    text: 'Integrity, transparency, inclusivity, academic excellence, student empowerment, and community service are the core values that guide everything we do.',
    color: '#059669',
  },
]

function initials(name) {
  return name.split(' ').map(n => n[0]).join('')
}

export default function About() {
  const president = management[0]
  const others    = management.slice(1)

  return (
    <div className="about-page">

      {/* ── Hero ── */}
      <section className="page-hero about-hero">
        <div className="about-hero-bg" />
        <div className="container about-hero-inner">
          <div className="about-hero-text">
            <p className="page-hero-sub">Who we are</p>
            <h1>About the Union</h1>
            <p>The Haramaya University Students' Union is the official representative body of all students — dedicated to academic excellence, student welfare, and community development.</p>
          </div>
          <div className="about-hero-card">
            <div className="ahc-stat"><strong>2024</strong><span>Established</span></div>
            <div className="ahc-sep" />
            <div className="ahc-stat"><strong>3</strong><span>Main Affairs</span></div>
            <div className="ahc-sep" />
            <div className="ahc-stat"><strong>5</strong><span>Leaders</span></div>
            <div className="ahc-sep" />
            <div className="ahc-stat"><strong>1K+</strong><span>Students</span></div>
          </div>
        </div>
      </section>

      {/* ── Mission / Vision / Values ── */}
      <section className="section mv-section">
        <div className="container">
          <div className="mv-grid">
            {mvItems.map(item => (
              <div key={item.label} className="mv-card" style={{ '--mv-color': item.color }}>
                <div className="mv-card-top">
                  <span className="mv-icon">{item.icon}</span>
                  <span className="mv-label">{item.label}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <div className="mv-card-bar" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Leadership ── */}
      <section className="section leadership-about" id="leadership">
        <div className="container">

          <div className="la-header">
            <p className="section-subtitle">Higher Management</p>
            <h2 className="section-title">Union Leadership</h2>
            <div className="accent-bar" />
          </div>

          {/* President spotlight */}
          <div className="la-president">
            <div className="la-president-avatar">
              {president.image
                ? <img src={president.image} alt={president.name} />
                : <span>{initials(president.name)}</span>
              }
              <div className="la-avatar-ring" />
            </div>
            <div className="la-president-info">
              <span className="la-president-badge">★ President</span>
              <h2>{president.name}</h2>
              <div className="la-divider" />
              <p>{president.bio}</p>
              <blockquote>"Leading with integrity, serving with purpose."</blockquote>
            </div>
          </div>

          {/* Other members */}
          <div className="la-members">
            {others.map((m, i) => (
              <div key={m.id} className="la-member-card">
                <div className="la-member-avatar">
                  {m.image
                    ? <img src={m.image} alt={m.name} />
                    : <span>{initials(m.name)}</span>
                  }
                </div>
                <div className="la-member-info">
                  <span className="la-member-role">{m.title}</span>
                  <h4>{m.name}</h4>
                  <p>{m.bio}</p>
                </div>
                <div className="la-member-index">0{i + 2}</div>
              </div>
            ))}
          </div>

        </div>
      </section>

    </div>
  )
}
