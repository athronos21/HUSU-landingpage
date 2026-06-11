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
const TITLE_ORDER = [
  'President',
  'Vice President',
  'General Secretary',
  'General Speaker',
  'General Auditor',
]

function sortTeam(members) {
  return [...members].sort((a, b) => {
    const ai = TITLE_ORDER.indexOf(a.title)
    const bi = TITLE_ORDER.indexOf(b.title)
    // Known titles sort by order, unknown titles go to end
    if (ai === -1 && bi === -1) return 0
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })
}

export function useTeam() {
  const { data, loading } = useFirestoreOrStatic('team', staticManagement, 'createdAt')
  return { data: sortTeam(data), loading }
}

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
    { value: '3',     label: 'Main Affairs',       icon: { type: 'emoji', value: '🏛️' } },
    { value: '5',     label: 'Leadership Members',  icon: { type: 'emoji', value: '👥' } },
    { value: '1,000', label: 'Students Served',     icon: { type: 'emoji', value: '🎓' } },
    { value: '2024',  label: 'Established',         icon: { type: 'emoji', value: '📅' } },
  ],
  about: {
    subtitle: 'Who we are',
    title: 'Your Voice on Campus',
    body1: "The Haramaya University Students' Union is the official representative body of all students. We advocate for your rights, improve campus life, and bridge the gap between students and university administration.",
    body2: "Through our three main affairs — Academic, Discipline, and Service — we ensure every student's needs are heard and addressed.",
    btnText: 'Learn More About Us',
    btnLink: '/about',
  },
  // Home page value cards
  values: [
    { icon: { type: 'emoji', value: '🎯' }, title: 'Mission-Driven', desc: 'Every action guided by student welfare and academic excellence.' },
    { icon: { type: 'emoji', value: '🤝' }, title: 'Inclusive',      desc: 'Representing every student regardless of background.' },
    { icon: { type: 'emoji', value: '⚡' }, title: 'Empowering',     desc: 'Giving students the tools and voice to succeed.' },
    { icon: { type: 'emoji', value: '🏆' }, title: 'Excellence',     desc: 'Upholding the highest standards in all we do.' },
  ],
  // About page
  aboutPage: {
    heroSub:   'Who we are',
    heroTitle: 'About the Union',
    heroDesc:  "The Haramaya University Students' Union is the official representative body of all students — dedicated to academic excellence, student welfare, and community development.",
    heroStats: [
      { value: '2024', label: 'Established' },
      { value: '3',    label: 'Main Affairs' },
      { value: '5',    label: 'Leaders' },
      { value: '1K+',  label: 'Students' },
    ],
  },
  // Mission / Vision / Values cards
  mvItems: [
    { icon: { type: 'emoji', value: '🎯' }, label: 'Mission', title: 'Our Mission', color: '#1a3a6b', text: "To represent, advocate, and serve the interests of all Haramaya University students by fostering academic excellence, promoting student welfare, and building a united and inclusive campus community." },
    { icon: { type: 'emoji', value: '🌟' }, label: 'Vision',  title: 'Our Vision',  color: '#e8a020', text: "To be a leading students' union in Ethiopia that empowers students to reach their full potential, contributes to national development, and upholds the values of integrity, unity, and excellence." },
    { icon: { type: 'emoji', value: '💎' }, label: 'Values',  title: 'Our Values',  color: '#059669', text: "Integrity, transparency, inclusivity, academic excellence, student empowerment, and community service are the core values that guide everything we do." },
  ],
  // Signup control
  signupOpen: false,
  footer: {
    tagline: "The official representative body of all students at Haramaya University — advocating for rights, welfare, and academic excellence since 2024.",
    copyright: "Haramaya University Students' Union. All rights reserved.",
    pobox: "P.O.Box: 138 Dire Dawa, Ethiopia",
  },
}

/* ── Active public election ── */
export function usePublicElection() {
  const [election, setElection] = useState(null)
  const [loading,  setLoading]  = useState(true)
  useEffect(() => {
    // Find the most recent active or published election that is set to public
    const q = query(collection(db, 'elections'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      // Show active or published elections that have showOnWebsite flag
      const pub = all.find(e => e.showOnWebsite && (e.status === 'active' || e.status === 'published'))
      setElection(pub || null)
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [])
  return { election, loading }
}
export function useSignupOpen() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'site'), snap => {
      if (snap.exists()) setOpen(snap.data().signupOpen === true)
    }, () => {})
    return unsub
  }, [])
  return open
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
