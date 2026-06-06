import { useState } from 'react'
import { Link } from 'react-router-dom'
import './AnnouncementBanner.css'

export default function AnnouncementBanner() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="ann-banner" role="alert">
      <div className="ann-inner container">
        <span className="ann-badge">📢 New</span>
        <p>
          Cultural Diversity Festival is coming May 10 — 
          <Link to="/events" className="ann-link">View all upcoming events →</Link>
        </p>
      </div>
      <button
        className="ann-close"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss announcement"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  )
}
