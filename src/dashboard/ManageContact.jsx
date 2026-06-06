import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { contact as staticContact } from '../data/data'
import './Dashboard.css'

export default function ManageContact() {
  const [form, setForm]     = useState(staticContact)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState('')

  useEffect(() => {
    getDoc(doc(db, 'settings', 'contact')).then(snap => {
      if (snap.exists()) setForm(snap.data())
    }).catch(() => {})
  }, [])

  const handleSave = async e => {
    e.preventDefault()
    setSaving(true); setError(''); setSaved(false)
    try {
      await setDoc(doc(db, 'settings', 'contact'), form)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Failed to save contact info.')
    } finally {
      setSaving(false)
    }
  }

  const fields = [
    { key: 'phone',    label: 'Phone Number',   placeholder: '+251 255 530 035' },
    { key: 'email',    label: 'Email Address',   placeholder: 'studentsunion@haramaya.edu.et' },
    { key: 'address',  label: 'Address',         placeholder: 'Haramaya University, Haramaya, Ethiopia' },
    { key: 'facebook', label: 'Facebook URL',    placeholder: 'https://facebook.com/…' },
    { key: 'telegram', label: 'Telegram URL',    placeholder: 'https://t.me/…' },
    { key: 'tiktok',   label: 'TikTok URL',      placeholder: 'https://tiktok.com/@…' },
    { key: 'x',        label: 'X (Twitter) URL', placeholder: 'https://x.com/…' },
    { key: 'linkedin', label: 'LinkedIn URL',    placeholder: 'https://linkedin.com/company/…' },
  ]

  return (
    <div className="dash-page">
      <div className="dash-page-header">
        <div>
          <h1>📬 Contact Info</h1>
          <p>Update public contact details and social media links</p>
        </div>
      </div>

      {saved && (
        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 8, color: '#86efac', padding: '10px 16px', marginBottom: 20, fontSize: '0.88rem' }}>
          ✓ Contact information saved successfully.
        </div>
      )}
      {error && <div className="db-error" style={{ marginBottom: 20 }}>{error}</div>}

      <form onSubmit={handleSave} className="db-form" style={{ maxWidth: 600 }}>
        {fields.map(f => (
          <div key={f.key} className="db-field">
            <label>{f.label}</label>
            <input
              value={form[f.key] || ''}
              onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
            />
          </div>
        ))}
        <div className="db-form-actions" style={{ justifyContent: 'flex-start' }}>
          <button type="submit" className="db-btn db-btn-primary" disabled={saving}>
            {saving ? 'Saving…' : '💾 Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
