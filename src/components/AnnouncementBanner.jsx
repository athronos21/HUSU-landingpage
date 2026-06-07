import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import './AnnouncementBanner.css'

const defaultBanner = {
  enabled: true,
  text: 'Cultural Diversity Festival is coming May 10',
  linkText: 'View all upcoming events →',
  linkHref: '/events',
}

export default function AnnouncementBanner() {
  const [dismissed, setDismissed] = useState(false)
  const [banner, setBanner] = useState(defaultBanner)

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'site'), snap => {
      if (snap.exists() && snap.data().banner) {
        setBanner(snap.data().banner)
      }
    }, () => {})
    return unsub
  }, [])

  if (dismissed || !banner.enabled) return null

  return (
    <div className="ann-banner" role="alert">
      <div className="ann-inner container">
        <span className="ann-badge">📢 New</span>
        <p>
          {banner.text} —{' '}
          <Link to={banner.linkHref} className="ann-link">{banner.linkText}</Link>
        </p>
      </div>
      <button className="ann-close" onClick={() => setDismissed(true)} aria-label="Dismiss">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  )
}
