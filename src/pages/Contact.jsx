import { contact } from '../data/data'
import './Contact.css'

const socials = [
  {
    name: 'Facebook',
    url: contact.facebook,
    color: '#1877F2',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
      </svg>
    ),
  },
  {
    name: 'TikTok',
    url: contact.tiktok,
    color: '#000000',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
      </svg>
    ),
  },
  {
    name: 'X (Twitter)',
    url: contact.x,
    color: '#000000',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    name: 'LinkedIn',
    url: contact.linkedin,
    color: '#0A66C2',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/>
        <circle cx="4" cy="4" r="2"/>
      </svg>
    ),
  },
]

export default function Contact() {
  return (
    <div className="contact-page">
      <section className="page-hero">
        <div className="container">
          <p className="page-hero-sub">Reach out</p>
          <h1>Contact Us</h1>
          <p>Have questions, suggestions, or need support? We're here for you. Reach out through any of our channels below.</p>
        </div>
      </section>

      <section className="section">
        <div className="container contact-layout">

          {/* Direct Contact */}
          <div className="contact-info">
            <h2 className="section-title">Get in Touch</h2>
            <div className="accent-bar" />

            <div className="contact-items">
              <div className="contact-item card">
                <div className="contact-icon">📍</div>
                <div>
                  <h4>Address</h4>
                  <p>{contact.address}</p>
                </div>
              </div>
              <div className="contact-item card">
                <div className="contact-icon">📞</div>
                <div>
                  <h4>Phone</h4>
                  <a href={`tel:${contact.phone}`}>{contact.phone}</a>
                </div>
              </div>
              <div className="contact-item card">
                <div className="contact-icon">✉️</div>
                <div>
                  <h4>Email</h4>
                  <a href={`mailto:${contact.email}`}>{contact.email}</a>
                </div>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="contact-socials-section">
            <h2 className="section-title">Follow Us</h2>
            <div className="accent-bar" />
            <p className="section-subtitle">Stay connected on our social media platforms for the latest updates.</p>

            <div className="socials-grid">
              {socials.map(s => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="social-card card"
                  style={{ '--social-color': s.color }}
                >
                  <div className="social-icon" style={{ color: s.color }}>
                    {s.icon}
                  </div>
                  <span>{s.name}</span>
                  <span className="social-arrow">→</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
