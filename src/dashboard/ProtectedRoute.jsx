import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Spinner = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0f1e' }}>
    <div style={{ width: 36, height: 36, border: '3px solid rgba(232,160,32,0.2)', borderTopColor: '#e8a020', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
)

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading } = useAuth()

  // 1. Auth state not resolved yet
  if (loading) return <Spinner />

  // 2. Not authenticated
  if (!user) return <Navigate to="/login" replace />

  // 3. Authenticated but Firestore profile not loaded yet
  if (!profile) return <Spinner />

  // 4. Account pending approval
  if (profile.status === 'pending') return <Navigate to="/login" replace />

  // 5. Role-based access — member only gets profile & vote
  if (profile.role === 'member' && allowedRoles && !allowedRoles.includes('member')) {
    return <Navigate to="/dashboard/vote" replace />
  }

  // 6. Specific role requirement not met
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
