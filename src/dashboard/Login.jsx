import { useState } from 'react'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { useNavigate } from 'react-router-dom'
import { useSignupOpen } from '../hooks/usePublicData'
import './Login.css'

export default function Login() {
  const signupOpen           = useSignupOpen()
  const navigate             = useNavigate()

  const [tab,        setTab]        = useState('login')
  const [name,       setName]       = useState('')
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [confirm,    setConfirm]    = useState('')
  const [error,      setError]      = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [pending,    setPending]    = useState(false)

  const switchTab = (t) => {
    setTab(t); setError('')
    setName(''); setEmail(''); setPassword(''); setConfirm('')
  }

  // ── Sign In ──────────────────────────────────────────────────────────────
  const handleLogin = async e => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)

      // Read the Firestore profile directly — simple and reliable
      const snap = await getDoc(doc(db, 'users', cred.user.uid))

      if (!snap.exists()) {
        setError('Account not found. Please contact the administrator.')
        await auth.signOut()
        setSubmitting(false)
        return
      }

      const profile = snap.data()

      if (profile.status === 'pending') {
        setError('Your account is pending admin approval. Please wait.')
        await auth.signOut()
        setSubmitting(false)
        return
      }

      // Active — navigate (AuthContext will pick up the session)
      const mustChange = profile.mustChangePassword === true || profile.mustChangePassword === 'true'
      navigate(mustChange ? '/change-password' : '/dashboard', { replace: true })

    } catch (err) {
      const code = err.code || ''
      if (code.includes('user-not-found') || code.includes('wrong-password') ||
          code.includes('invalid-credential') || code.includes('invalid-email')) {
        setError('Invalid email or password.')
      } else {
        setError('Sign in failed. Please try again.')
      }
      setSubmitting(false)
    }
  }

  // ── Request Access (signup) ──────────────────────────────────────────────
  const handleSignup = async e => {
    e.preventDefault()
    setError('')
    if (!name.trim())         { setError('Full name is required.'); return }
    if (password.length < 8)  { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm)  { setError('Passwords do not match.'); return }

    setSubmitting(true)
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)

      await setDoc(doc(db, 'users', cred.user.uid), {
        name:       name.trim(),
        email:      email.trim().toLowerCase(),
        role:       '',
        affairId:   '',
        affairName: '',
        status:     'pending',
        createdAt:  new Date().toISOString(),
      })

      setPending(true)
      setSubmitting(false)
      await auth.signOut()

    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Use the Sign In tab.')
      } else if (err.code === 'auth/weak-password') {
        setError('Password must be at least 6 characters.')
      } else {
        setError(err.message || 'Signup failed. Please try again.')
      }
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg" />
      <div className="login-card">

        <div className="login-header">
          <div className="login-logos">
            <img src="/university-logo.png" alt="HU"    onError={e => { e.target.style.display = 'none' }} />
            <img src="/union-logo.png"       alt="Union" onError={e => { e.target.style.display = 'none' }} />
          </div>
          <h1>HUSU Dashboard</h1>
          <p>Sign in to manage the union website</p>
        </div>

        {/* Tabs */}
        {signupOpen && !pending && (
          <div className="login-tabs">
            <button className={`login-tab${tab === 'login'  ? ' active' : ''}`} onClick={() => switchTab('login')}  type="button">Sign In</button>
            <button className={`login-tab${tab === 'signup' ? ' active' : ''}`} onClick={() => switchTab('signup')} type="button">Request Access</button>
          </div>
        )}

        {/* ── Pending success screen ── */}
        {pending ? (
          <div className="login-pending">
            <div className="login-pending-icon">⏳</div>
            <h3>Request Submitted</h3>
            <p>Your account has been sent to the administrator for review. You'll be able to sign in once it's approved.</p>
            <button className="login-btn" style={{ marginTop: 20 }} onClick={() => { setPending(false); setTab('login') }}>
              Back to Sign In
            </button>
          </div>
        ) : (
          <>
            {error && <div className="login-error">{error}</div>}

            {/* ── Sign In form ── */}
            {tab === 'login' && (
              <form onSubmit={handleLogin} className="login-form">
                <div className="lf-field">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email" type="email" value={email} required
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@haramaya.edu.et"
                    autoComplete="email"
                    disabled={submitting}
                  />
                </div>
                <div className="lf-field">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password" type="password" value={password} required
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={submitting}
                  />
                </div>
                <button type="submit" className="login-btn" disabled={submitting}>
                  {submitting ? 'Signing in…' : 'Sign In'}
                </button>
              </form>
            )}

            {/* ── Request Access form ── */}
            {tab === 'signup' && signupOpen && (
              <form onSubmit={handleSignup} className="login-form">
                <div className="lf-field">
                  <label htmlFor="sname">Full Name</label>
                  <input
                    id="sname" type="text" value={name} required
                    onChange={e => setName(e.target.value)}
                    placeholder="Your full name"
                    autoComplete="name"
                    disabled={submitting}
                  />
                </div>
                <div className="lf-field">
                  <label htmlFor="semail">Email</label>
                  <input
                    id="semail" type="email" value={email} required
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@haramaya.edu.et"
                    autoComplete="email"
                    disabled={submitting}
                  />
                </div>
                <div className="lf-field">
                  <label htmlFor="spassword">Password</label>
                  <input
                    id="spassword" type="password" value={password} required
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    disabled={submitting}
                  />
                </div>
                <div className="lf-field">
                  <label htmlFor="sconfirm">Confirm Password</label>
                  <input
                    id="sconfirm" type="password" value={confirm} required
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Repeat password"
                    autoComplete="new-password"
                    disabled={submitting}
                  />
                </div>
                <button type="submit" className="login-btn" disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Request Access'}
                </button>
                <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 4 }}>
                  Your request will be reviewed by an administrator.
                </p>
              </form>
            )}
          </>
        )}

        <p className="login-back"><a href="/">← Back to website</a></p>
      </div>
    </div>
  )
}
