import { affairs } from '../data/data'
import './Affairs.css'

export default function Affairs() {
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
            The Students' Union oversees many areas of student life. At this time, we are actively focusing on three core Affairs — Academic, Discipline, and Service — to deliver the greatest impact for our students.
          </p>
        </div>
      </section>

      {/* Intro note */}
      <section className="affairs-note-section">
        <div className="container">
          <div className="affairs-note">
            <span className="affairs-note-icon">📌</span>
            <p>
              While HUSU manages a broad range of student affairs, our current priority is strengthening these three Affairs. More affairs will be activated as the union grows.
            </p>
          </div>
        </div>
      </section>

      {/* Affairs list */}
      <section className="section affairs-list-section">
        <div className="container">
          {affairs.map((affair, i) => (
            <div key={affair.id} className={`affair-block ${i % 2 === 1 ? 'reverse' : ''}`}>

              {/* Visual side */}
              <div className="affair-visual" style={{ '--ac': affair.color }}>
                <div className="av-icon">{affair.icon}</div>
                <div className="av-badge">{affair.name}</div>
                <div className="av-number">0{i + 1}</div>
              </div>

              {/* Content side */}
              <div className="affair-content">
                <span className="affair-tag" style={{ color: affair.color, borderColor: affair.color + '44', background: affair.color + '12' }}>
                  Active Affair
                </span>
                <h2 style={{ color: 'var(--white)' }}>{affair.name}</h2>
                <div className="affair-accent" style={{ background: affair.color }} />
                <p className="affair-desc">{affair.description}</p>

                <div className="affair-leadership">
                  <h4>Leadership</h4>
                  <div className="affair-leaders-row">
                    <div className="affair-leader-pill" style={{ '--lc': affair.color }}>
                      <div className="alp-avatar">{affair.head.name.charAt(0)}</div>
                      <div>
                        <span>Head</span>
                        <strong>{affair.head.name}</strong>
                      </div>
                    </div>
                    <div className="affair-leader-pill" style={{ '--lc': affair.color }}>
                      <div className="alp-avatar">{affair.associativeHead.name.charAt(0)}</div>
                      <div>
                        <span>Associative Head</span>
                        <strong>{affair.associativeHead.name}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
