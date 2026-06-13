import { useAuth } from '../context/AuthContext'
import { useCollection } from '../hooks/useFirestore'
import { Link } from 'react-router-dom'
import { ROLE_LABELS, NAV_ACCESS } from './roles'
import './Dashboard.css'

export default function Overview() {
  const { profile, user } = useAuth()
  const { docs: news }    = useCollection('news', 'date')
  const { docs: events }  = useCollection('events', 'date')
  const { docs: affairs } = useCollection('affairs', 'createdAt')
  const { docs: team }    = useCollection('team', 'createdAt')
  const role = profile?.role || ''

  // Only show cards for pages the current role can access
  const allCards = [
    { label: 'News Articles', count: news.length,   icon: '📰', to: '/dashboard/news',    color: '#4a7fd4', key: 'news'    },
    { label: 'Events',        count: events.length,  icon: '📅', to: '/dashboard/events',  color: '#10b981', key: 'events'  },
    { label: 'Affairs',       count: affairs.length, icon: '🏛️', to: '/dashboard/affairs', color: '#e8a020', key: 'affairs' },
    { label: 'Team Members',  count: team.length,    icon: '👥', to: '/dashboard/team',    color: '#a78bfa', key: 'team'    },
  ]
  const cards = allCards.filter(c => (NAV_ACCESS[c.key] || []).includes(role))

  return (
    <div className="dash-page">
      <div className="dash-page-header">
        <div>
          <h1>Welcome back, {profile?.name || user?.email?.split('@')[0]} 👋</h1>
          <p>{ROLE_LABELS[role] || role || 'Member'} · Haramaya University Students' Union</p>
        </div>
      </div>

      <div className="overview-cards">
        {cards.map(c => (
          <Link to={c.to} key={c.label} className="ov-card" style={{ '--oc': c.color }}>
            <div className="ov-card-icon">{c.icon}</div>
            <div className="ov-card-body">
              <span className="ov-count">{c.count}</span>
              <span className="ov-label">{c.label}</span>
            </div>
            <div className="ov-card-bar" />
          </Link>
        ))}
      </div>

      <div className="overview-sections">
        {(NAV_ACCESS['news'] || []).includes(role) && (
          <div className="ov-section">
            <h3>Recent News</h3>
            {news.slice(0, 5).map(n => (
              <div key={n.id} className="ov-list-item">
                <span className="ov-item-title">{n.title}</span>
                <span className="ov-item-cat" style={{ color: '#4a7fd4' }}>{n.category}</span>
              </div>
            ))}
            {news.length === 0 && <p className="ov-empty">No news yet.</p>}
            <Link to="/dashboard/news" className="ov-more">Manage all news →</Link>
          </div>
        )}

        {(NAV_ACCESS['events'] || []).includes(role) && (
          <div className="ov-section">
            <h3>Upcoming Events</h3>
            {events.slice(0, 5).map(e => (
              <div key={e.id} className="ov-list-item">
                <span className="ov-item-title">{e.title}</span>
                <span className="ov-item-cat" style={{ color: '#10b981' }}>{e.category}</span>
              </div>
            ))}
            {events.length === 0 && <p className="ov-empty">No events yet.</p>}
            <Link to="/dashboard/events" className="ov-more">Manage all events →</Link>
          </div>
        )}
      </div>
    </div>
  )
}
