import { useState } from 'react'
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'
import { doc, updateDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import './Login.css'

export default function ChangePassword() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [current,  setCurrent]  = useState('')
  const [newPass,  setNewPass]  = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [success,  setSuccess]  = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')

    if (newPass.length < 8) {
      setError('New password must be at least 8 characters.'); return
    }
    if (newPass !== confirm) {
      setError('Passwords do not match.'); return
    }
    if (newPass === current) {
      setError('New password must be different from the current one.'); return
    }

    setLoading(true)
    try {
      // Re-authenticate with current (temporary) password
      const credential = EmailAuthProvider.credential(user.email, current)
      await reauthenticateWithCredential(user, credential)

      // Set new password
      await updatePassword(user, newPass)

      // Clear the mustChangePassword flag in Firestore
      await updateDoc(doc(db, 'users', user.uid), { mustChangePassword: 'false' })

      setSuccess(true)
      setTimeout(() => navigate('/dashboard'), 1500)
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Current password is incorrect.')
      } else {
        setError(err.message || 'Failed to change password.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg" />
      <div className="login-card">
        <div className="login-header">
          <div className="login-logos">
            <img src="/university-logo.png" alt="HU" onError={e => e.target.style.display='none'} />
            <img src="/union-logo.png" alt="Union" onError={e => e.target.style.display='none'} />
          </div>
          <h1>Change Password</h1>
          <p>
            Welcome, <strong>{profile?.name || user?.email}</strong>.<br />
            You must set a new password before continuing.
          </p>
        </div>

        {error && <div className="login-error">{error}</div>}

        {success ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#86efac' }}>
            ✅ Password changed successfully. Redirecting…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            <div className="lf-field">
              <label htmlFor="current">Current (temporary) password</label>
              <input
                id="current"
                type="password"
                value={current}
                onChange={e => setCurrent(e.target.value)}
                placeholder="Enter the password you received"
                required
                autoComplete="current-password"
              />
            </div>
            <div className="lf-field">
              <label htmlFor="new">New password</label>
              <input
                id="new"
                type="password"
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                placeholder="At least 8 characters"
                required
                autoComplete="new-password"
              />
            </div>
            <div className="lf-field">
              <label htmlFor="confirm">Confirm new password</label>
              <input
                id="confirm"
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat new password"
                required
                autoComplete="new-password"
              />
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Updating…' : 'Set New Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
