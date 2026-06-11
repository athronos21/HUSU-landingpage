import { useState } from 'react'
import { useAffairs } from '../hooks/usePublicData'
import { useCollection } from '../hooks/useFirestore'
import { renderIcon } from '../dashboard/IconPicker'
import './Affairs.css'

/* ── Leader profile modal ── */
function LeaderModal({ person, role, color, onClose }) {
  if (!person) return null
  const hasContacts = person.email || person.phone || person.telegram
  return (
    <div className="lm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="lm-card" style={{ '--lc': color }}>
        {/* Colored banner */}
        <div className="lm-banner" />
        <button className="lm-close" onClick={onClose} aria-label="Close">✕</button>

        {/* Avatar overlapping banner */}
        <div className="lm-avatar">
          {person.image
            ? <img src={person.image} alt={person.name} />
            : <span>{person.name?.charAt(0) || '?'}</span>
          }
        </div>

        {/* Info */}
        <div className="lm-info">
          <div className="lm-role">{role}</div>
          <h3 className="lm-name">{person.name}</h3>
          {person.title && person.title !== role && (
            <p className="lm-title">{person.title}</p>
          )}

          {hasContacts && <div className="lm-divider" />}

          {/* Contact options */}
          {hasContacts && (
            <div className="lm-contacts">
              {person.email && (
                <a href={`mailto:${person.email}`} className="lm-contact-btn lm-email">
                  <span className="lm-contact-icon">✉️</span>
                  <span>{person.email}</span>
                </a>
              )}
              {person.phone && (
                <a href={`tel:${person.phone}`} className="lm-contact-btn lm-phone">
                  <span className="lm-contact-icon">📞</span>
                  <span>{person.phone}</span>
                </a>
              )}
              {person.telegram && (
                <a
                  href={`https://t.me/${person.telegram.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lm-contact-btn lm-telegram"
                >
                  <span className="lm-contact-icon">✈️</span>
                  <span>{person.telegram.startsWith('@') ? person.telegram : `@${person.telegram}`}</span>
                </a>
              )}
            </div>
          )}

          {!hasContacts && (
            <p className="lm-no-contact">No contact info available</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Affairs() {
  const { data: affairs, loading } = useAffairs()
  const { docs: allUsers } = useCollection('users', 'createdAt')
  const [selected, setSelected] = useState(null)

  // Get live user data, fall back to embedded snapshot
  const getHead = (affair) => {
    if (affair.headUid) {
      const u = allUsers.find(u => u.id === affair.headUid)
      if (u) return { name: u.name, image: u.image, phone: u.phone, telegram: u.telegram, email: u.email, title: 'Head' }
    }
    return affair.head || null
  }
  const getAssoc = (affair) => {
    if (affair.assocUid) {
      const u = allUsers.find(u => u.id === affair.assocUid)
      if (u) return { name: u.name, image: u.image, phone: u.phone, telegram: u.telegram, email: u.email, title: 'Associative Head' }
    }
    return affair.associativeHead || null
  }

  const openLeader = (person, role, color) => {
    if (!person?.name) return
    setSelected({ person, role, color })
  }
  const closeLeader = () => setSelected(null)

  return (
    <div className="affairs-page">

      {/* Hero */}
      <section className="page-hero affairs-hero">
        <div className="affairs-hero-shapes">
          <div className="ahs ahs-1" />
          <div className="ahs ahs-2" />
          <div className="ahs ahs-3" />
        </div>
        <div className="container">
          <p className="page-hero-sub">Our Affairs</p>
          <h1>Affairs</h1>
          <p>
            The Students' Union oversees many areas of student life. Each affair is dedicated to serving students in a specific domain — academic, welfare, discipline, and more.
          </p>
        </div>
      </section>

      {/* Intro note */}
      <section className="affairs-note-section">
        <div className="container">
          <div className="affairs-note">
            <span className="affairs-note-icon">📌</span>
            <p>
              HUSU manages {affairs.length} active affair{affairs.length !== 1 ? 's' : ''}, each led by a dedicated head and associative head committed to student welfare.
            </p>
          </div>
        </div>
      </section>

      {/* Affairs list */}
      <section className="section affairs-list-section">
        <div className="container">
          {loading && (
            <p style={{ color: 'rgba(255,255,255,0.35)', textAlign: 'center', padding: '40px 0' }}>Loading affairs…</p>
          )}
          {affairs.map((affair, i) => (
            <div key={affair.id || i} className={`affair-block ${i % 2 === 1 ? 'reverse' : ''}`}>

              {/* Visual side */}
              <div className="affair-visual" style={{ '--ac': affair.color || '#1a3a6b' }}>
                <div className="av-icon">{renderIcon(affair.icon, 72) || '🏛️'}</div>
                <div className="av-badge">{affair.name}</div>
                <div className="av-number">{String(i + 1).padStart(2, '0')}</div>
              </div>

              {/* Content side */}
              <div className="affair-content">
                <span
                  className="affair-tag"
                  style={{
                    color: affair.color || '#1a3a6b',
                    borderColor: (affair.color || '#1a3a6b') + '44',
                    background: (affair.color || '#1a3a6b') + '12',
                  }}
                >
                  Active Affair
                </span>
                <h2 style={{ color: 'var(--white)' }}>{affair.name}</h2>
                <div className="affair-accent" style={{ background: affair.color || '#1a3a6b' }} />
                <p className="affair-desc">{affair.description}</p>

                {/* Leadership */}
                {(getHead(affair)?.name || getAssoc(affair)?.name) && (
                  <div className="affair-leadership">
                    <h4>Leadership</h4>
                    <div className="affair-leaders-row">
                      {getHead(affair)?.name && (() => { const head = getHead(affair); return (
                        <button type="button" className="affair-leader-pill" style={{ '--lc': affair.color || '#1a3a6b' }}
                          onClick={() => openLeader(head, head.title || 'Head', affair.color || '#1a3a6b')} title="Tap to view contact info">
                          <div className="alp-avatar">
                            {head.image ? <img src={head.image} alt={head.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : head.name.charAt(0)}
                          </div>
                          <div><span>Head</span><strong>{head.name}</strong></div>
                          <span className="alp-tap-hint">👆 tap</span>
                        </button>
                      )})()}
                      {getAssoc(affair)?.name && (() => { const assoc = getAssoc(affair); return (
                        <button type="button" className="affair-leader-pill" style={{ '--lc': affair.color || '#1a3a6b' }}
                          onClick={() => openLeader(assoc, assoc.title || 'Associative Head', affair.color || '#1a3a6b')} title="Tap to view contact info">
                          <div className="alp-avatar">
                            {assoc.image ? <img src={assoc.image} alt={assoc.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : assoc.name.charAt(0)}
                          </div>
                          <div><span>Associative Head</span><strong>{assoc.name}</strong></div>
                          <span className="alp-tap-hint">👆 tap</span>
                        </button>
                      )})()}
                    </div>
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      </section>

      {/* Leader profile modal */}
      {selected && (
        <LeaderModal
          person={selected.person}
          role={selected.role}
          color={selected.color}
          onClose={closeLeader}
        />
      )}
    </div>
  )
}
