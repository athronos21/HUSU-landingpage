import { useState } from 'react'
import { contact } from '../data/data'
import { FacebookIcon, TikTokIcon, XIcon, LinkedInIcon, TelegramIcon } from '../components/SocialIcons'
import './Contact.css'

const socials = [
  { name: 'Facebook',   url: contact.facebook, color: '#1877F2', icon: <FacebookIcon size={26} />, handle: '@HaramayaUSU' },
  { name: 'Telegram',   url: contact.telegram,  color: '#229ED9', icon: <TelegramIcon size={26} />, handle: 't.me/HUSUOfficial' },
  { name: 'TikTok',     url: contact.tiktok,   color: '#69C9D0', icon: <TikTokIcon size={26} />, handle: '@haramayausu' },
  { name: 'X (Twitter)',url: contact.x,         color: '#e2e8f0', icon: <XIcon size={26} />, handle: '@HaramayaUSU' },
  { name: 'LinkedIn',   url: contact.linkedin,  color: '#0A66C2', icon: <LinkedInIcon size={26} />, handle: 'Haramaya USU' },
]

export default function Contact() {
  const [copied, setCopied] = useState('')

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(''), 2000)
    })
  }

  return (
    <div className="contact-page">

      {/* Hero */}
      <section className="page-hero contact-hero">
        <div className="contact-hero-bg" />
        <div className="container">
          <p className="page-hero-sub">Reach out</p>
          <h1>Contact Us</h1>
          <p>Have questions, suggestions, or need support? We're here for you. Reach out through any of our channels below.</p>
        </div>
      </section>

      {/* Main content */}
      <section className="section contact-section">
        <div className="container contact-layout">

          {/* Direct Contact */}
          <div className="contact-info">
            <p className="section-subtitle">Direct Contact</p>
            <h2 className="section-title">Get in Touch</h2>
            <div className="accent-bar" />

            <div className="contact-items">
              <div className="contact-item-card">
                <div className="cic-icon">📍</div>
                <div className="cic-body">
                  <span className="cic-label">Address</span>
                  <p>{contact.address}</p>
                </div>
              </div>

              <div
                className="contact-item-card clickable"
                onClick={() => copyToClipboard(contact.phone, 'phone')}
                title="Click to copy"
              >
                <div className="cic-icon">📞</div>
                <div className="cic-body">
                  <span className="cic-label">Phone</span>
                  <a href={`tel:${contact.phone}`} onClick={e => e.stopPropagation()}>{contact.phone}</a>
                </div>
                <span className="cic-copy">{copied === 'phone' ? '✓ Copied' : 'Copy'}</span>
              </div>

              <div
                className="contact-item-card clickable"
                onClick={() => copyToClipboard(contact.email, 'email')}
                title="Click to copy"
              >
                <div className="cic-icon">✉️</div>
                <div className="cic-body">
                  <span className="cic-label">Email</span>
                  <a href={`mailto:${contact.email}`} onClick={e => e.stopPropagation()}>{contact.email}</a>
                </div>
                <span className="cic-copy">{copied === 'email' ? '✓ Copied' : 'Copy'}</span>
              </div>

              <div className="contact-item-card">
                <div className="cic-icon">🌐</div>
                <div className="cic-body">
                  <span className="cic-label">Website</span>
                  <a href="https://www.haramaya.edu.et" target="_blank" rel="noreferrer">www.haramaya.edu.et</a>
                </div>
              </div>

              <div className="contact-item-card">
                <div className="cic-icon">📮</div>
                <div className="cic-body">
                  <span className="cic-label">P.O. Box</span>
                  <p>138 Dire Dawa, Ethiopia</p>
                </div>
              </div>
            </div>

            {/* Office hours */}
            <div className="office-hours">
              <h4>
                <span className="oh-dot" />
                Office Hours
              </h4>
              <div className="oh-rows">
                <div className="oh-row">
                  <span>Monday – Friday</span>
                  <span>8:00 AM – 5:00 PM</span>
                </div>
                <div className="oh-row">
                  <span>Saturday</span>
                  <span>9:00 AM – 1:00 PM</span>
                </div>
                <div className="oh-row muted">
                  <span>Sunday</span>
                  <span>Closed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="contact-socials-section">
            <p className="section-subtitle">Social Media</p>
            <h2 className="section-title">Follow Us</h2>
            <div className="accent-bar" />
            <p className="contact-socials-desc">Stay connected on our platforms for the latest updates and announcements.</p>

            <div className="socials-grid">
              {socials.map(s => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="social-card"
                  style={{ '--social-color': s.color }}
                >
                  <div className="social-icon-wrap" style={{ background: s.color + '18', border: `1px solid ${s.color}33` }}>
                    <span style={{ color: s.color }}>{s.icon}</span>
                  </div>
                  <div className="social-info">
                    <strong>{s.name}</strong>
                    <span>{s.handle}</span>
                  </div>
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
