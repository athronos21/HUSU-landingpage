import { Link } from 'react-router-dom'
import { contact as staticContact } from '../data/data'
import { FacebookIcon, TikTokIcon, XIcon, LinkedInIcon, TelegramIcon } from './SocialIcons'
import { useContact, useSiteSettings } from '../hooks/usePublicData'
import './Footer.css'

const quickLinks = [
  { to: '/',        label: 'Home' },
  { to: '/about',   label: 'About Us' },
  { to: '/affairs', label: 'Affairs' },
  { to: '/news',    label: 'News & Announcements' },
  { to: '/events',  label: 'Events' },
  { to: '/contact', label: 'Contact' },
]

export default function Footer() {
  const contact = useContact()
  const site    = useSiteSettings()
  const footer  = site.footer

  const socials = [
    { label: 'Facebook', url: contact.facebook, color: '#1877F2', icon: <FacebookIcon size={16} /> },
    { label: 'Telegram', url: contact.telegram,  color: '#229ED9', icon: <TelegramIcon size={16} /> },
    { label: 'TikTok',   url: contact.tiktok,   color: '#69C9D0', icon: <TikTokIcon size={16} /> },
    { label: 'X',        url: contact.x,         color: '#e2e8f0', icon: <XIcon size={16} /> },
    { label: 'LinkedIn', url: contact.linkedin,  color: '#0A66C2', icon: <LinkedInIcon size={16} /> },
  ]
  return (
    <footer className="footer">

      {/* ── Logo Header ── */}
      <div className="footer-logo-header">
        <div className="container flh-inner">
          <div className="flh-logo-wrap">
            <img src="/university-logo.png" alt="Haramaya University"
              onError={e => e.target.style.display = 'none'} />
          </div>
          <div className="flh-center">
            <div className="flh-accent-line" />
            <h2 className="flh-title">Haramaya University Students' Union</h2>
            <p className="flh-sub">Strong Student's Voice</p>
            <div className="flh-accent-line" />
          </div>
          <div className="flh-logo-wrap">
            <img src="/union-logo.png" alt="Students Union"
              onError={e => e.target.style.display = 'none'} />
          </div>
        </div>
      </div>

      {/* ── Main footer body ── */}
      <div className="footer-body">
        <div className="container footer-grid">

          {/* About col */}
          <div className="footer-col footer-about">
            <p className="footer-about-text">
              {footer.tagline}
            </p>
            <div className="footer-socials">
              {socials.map(s => (
                <a key={s.label} href={s.url} target="_blank" rel="noreferrer"
                  aria-label={s.label} className="footer-social-btn"
                  style={{ '--sc': s.color }}>
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="footer-col">
            <h4 className="footer-col-title">Quick Links</h4>
            <ul className="footer-links-list">
              {quickLinks.map(l => (
                <li key={l.to}>
                  <Link to={l.to}>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                      <path d="M3 8h10M9 4l4 4-4 4"/>
                    </svg>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-col">
            <h4 className="footer-col-title">Contact Us</h4>
            <ul className="footer-contact-list">
              <li>
                <span className="fcl-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </span>
                <span>{contact.address}</span>
              </li>
              <li>
                <span className="fcl-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </span>
                <a href={`tel:${contact.phone}`}>{contact.phone}</a>
              </li>
              <li>
                <span className="fcl-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </span>
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </li>
              <li>
                <span className="fcl-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                </span>
                <a href="https://www.haramaya.edu.et" target="_blank" rel="noreferrer">www.haramaya.edu.et</a>
              </li>
              <li>
                <span className="fcl-icon" style={{ color: '#229ED9' }}>
                  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 13.5l-2.95-.924c-.64-.203-.658-.64.136-.954l11.57-4.461c.537-.194 1.006.131.968.06z"/>
                  </svg>
                </span>
                <a href={contact.telegram} target="_blank" rel="noreferrer" style={{ color: '#229ED9' }}>Join our Telegram</a>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="footer-bottom-bar">
        <div className="container footer-bottom-inner">
          <p>© {new Date().getFullYear()} Haramaya University Students' Union. All rights reserved.</p>
          <p>P.O.Box: 138 Dire Dawa, Ethiopia</p>
        </div>
      </div>

    </footer>
  )
}
