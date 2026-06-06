/**
 * Public data hooks — reads from Firestore, falls back to static data.js
 * so the site works even before Firestore is seeded.
 */
import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import {
  news as staticNews,
  events as staticEvents,
  affairs as staticAffairs,
  management as staticManagement,
  contact as staticContact,
} from '../data/data'

function useFirestoreOrStatic(collectionName, staticData, orderField = 'date') {
  const [data, setData]       = useState(staticData)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const q = query(collection(db, collectionName), orderBy(orderField, 'desc'))
      const unsub = onSnapshot(q, snap => {
        if (snap.empty) {
          setData(staticData)
        } else {
          setData(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        }
        setLoading(false)
      }, () => {
        setData(staticData)
        setLoading(false)
      })
      return unsub
    } catch {
      setData(staticData)
      setLoading(false)
    }
  }, [collectionName, orderField])

  return { data, loading }
}

export function useNews()    { return useFirestoreOrStatic('news',    staticNews,    'date') }
export function useEvents()  { return useFirestoreOrStatic('events',  staticEvents,  'date') }
export function useAffairs() { return useFirestoreOrStatic('affairs', staticAffairs, 'createdAt') }
export function useTeam()    { return useFirestoreOrStatic('team',    staticManagement, 'createdAt') }

export function useContact() {
  const [data, setData] = useState(staticContact)
  useEffect(() => {
    getDoc(doc(db, 'settings', 'contact')).then(snap => {
      if (snap.exists()) setData(snap.data())
    }).catch(() => {})
  }, [])
  return data
}
