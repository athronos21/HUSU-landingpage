import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

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

export const auth = getAuth(app)
export const db   = getFirestore(app)
export default app
