import { useState } from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { ROLE_LABELS, NAV_ACCESS, DASHBOARD_ROLES } from './roles'
import './DashboardLayout.css'

const allNavItems = [
  { to: '/dashboard',             label: 'Overview',     icon: '📊', key: 'overview'   },
  { to: '/dashboard/site',        label: 'Site Settings',icon: '🌐', key: 'site'        },
  { to: '/dashboard/news',        label: 'News',         icon: '📰', key: 'news'        },
  { to: '/dashboard/events',      label: 'Events',       icon: '📅', key: 'events'      },
  { to: '/dashboard/affairs',     label: 'Affairs',      icon: '🏛️', key: 'affairs'     },
  { to: '/dashboard/team',        label: 'Leadership',   icon: '👥', key: 'team'        },
  { to: '/dashboard/contact',     label: 'Contact Info', icon: '📬', key: 'contact'     },
  { to: '/dashboard/users',       label: 'Members',      icon: '🔐', key: 'users'       },
  { to: '/dashboard/elections',   label: 'Elections',    icon: '🗳️', key: 'elections'   },
  { to: '/dashboard/vote',        label: 'Vote',         icon: '✅', key: 'vote'        },
  { to: '/dashboard/letters',     label: 'Letters',      icon: '📨', key: 'letters'     },
  { to: '/dashboard/messages',    label: 'Messages',     icon: '💬', key: 'messages'    },
  { to: '/dashboard/profile',     label: 'My Profile',   icon: '👤', key: 'profile'     },
]

export default function DashboardLayout() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const role = profile?.role || 'admin'
  const navItems = allNavItems.filter(n => (NAV_ACCESS[n.key] || []).includes(role))

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
          <div className="ds-avatar">
            {profile?.image
              ? <img src={profile.image} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : (profile?.name || user?.email || 'U')[0].toUpperCase()
            }
          </div>
          <div>
            <p className="ds-name">{profile?.name || user?.email}</p>
            <p className="ds-role">{ROLE_LABELS[role] || role}</p>
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
            <span className="dash-role-badge">{ROLE_LABELS[role] || role}</span>
          </div>
        </header>

        <div className="dash-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
