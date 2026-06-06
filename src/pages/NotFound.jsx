import { Link, useNavigate } from 'react-router-dom'
import './NotFound.css'

const quickLinks = [
  { to: '/',        label: 'Home',    icon: '🏠' },
  { to: '/about',   label: 'About',   icon: '👥' },
  { to: '/news',    label: 'News',    icon: '📰' },
  { to: '/events',  label: 'Events',  icon: '📅' },
  { to: '/contact', label: 'Contact', icon: '📬' },
]

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="notfound-page">
      <div className="nf-bg" />

      <div className="nf-content">
        <div className="nf-code">404</div>
        <h1>Page Not Found</h1>
        <p>The page you're looking for doesn't exist or has been moved. Let's get you back on track.</p>

        <div className="nf-actions">
          <button onClick={() => navigate(-1)} className="btn btn-glass nf-back-btn">
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/>
            </svg>
            Go Back
          </button>
          <Link to="/" className="btn btn-primary">
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
            </svg>
            Back to Home
          </Link>
        </div>

        <div className="nf-links">
          <p className="nf-links-label">Or visit a page:</p>
          <div className="nf-links-row">
            {quickLinks.map(l => (
              <Link key={l.to} to={l.to} className="nf-quick-link">
                <span>{l.icon}</span>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
