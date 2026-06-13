import { initializeApp } from 'firebase/app'
import { getAuth, browserSessionPersistence, setPersistence } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyD6BvM4649Hh1IYzQbSl9QAfSjFq0bERe4",
  authDomain: "husu-f7abc.firebaseapp.com",
  databaseURL: "https://husu-f7abc-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "husu-f7abc",
  storageBucket: "husu-f7abc.firebasestorage.app",
  messagingSenderId: "866269361119",
  appId: "1:866269361119:web:41f56a41d4495a41290a6a",
  measurementId: "G-MD4RDRJFC9"
}

const app = initializeApp(firebaseConfig)

// Secondary app used by admins to create new user accounts
// without signing out the currently logged-in admin
const secondaryApp = initializeApp(firebaseConfig, 'secondary')

export const auth          = getAuth(app)
export const secondaryAuth = getAuth(secondaryApp)
export const db            = getFirestore(app)
export const storage       = getStorage(app)

// Use SESSION storage instead of LOCAL storage so each browser tab
// has its own independent auth session. This means:
//   - User A on Tab 1 and User B on Tab 2 don't interfere with each other
//   - Closing a tab signs that user out (no persistent session across restarts)
setPersistence(auth, browserSessionPersistence).catch(console.error)

export default app
