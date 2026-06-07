/**
 * Public data hooks — reads from Firestore, falls back to static data.js
 */
import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore'
import { db } from '../firebase'
import {
  news       as staticNews,
  events     as staticEvents,
  affairs    as staticAffairs,
  management as staticManagement,
  contact    as staticContact,
} from '../data/data'

/* ── Generic collection hook with fallback ── */
function useFirestoreOrStatic(collectionName, staticData, orderField = 'date') {
  const [data, setData]       = useState(staticData)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const q = query(collection(db, collectionName), orderBy(orderField, 'desc'))
      const unsub = onSnapshot(q,
        snap => {
          setData(snap.empty ? staticData : snap.docs.map(d => ({ id: d.id, ...d.data() })))
          setLoading(false)
        },
        () => { setData(staticData); setLoading(false) }
      )
      return unsub
    } catch {
      setData(staticData)
      setLoading(false)
    }
  }, [collectionName, orderField])

  return { data, loading }
}

export function useNews()    { return useFirestoreOrStatic('news',    staticNews,       'date') }
export function useEvents()  { return useFirestoreOrStatic('events',  staticEvents,     'date') }
export function useAffairs() { return useFirestoreOrStatic('affairs', staticAffairs, 'createdAt') }
export function useTeam()    { return useFirestoreOrStatic('team',    staticManagement, 'createdAt') }

/* ── Contact info ── */
export function useContact() {
  const [data, setData] = useState(staticContact)
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'contact'), snap => {
      if (snap.exists()) setData(snap.data())
    }, () => {})
    return unsub
  }, [])
  return data
}

/* ── Site-wide settings (hero, stats, about, banner, footer) ── */
const defaultSite = {
  hero: {
    eyebrow: "Official Students' Representative Body",
    heading1: 'Haramaya University',
    heading2: "Students' Union",
    description: 'Empowering students, championing academic excellence, and building a united campus community at Haramaya University.',
    btn1Text: 'About the Union',
    btn1Link: '/about',
    btn2Text: 'Get in Touch',
    btn2Link: '/contact',
  },
  stats: [
    { value: '3',     label: 'Main Affairs',       icon: '🏛️' },
    { value: '5',     label: 'Leadership Members',  icon: '👥' },
    { value: '1,000', label: 'Students Served',     icon: '🎓' },
    { value: '2024',  label: 'Established',         icon: '📅' },
  ],
  about: {
    subtitle: 'Who we are',
    title: 'Your Voice on Campus',
    body1: "The Haramaya University Students' Union is the official representative body of all students. We advocate for your rights, improve campus life, and bridge the gap between students and university administration.",
    body2: "Through our three main affairs — Academic, Discipline, and Service — we ensure every student's needs are heard and addressed.",
    btnText: 'Learn More About Us',
    btnLink: '/about',
  },
  footer: {
    tagline: "The official representative body of all students at Haramaya University — advocating for rights, welfare, and academic excellence since 2024.",
    copyright: "Haramaya University Students' Union. All rights reserved.",
    pobox: "P.O.Box: 138 Dire Dawa, Ethiopia",
  },
}

export function useSiteSettings() {
  const [site, setSite] = useState(defaultSite)
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'site'), snap => {
      if (snap.exists()) {
        const d = snap.data()
        setSite(prev => ({ ...prev, ...d }))
      }
    }, () => {})
    return unsub
  }, [])
  return site
}
