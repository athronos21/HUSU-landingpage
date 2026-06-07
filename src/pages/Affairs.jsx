import { useAffairs } from '../hooks/usePublicData'
import './Affairs.css'

export default function Affairs() {
  const { data: affairs, loading } = useAffairs()

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
                <div className="av-icon">{affair.icon || '🏛️'}</div>
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
                {(affair.head?.name || affair.associativeHead?.name) && (
                  <div className="affair-leadership">
                    <h4>Leadership</h4>
                    <div className="affair-leaders-row">
                      {affair.head?.name && (
                        <div className="affair-leader-pill" style={{ '--lc': affair.color || '#1a3a6b' }}>
                          <div className="alp-avatar">
                            {affair.head.image
                              ? <img src={affair.head.image} alt={affair.head.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                              : affair.head.name.charAt(0)
                            }
                          </div>
                          <div>
                            <span>Head</span>
                            <strong>{affair.head.name}</strong>
                          </div>
                        </div>
                      )}
                      {affair.associativeHead?.name && (
                        <div className="affair-leader-pill" style={{ '--lc': affair.color || '#1a3a6b' }}>
                          <div className="alp-avatar">
                            {affair.associativeHead.image
                              ? <img src={affair.associativeHead.image} alt={affair.associativeHead.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                              : affair.associativeHead.name.charAt(0)
                            }
                          </div>
                          <div>
                            <span>Associative Head</span>
                            <strong>{affair.associativeHead.name}</strong>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
