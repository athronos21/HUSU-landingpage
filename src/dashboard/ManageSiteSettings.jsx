import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import IconPicker, { renderIcon } from './IconPicker'
import './Dashboard.css'
import './SiteSettings.css'

const TABS = [
  { id: 'hero',      label: '🏠 Hero',          icon: '🏠' },
  { id: 'stats',     label: '📊 Stats',          icon: '📊' },
  { id: 'about',     label: '👥 About',          icon: '👥' },
  { id: 'values',    label: '✨ Values',          icon: '✨' },
  { id: 'aboutPage', label: '📄 About Page',     icon: '📄' },
  { id: 'mvItems',   label: '🎯 Mission/Vision', icon: '🎯' },
  { id: 'banner',    label: '📢 Banner',         icon: '📢' },
  { id: 'access',    label: '🔐 Access',         icon: '🔐' },
  { id: 'footer',    label: '🔻 Footer',         icon: '🔻' },
]

const defaults = {
  hero: {
    eyebrow: "Official Students' Representative Body",
    heading1: 'Haramaya University',
    heading2: "Students' Union",
    description: 'Empowering students, championing academic excellence, and building a united campus community at Haramaya University.',
    btn1Text: 'About the Union', btn1Link: '/about',
    btn2Text: 'Get in Touch',    btn2Link: '/contact',
  },
  stats: [
    { value: '3',     label: 'Main Affairs',      icon: { type: 'emoji', value: '🏛️' } },
    { value: '5',     label: 'Leadership Members', icon: { type: 'emoji', value: '👥' } },
    { value: '1,000', label: 'Students Served',   icon: { type: 'emoji', value: '🎓' } },
    { value: '2024',  label: 'Established',       icon: { type: 'emoji', value: '📅' } },
  ],
  about: {
    subtitle: 'Who we are', title: 'Your Voice on Campus',
    body1: "The Haramaya University Students' Union is the official representative body of all students. We advocate for your rights, improve campus life, and bridge the gap between students and university administration.",
    body2: "Through our three main affairs — Academic, Discipline, and Service — we ensure every student's needs are heard and addressed.",
    btnText: 'Learn More About Us', btnLink: '/about',
  },
  values: [
    { icon: { type: 'emoji', value: '🎯' }, title: 'Mission-Driven', desc: 'Every action guided by student welfare and academic excellence.' },
    { icon: { type: 'emoji', value: '🤝' }, title: 'Inclusive',      desc: 'Representing every student regardless of background.' },
    { icon: { type: 'emoji', value: '⚡' }, title: 'Empowering',     desc: 'Giving students the tools and voice to succeed.' },
    { icon: { type: 'emoji', value: '🏆' }, title: 'Excellence',     desc: 'Upholding the highest standards in all we do.' },
  ],
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
  mvItems: [
    { icon: { type: 'emoji', value: '🎯' }, label: 'Mission', title: 'Our Mission', color: '#1a3a6b', text: "To represent, advocate, and serve the interests of all Haramaya University students by fostering academic excellence, promoting student welfare, and building a united and inclusive campus community." },
    { icon: { type: 'emoji', value: '🌟' }, label: 'Vision',  title: 'Our Vision',  color: '#e8a020', text: "To be a leading students' union in Ethiopia that empowers students to reach their full potential, contributes to national development, and upholds the values of integrity, unity, and excellence." },
    { icon: { type: 'emoji', value: '💎' }, label: 'Values',  title: 'Our Values',  color: '#059669', text: "Integrity, transparency, inclusivity, academic excellence, student empowerment, and community service are the core values that guide everything we do." },
  ],
  banner: {
    enabled: true,
    text: 'Cultural Diversity Festival is coming May 10',
    linkText: 'View all upcoming events →',
    linkHref: '/events',
  },
  footer: {
    tagline: "The official representative body of all students at Haramaya University — advocating for rights, welfare, and academic excellence since 2024.",
    copyright: "Haramaya University Students' Union. All rights reserved.",
    pobox: "P.O.Box: 138 Dire Dawa, Ethiopia",
  },
}

export default function ManageSiteSettings() {
  const [activeTab, setActiveTab] = useState('hero')
  const [data, setData]       = useState(defaults)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDoc(doc(db, 'settings', 'site')).then(snap => {
      if (snap.exists()) {
        setData(prev => ({ ...prev, ...snap.data() }))
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true); setSaved(false)
    try {
      await setDoc(doc(db, 'settings', 'site'), data)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      alert('Failed to save: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const set = (section, field, value) => {
    setData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }))
  }

  const setStat = (i, field, value) => {
    setData(prev => {
      const stats = [...prev.stats]
      stats[i] = { ...stats[i], [field]: value }
      return { ...prev, stats }
    })
  }

  const setValueCard = (i, field, value) => {
    setData(prev => {
      const values = [...(prev.values || [])]
      values[i] = { ...values[i], [field]: value }
      return { ...prev, values }
    })
  }

  const setAboutStat = (i, field, value) => {
    setData(prev => {
      const heroStats = [...(prev.aboutPage?.heroStats || [])]
      heroStats[i] = { ...heroStats[i], [field]: value }
      return { ...prev, aboutPage: { ...prev.aboutPage, heroStats } }
    })
  }

  const setMvItem = (i, field, value) => {
    setData(prev => {
      const mvItems = [...(prev.mvItems || [])]
      mvItems[i] = { ...mvItems[i], [field]: value }
      return { ...prev, mvItems }
    })
  }

  if (loading) return <div className="dash-page"><p style={{ color: 'rgba(255,255,255,0.35)' }}>Loading…</p></div>

  return (
    <div className="dash-page">
      <div className="dash-page-header">
        <div>
          <h1>🌐 Site Settings</h1>
          <p>Edit every section of the public website</p>
        </div>
        <button className="db-btn db-btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : '💾 Save All Changes'}
        </button>
      </div>

      {saved && (
        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 8, color: '#86efac', padding: '10px 16px', marginBottom: 20, fontSize: '0.88rem' }}>
          ✓ Site settings saved. Changes are now live on the website.
        </div>
      )}

      {/* Tab navigation */}
      <div className="ss-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`ss-tab${activeTab === t.id ? ' active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="ss-panel">

        {/* ── HERO ── */}
        {activeTab === 'hero' && (
          <div className="db-form">
            <h3 className="ss-section-title">Hero Section</h3>
            <div className="db-field">
              <label>Eyebrow text (small text above heading)</label>
              <input value={data.hero.eyebrow} onChange={e => set('hero', 'eyebrow', e.target.value)} />
            </div>
            <div className="db-form-row">
              <div className="db-field">
                <label>Heading line 1</label>
                <input value={data.hero.heading1} onChange={e => set('hero', 'heading1', e.target.value)} />
              </div>
              <div className="db-field">
                <label>Heading line 2 (highlighted)</label>
                <input value={data.hero.heading2} onChange={e => set('hero', 'heading2', e.target.value)} />
              </div>
            </div>
            <div className="db-field">
              <label>Description paragraph</label>
              <textarea value={data.hero.description} onChange={e => set('hero', 'description', e.target.value)} />
            </div>
            <div className="db-form-row">
              <div className="db-field">
                <label>Primary button text</label>
                <input value={data.hero.btn1Text} onChange={e => set('hero', 'btn1Text', e.target.value)} />
              </div>
              <div className="db-field">
                <label>Primary button link</label>
                <input value={data.hero.btn1Link} onChange={e => set('hero', 'btn1Link', e.target.value)} placeholder="/about" />
              </div>
            </div>
            <div className="db-form-row">
              <div className="db-field">
                <label>Secondary button text</label>
                <input value={data.hero.btn2Text} onChange={e => set('hero', 'btn2Text', e.target.value)} />
              </div>
              <div className="db-field">
                <label>Secondary button link</label>
                <input value={data.hero.btn2Link} onChange={e => set('hero', 'btn2Link', e.target.value)} placeholder="/contact" />
              </div>
            </div>
          </div>
        )}

        {/* ── STATS ── */}
        {activeTab === 'stats' && (
          <div className="db-form">
            <h3 className="ss-section-title">Stats Band (below hero)</h3>
            {data.stats.map((s, i) => (
              <div key={i} className="ss-stat-row">
                <span className="ss-stat-num">#{i + 1}</span>
                <div className="db-field" style={{ flex: 0.8 }}>
                  <IconPicker
                    value={s.icon}
                    onChange={v => setStat(i, 'icon', v)}
                    label="Icon"
                  />
                </div>
                <div className="db-field" style={{ flex: 1 }}>
                  <label>Value</label>
                  <input value={s.value} onChange={e => setStat(i, 'value', e.target.value)} placeholder="e.g. 1,000+" />
                </div>
                <div className="db-field" style={{ flex: 2 }}>
                  <label>Label</label>
                  <input value={s.label} onChange={e => setStat(i, 'label', e.target.value)} placeholder="e.g. Students Served" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── ABOUT ── */}
        {activeTab === 'about' && (
          <div className="db-form">
            <h3 className="ss-section-title">About / "Your Voice" Section</h3>
            <div className="db-form-row">
              <div className="db-field">
                <label>Subtitle (small caps)</label>
                <input value={data.about.subtitle} onChange={e => set('about', 'subtitle', e.target.value)} />
              </div>
              <div className="db-field">
                <label>Title</label>
                <input value={data.about.title} onChange={e => set('about', 'title', e.target.value)} />
              </div>
            </div>
            <div className="db-field">
              <label>Paragraph 1</label>
              <textarea value={data.about.body1} onChange={e => set('about', 'body1', e.target.value)} />
            </div>
            <div className="db-field">
              <label>Paragraph 2</label>
              <textarea value={data.about.body2} onChange={e => set('about', 'body2', e.target.value)} />
            </div>
            <div className="db-form-row">
              <div className="db-field">
                <label>Button text</label>
                <input value={data.about.btnText} onChange={e => set('about', 'btnText', e.target.value)} />
              </div>
              <div className="db-field">
                <label>Button link</label>
                <input value={data.about.btnLink} onChange={e => set('about', 'btnLink', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* ── VALUES (Home page cards) ── */}
        {activeTab === 'values' && (
          <div className="db-form">
            <h3 className="ss-section-title">Home Page — Value Cards</h3>
            {(data.values || []).map((v, i) => (
              <div key={i} className="ss-stat-row" style={{ alignItems: 'flex-start' }}>
                <span className="ss-stat-num">#{i + 1}</span>
                <div className="db-field" style={{ flex: 0.8 }}>
                  <IconPicker
                    value={v.icon}
                    onChange={val => setValueCard(i, 'icon', val)}
                    label="Icon"
                  />
                </div>
                <div className="db-field" style={{ flex: 1 }}>
                  <label>Title</label>
                  <input value={v.title} onChange={e => setValueCard(i, 'title', e.target.value)} />
                </div>
                <div className="db-field" style={{ flex: 2 }}>
                  <label>Description</label>
                  <input value={v.desc} onChange={e => setValueCard(i, 'desc', e.target.value)} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── ABOUT PAGE ── */}
        {activeTab === 'aboutPage' && (
          <div className="db-form">
            <h3 className="ss-section-title">About Page — Hero Section</h3>
            <div className="db-form-row">
              <div className="db-field">
                <label>Small subtitle</label>
                <input value={data.aboutPage?.heroSub || ''} onChange={e => set('aboutPage', 'heroSub', e.target.value)} />
              </div>
              <div className="db-field">
                <label>Main title</label>
                <input value={data.aboutPage?.heroTitle || ''} onChange={e => set('aboutPage', 'heroTitle', e.target.value)} />
              </div>
            </div>
            <div className="db-field">
              <label>Description paragraph</label>
              <textarea value={data.aboutPage?.heroDesc || ''} onChange={e => set('aboutPage', 'heroDesc', e.target.value)} />
            </div>
            <h3 className="ss-section-title" style={{ marginTop: 24 }}>About Page — Hero Stats (4 boxes)</h3>
            {(data.aboutPage?.heroStats || []).map((s, i) => (
              <div key={i} className="ss-stat-row">
                <span className="ss-stat-num">#{i + 1}</span>
                <div className="db-field" style={{ flex: 1 }}>
                  <label>Value</label>
                  <input value={s.value} onChange={e => setAboutStat(i, 'value', e.target.value)} placeholder="e.g. 2024" />
                </div>
                <div className="db-field" style={{ flex: 2 }}>
                  <label>Label</label>
                  <input value={s.label} onChange={e => setAboutStat(i, 'label', e.target.value)} placeholder="e.g. Established" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── MISSION / VISION / VALUES ── */}
        {activeTab === 'mvItems' && (
          <div className="db-form">
            <h3 className="ss-section-title">About Page — Mission, Vision & Values Cards</h3>
            {(data.mvItems || []).map((item, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 16, border: '1px solid rgba(255,255,255,0.07)', marginBottom: 16 }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>Card #{i + 1}</p>
                <div className="db-form-row" style={{ alignItems: 'flex-end' }}>
                  <div className="db-field" style={{ flex: 0.7 }}>
                    <IconPicker
                      value={item.icon}
                      onChange={v => setMvItem(i, 'icon', v)}
                      label="Icon"
                    />
                  </div>
                  <div className="db-field" style={{ flex: 0.7 }}>
                    <label>Label (tab)</label>
                    <input value={item.label} onChange={e => setMvItem(i, 'label', e.target.value)} placeholder="Mission" />
                  </div>
                  <div className="db-field" style={{ flex: 1 }}>
                    <label>Title</label>
                    <input value={item.title} onChange={e => setMvItem(i, 'title', e.target.value)} placeholder="Our Mission" />
                  </div>
                  <div className="db-field" style={{ flex: 0.4 }}>
                    <label>Color</label>
                    <input type="color" value={item.color} onChange={e => setMvItem(i, 'color', e.target.value)} style={{ height: 38, padding: 2, cursor: 'pointer', width: '100%' }} />
                  </div>
                </div>
                <div className="db-field">
                  <label>Text</label>
                  <textarea value={item.text} onChange={e => setMvItem(i, 'text', e.target.value)} style={{ minHeight: 80 }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── BANNER ── */}
        {activeTab === 'banner' && (
          <div className="db-form">
            <h3 className="ss-section-title">Announcement Banner (top of page)</h3>
            <div className="db-field">
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={data.banner.enabled}
                  onChange={e => set('banner', 'enabled', e.target.checked)}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                Show announcement banner
              </label>
            </div>
            <div className="db-field">
              <label>Banner message</label>
              <input value={data.banner.text} onChange={e => set('banner', 'text', e.target.value)} placeholder="e.g. New event coming up!" />
            </div>
            <div className="db-form-row">
              <div className="db-field">
                <label>Link text</label>
                <input value={data.banner.linkText} onChange={e => set('banner', 'linkText', e.target.value)} placeholder="View details →" />
              </div>
              <div className="db-field">
                <label>Link destination</label>
                <input value={data.banner.linkHref} onChange={e => set('banner', 'linkHref', e.target.value)} placeholder="/events" />
              </div>
            </div>
          </div>
        )}

        {/* ── ACCESS CONTROL ── */}
        {activeTab === 'access' && (
          <div className="db-form">
            <h3 className="ss-section-title">🔐 Access Control</h3>

            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 20, border: '1px solid rgba(255,255,255,0.07)', marginBottom: 16 }}>
              <h4 style={{ color: '#fff', margin: '0 0 8px', fontSize: '0.95rem' }}>Member Signup</h4>
              <div className="db-field">
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={data.signupOpen || false}
                    onChange={e => setData(prev => ({ ...prev, signupOpen: e.target.checked }))}
                    style={{ width: 18, height: 18 }}
                  />
                  <div>
                    <span style={{ fontWeight: 700, color: data.signupOpen ? '#22c55e' : 'rgba(255,255,255,0.5)', fontSize: '0.95rem' }}>
                      {data.signupOpen ? '🟢 Signup is OPEN' : '🔴 Signup is CLOSED'}
                    </span>
                    <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)' }}>
                      When open, a "Request Access" tab appears on the login page. New accounts require admin approval before getting dashboard access.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 20, border: '1px solid rgba(255,255,255,0.07)' }}>
              <h4 style={{ color: '#fff', margin: '0 0 8px', fontSize: '0.95rem' }}>Pending Requests</h4>
              <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                Review and approve pending signup requests in <strong style={{ color: '#e8a020' }}>Members → ⏳ Pending Approval</strong>.
              </p>
            </div>
          </div>
        )}

        {/* ── FOOTER ── */}
        {activeTab === 'footer' && (
          <div className="db-form">
            <h3 className="ss-section-title">Footer</h3>
            <div className="db-field">
              <label>About tagline</label>
              <textarea value={data.footer.tagline} onChange={e => set('footer', 'tagline', e.target.value)} style={{ minHeight: 70 }} />
            </div>
            <div className="db-field">
              <label>Copyright text (year is added automatically)</label>
              <input value={data.footer.copyright} onChange={e => set('footer', 'copyright', e.target.value)} />
            </div>
            <div className="db-field">
              <label>P.O. Box / address line</label>
              <input value={data.footer.pobox} onChange={e => set('footer', 'pobox', e.target.value)} />
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
