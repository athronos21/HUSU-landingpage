import { useState, useEffect } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'
import { db, auth } from '../firebase'
import { useAuth } from '../context/AuthContext'
import PhotoUpload from './PhotoUpload'
import './Dashboard.css'
import './MyProfile.css'

export default function MyProfile() {
  const { user, profile } = useAuth()
  const [form, setForm] = useState({
    name:     '', bio:      '', phone:    '', telegram: '',
    image:    null,
  })
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
  const [saving,   setSaving]   = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [pwSaved,  setPwSaved]  = useState(false)
  const [error,    setError]    = useState('')
  const [pwError,  setPwError]  = useState('')

  useEffect(() => {
    if (profile) {
      setForm({
        name:     profile.name     || '',
        bio:      profile.bio      || '',
        phone:    profile.phone    || '',
        telegram: profile.telegram || '',
        image:    profile.image    || null,
      })
    }
  }, [profile])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async e => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name:     form.name,
        bio:      form.bio,
        phone:    form.phone,
        telegram: form.telegram,
        image:    form.image || null,
      })

      // If they're an affair head, also update the affair's embedded head snapshot
      if ((profile?.role === 'affair_head' || profile?.role === 'assoc_head') && profile?.affairId) {
        const field = profile.role === 'affair_head' ? 'head' : 'associativeHead'
        await updateDoc(doc(db, 'affairs', profile.affairId), {
          [`${field}.name`]:     form.name,
          [`${field}.phone`]:    form.phone,
          [`${field}.telegram`]: form.telegram,
          [`${field}.image`]:    form.image || null,
          [`${field}.email`]:    user.email || '',
        })
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.message || 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async e => {
    e.preventDefault()
    setPwError('')
    if (pwForm.newPw.length < 8) { setPwError('New password must be at least 8 characters.'); return }
    if (pwForm.newPw !== pwForm.confirm) { setPwError('Passwords do not match.'); return }
    setPwSaving(true)
    try {
      const cred = EmailAuthProvider.credential(user.email, pwForm.current)
      await reauthenticateWithCredential(user, cred)
      await updatePassword(user, pwForm.newPw)
      setPwSaved(true)
      setPwForm({ current: '', newPw: '', confirm: '' })
      setTimeout(() => setPwSaved(false), 3000)
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setPwError('Current password is incorrect.')
      } else {
        setPwError(err.message || 'Failed to update password.')
      }
    } finally {
      setPwSaving(false)
    }
  }

  const initials = (name) => (name || '').split(' ').map(n => n[0]).join('').toUpperCase() || '?'

  return (
    <div className="dash-page mp-page">

      {/* ── Hero banner ── */}
      <div className="mp-hero">
        <div className="mp-hero-bg" />
        <div className="mp-hero-content">
          <div className="mp-avatar-wrap">
            <div className="mp-avatar">
              {form.image
                ? <img src={form.image} alt={form.name} />
                : <span>{initials(form.name)}</span>
              }
            </div>
          </div>
          <div className="mp-hero-info">
            <h1>{form.name || profile?.name || 'Your Profile'}</h1>
            <p className="mp-role-badge">{
              profile?.role === 'affair_head' ? `Head · ${profile?.affairName || ''}` :
              profile?.role === 'assoc_head'  ? `Associative Head · ${profile?.affairName || ''}` :
              profile?.role === 'admin' ? 'Administrator' :
              profile?.role || ''
            }</p>
            <p className="mp-email">✉ {user?.email}</p>
          </div>
        </div>
      </div>

      <div className="mp-body">

        {/* ── Profile form ── */}
        <div className="mp-section">
          <div className="mp-section-header">
            <h2>Personal Information</h2>
            <p>This information is shown on the public website</p>
          </div>

          {error  && <div className="db-error" style={{ marginBottom: 16 }}>{error}</div>}
          {saved  && <div className="db-success">✓ Profile updated successfully</div>}

          <form onSubmit={handleSave} className="mp-form">
            {/* Photo */}
            <div className="mp-photo-row">
              <PhotoUpload
                value={form.image}
                onChange={url => set('image', url)}
                folder="profiles"
                label="Profile Photo"
                size="lg"
                shape="circle"
                initials={initials(form.name)}
              />
            </div>

            <div className="db-form-row">
              <div className="db-field">
                <label>Full Name</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your full name" />
              </div>
              <div className="db-field">
                <label>Phone Number</label>
                <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+251..." />
              </div>
            </div>

            <div className="db-field">
              <label>Telegram Username</label>
              <input value={form.telegram} onChange={e => set('telegram', e.target.value)} placeholder="@username" />
            </div>

            <div className="db-field">
              <label>Bio</label>
              <textarea
                value={form.bio}
                onChange={e => set('bio', e.target.value)}
                placeholder="A brief introduction about yourself and your role…"
                style={{ minHeight: 100 }}
              />
            </div>

            <div className="mp-form-actions">
              <button type="submit" className="db-btn db-btn-primary" disabled={saving}>
                {saving ? 'Saving…' : '💾 Save Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* ── Password change ── */}
        <div className="mp-section">
          <div className="mp-section-header">
            <h2>Change Password</h2>
            <p>Keep your account secure</p>
          </div>

          {pwError && <div className="db-error" style={{ marginBottom: 16 }}>{pwError}</div>}
          {pwSaved && <div className="db-success">✓ Password changed successfully</div>}

          <form onSubmit={handlePasswordChange} className="mp-form">
            <div className="db-field">
              <label>Current Password</label>
              <input type="password" value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} placeholder="Enter current password" />
            </div>
            <div className="db-form-row">
              <div className="db-field">
                <label>New Password</label>
                <input type="password" value={pwForm.newPw} onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))} placeholder="At least 8 characters" />
              </div>
              <div className="db-field">
                <label>Confirm New Password</label>
                <input type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} placeholder="Repeat new password" />
              </div>
            </div>
            <div className="mp-form-actions">
              <button type="submit" className="db-btn db-btn-ghost" disabled={pwSaving}>
                {pwSaving ? 'Updating…' : '🔒 Update Password'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  )
}
