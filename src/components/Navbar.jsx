import { useState, useEffect } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { usePublicElection } from '../hooks/usePublicData'
import './Navbar.css'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { election } = usePublicElection()

  const links = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About' },
    { to: '/affairs', label: 'Affairs' },
    { to: '/news', label: 'News' },
    { to: '/events', label: 'Events' },
    ...(election ? [{ to: '/election', label: '🗳️ Election' }] : []),
  ]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`site-header${scrolled ? ' scrolled' : ''}`}>

      {/* ── Top utility bar ── */}
      <div className="header-utility">
        <div className="container header-utility-inner">
          <div className="hu-left">
            <span>📮 P.O.Box: 138 Dire Dawa</span>
            <span className="hu-sep" />
            <span>📞 025-5-53-00-35 / 03-19</span>
            <span className="hu-sep" />
            <span>📠 Fax: 025-5-53-00-35</span>
            <span className="hu-sep" />
            <a href="https://www.haramaya.edu.et" target="_blank" rel="noreferrer">
              🌐 www.haramaya.edu.et
            </a>
          </div>
          <div className="hu-right">
            <span className="hu-live"><span className="hu-live-dot" />Official Union Website</span>
          </div>
        </div>
      </div>

      {/* ── Main header ── */}
      <div className="header-main">
        <div className="container header-main-inner">

          {/* Brand */}
          <Link to="/" className="header-brand" onClick={() => setOpen(false)}>
            <div className="hb-logo-wrap">
              <img src="/university-logo.png" alt="Haramaya University"
                onError={e => e.target.style.display='none'} />
            </div>
            <div className="hb-text">
              <span className="hb-title">Haramaya University Students' Union</span>
              <span className="hb-sub">Strong Student's Voice</span>
            </div>
            <div className="hb-logo-wrap">
              <img src="/union-logo.png" alt="Students Union"
                onError={e => e.target.style.display='none'} />
            </div>
          </Link>

          {/* Nav */}
          <nav className={`header-nav${open ? ' open' : ''}`}>
            <ul>
              {links.map(l => (
                <li key={l.to}>
                  <NavLink
                    to={l.to}
                    end={l.to === '/'}
                    className={({ isActive }) => isActive ? 'hn-link active' : 'hn-link'}
                    onClick={() => setOpen(false)}
                  >
                    {l.label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <NavLink to="/contact" className="hn-contact-btn" onClick={() => setOpen(false)}>
              Contact Us
            </NavLink>
          </nav>

          <button className="header-toggle" onClick={() => setOpen(o => !o)} aria-label="Toggle menu">
            <span className={open ? 'open' : ''} />
            <span className={open ? 'open' : ''} />
            <span className={open ? 'open' : ''} />
          </button>
        </div>
      </div>

    </header>
  )
}
