import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)  // true until BOTH auth + profile resolved
  const signingOut = useRef(false)

  useEffect(() => {
    let profileUnsub = null

    const authUnsub = onAuthStateChanged(auth, (firebaseUser) => {
      // Tear down previous Firestore listener
      if (profileUnsub) { profileUnsub(); profileUnsub = null }

      if (!firebaseUser) {
        // Signed out — clear everything and stop loading
        setUser(null)
        setProfile(null)
        setLoading(false)
        signingOut.current = false
        return
      }

      // Auth session exists — start listening to the Firestore profile.
      // Keep loading=true until the first snapshot resolves.
      setUser(firebaseUser)
      const ref = doc(db, 'users', firebaseUser.uid)

      profileUnsub = onSnapshot(ref, async (snap) => {
        if (!snap.exists()) {
          // Doc not written yet (signup race) — keep loading until it appears
          return
        }

        const data = snap.data()

        if (data.status === 'pending') {
          // Block pending users — sign out once, but only if NOT on the login page.
          // The login/signup page manages its own signout to avoid racing with
          // the "Request Submitted" success screen.
          setProfile(null)
          setLoading(false)
          if (!signingOut.current && !window.location.pathname.includes('/login')) {
            signingOut.current = true
            auth.signOut()
          }
          return
        }

        // Valid active user — set profile and stop loading
        setProfile(data)
        setLoading(false)

      }, () => {
        // Snapshot error
        setProfile(null)
        setLoading(false)
      })
    })

    return () => {
      authUnsub()
      if (profileUnsub) profileUnsub()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
