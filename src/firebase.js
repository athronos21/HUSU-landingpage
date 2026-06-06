import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyD9XENCqbyTQnQDUWVuJLEdzimeMAnInWI",
  authDomain: "husu-59eaa.firebaseapp.com",
  projectId: "husu-59eaa",
  storageBucket: "husu-59eaa.firebasestorage.app",
  messagingSenderId: "1008907141032",
  appId: "1:1008907141032:web:cd463a06eea7c33eefa79d",
  measurementId: "G-RYC7MJR7J"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db   = getFirestore(app)
export default app
