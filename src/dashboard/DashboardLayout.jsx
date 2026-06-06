import { useState } from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../context/AuthContext'
import './DashboardLayout.css'

const allNavItems = [
  { to: '/dashboard',          label: 'Overview',   icon: '📊', roles: ['admin','affair_head','news_org','events_org'] },
  { to: '/dashboard/news',     label: 'News',        icon: '📰', roles: ['admin','news_org'] },
  { to: '/dashboard/events',   label: 'Events',      icon: '📅', roles: ['admin','events_org'] },
  { to: '/dashboard/affairs',  label: 'Affairs',     icon: '🏛️', roles: ['admin','affair_head'] },
  { to: '/dashboard/team',     label: 'Leadership',  icon: '👥', roles: ['admin'] },
  { to: '/dashboard/contact',  label: 'Contact Info',icon: '📬', roles: ['admin'] },
  { to: '/dashboard/users',    label: 'Users',       icon: '🔐', roles: ['admin'] },
]

const roleLabel = {
  admin:       'Administrator',
  affair_head: 'Affair Head',
  news_org:    'News Organizer',
  events_org:  'Events Organizer',
}

export default function DashboardLayout() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const role = profile?.role || 'admin'
  const navItems = allNavItems.filter(n => n.roles.includes(role))

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/login')
  }

  return (
    <div className="dash-root">

      {/* Sidebar */}
      <aside className={`dash-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="ds-brand">
          <div className="ds-logos">
            <img src="/university-logo.png" alt="HU" onError={e => e.target.style.display='none'} />
            <img src="/union-logo.png" alt="Union" onError={e => e.target.style.display='none'} />
          </div>
          <div className="ds-brand-text">
            <span>HUSU</span>
            <small>Dashboard</small>
          </div>
        </div>

        <div className="ds-user">
          <div className="ds-avatar">{(profile?.name || user?.email || 'U')[0].toUpperCase()}</div>
          <div>
            <p className="ds-name">{profile?.name || user?.email}</p>
            <p className="ds-role">{roleLabel[role] || role}</p>
          </div>
        </div>

        <nav className="ds-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) => `ds-nav-item${isActive ? ' active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="ds-nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ds-footer">
          <a href="/" className="ds-site-link" target="_blank" rel="noreferrer">
            🌐 View Website
          </a>
          <button onClick={handleLogout} className="ds-logout">
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="dash-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <div className="dash-main">
        <header className="dash-topbar">
          <button className="dash-menu-btn" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle sidebar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="dash-topbar-right">
            <span className="dash-role-badge">{roleLabel[role] || role}</span>
          </div>
        </header>

        <div className="dash-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
