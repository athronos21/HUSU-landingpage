import { contact } from '../data/data'
import { FacebookIcon, TikTokIcon, XIcon, LinkedInIcon } from '../components/SocialIcons'
import './Contact.css'

const socials = [
  { name: 'Facebook',   url: contact.facebook, color: '#1877F2', icon: <FacebookIcon size={28} /> },
  { name: 'TikTok',     url: contact.tiktok,   color: '#000000', icon: <TikTokIcon size={28} /> },
  { name: 'X (Twitter)',url: contact.x,         color: '#000000', icon: <XIcon size={28} /> },
  { name: 'LinkedIn',   url: contact.linkedin,  color: '#0A66C2', icon: <LinkedInIcon size={28} /> },
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
