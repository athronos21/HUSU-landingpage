import { useState, useEffect } from 'react'
import {
  collection, addDoc, onSnapshot, query,
  orderBy, doc, updateDoc, serverTimestamp, where
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useCollection } from '../hooks/useFirestore'
import './Dashboard.css'
import './Letters.css'

export default function Letters() {
  const { user, profile } = useAuth()
  const { docs: allUsers } = useCollection('users', 'createdAt')
  const [tab,        setTab]        = useState('inbox')   // inbox | sent | compose
  const [letters,    setLetters]    = useState([])
  const [selected,   setSelected]   = useState(null)
  const [composing,  setComposing]  = useState(false)
  const [form,       setForm]       = useState({ toUids: [], subject: '', body: '' })
  const [sending,    setSending]    = useState(false)
  const [error,      setError]      = useState('')

  // Eligible recipients — 5 leaders + all heads (excluding self)
  const eligibleRoles = ['admin', 'affair_head', 'assoc_head']
  const recipients = allUsers.filter(u =>
    u.id !== user?.uid &&
    eligibleRoles.includes(u.role) &&
    u.status !== 'pending'
  )

  // Live letters
  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'letters'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setLetters(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [user])

  const inbox = letters.filter(l => l.toUids?.includes(user?.uid))
  const sent  = letters.filter(l => l.fromUid === user?.uid)

  const isUnread = (l) => !l.reads?.[user?.uid]

  const openLetter = async (letter) => {
    setSelected(letter)
    // Mark as read
    if (!letter.reads?.[user?.uid]) {
      await updateDoc(doc(db, 'letters', letter.id), {
        [`reads.${user.uid}`]: new Date().toISOString(),
      })
    }
  }

  const handleRespond = async (response) => {
    if (!selected) return
    await updateDoc(doc(db, 'letters', selected.id), {
      [`responses.${user.uid}`]: response,
    })
    setSelected(prev => ({
      ...prev,
      responses: { ...prev.responses, [user.uid]: response },
    }))
  }

  const handleSend = async e => {
    e.preventDefault()
    if (!form.subject.trim()) { setError('Subject is required.'); return }
    if (!form.body.trim())    { setError('Body is required.'); return }
    if (form.toUids.length === 0) { setError('Select at least one recipient.'); return }
    setSending(true); setError('')
    try {
      await addDoc(collection(db, 'letters'), {
        subject:   form.subject,
        body:      form.body,
        fromUid:   user.uid,
        fromName:  profile?.name || user.email,
        fromRole:  profile?.role || '',
        toUids:    form.toUids,
        reads:     {},
        responses: {},
        createdAt: serverTimestamp(),
      })
      setForm({ toUids: [], subject: '', body: '' })
      setComposing(false)
      setTab('sent')
    } catch (err) {
      setError(err.message || 'Failed to send.')
    } finally {
      setSending(false)
    }
  }

  const toggleRecipient = (uid) => {
    setForm(f => ({
      ...f,
      toUids: f.toUids.includes(uid)
        ? f.toUids.filter(id => id !== uid)
        : [...f.toUids, uid],
    }))
  }

  const formatDate = (ts) => {
    if (!ts) return ''
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const roleLabel = { admin: 'Administrator', affair_head: 'Affair Head', assoc_head: 'Assoc. Head' }

  return (
    <div className="dash-page ltr-page">
      <div className="dash-page-header">
        <div>
          <h1>📨 Letters</h1>
          <p>Formal communication between union leadership</p>
        </div>
        <button className="db-btn db-btn-primary" onClick={() => { setComposing(true); setSelected(null) }}>
          ✏️ Compose Letter
        </button>
      </div>

      <div className="ltr-layout">

        {/* ── Sidebar ── */}
        <div className="ltr-sidebar">
          <button
            className={`ltr-tab-btn${tab === 'inbox' ? ' active' : ''}`}
            onClick={() => { setTab('inbox'); setSelected(null); setComposing(false) }}
          >
            📥 Inbox
            {inbox.filter(l => isUnread(l)).length > 0 && (
              <span className="ltr-badge">{inbox.filter(l => isUnread(l)).length}</span>
            )}
          </button>
          <button
            className={`ltr-tab-btn${tab === 'sent' ? ' active' : ''}`}
            onClick={() => { setTab('sent'); setSelected(null); setComposing(false) }}
          >
            📤 Sent
          </button>
        </div>

        {/* ── Main area ── */}
        <div className="ltr-main">

          {/* Compose */}
          {composing && (
            <div className="ltr-compose">
              <h3>Compose Letter</h3>
              {error && <div className="db-error" style={{ marginBottom: 12 }}>{error}</div>}
              <form onSubmit={handleSend} className="db-form">
                <div className="db-field">
                  <label>To *</label>
                  <div className="ltr-recipients">
                    {recipients.map(u => (
                      <button
                        key={u.id}
                        type="button"
                        className={`ltr-recipient-btn${form.toUids.includes(u.id) ? ' selected' : ''}`}
                        onClick={() => toggleRecipient(u.id)}
                      >
                        <div className="ltr-rec-avatar">{(u.name || '?')[0]}</div>
                        <div>
                          <span className="ltr-rec-name">{u.name}</span>
                          <span className="ltr-rec-role">{roleLabel[u.role] || u.role}</span>
                        </div>
                        {form.toUids.includes(u.id) && <span className="ltr-rec-check">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="db-field">
                  <label>Subject *</label>
                  <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Letter subject" />
                </div>
                <div className="db-field">
                  <label>Body *</label>
                  <textarea
                    value={form.body}
                    onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                    placeholder="Write your letter here…"
                    style={{ minHeight: 180 }}
                  />
                </div>
                <div className="db-form-actions">
                  <button type="button" className="db-btn db-btn-ghost" onClick={() => setComposing(false)}>Cancel</button>
                  <button type="submit" className="db-btn db-btn-primary" disabled={sending}>
                    {sending ? 'Sending…' : '📨 Send Letter'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Letter detail */}
          {selected && !composing && (
            <div className="ltr-detail">
              <button className="ltr-back" onClick={() => setSelected(null)}>← Back</button>
              <div className="ltr-detail-header">
                <h2>{selected.subject}</h2>
                <div className="ltr-detail-meta">
                  <span>From: <strong>{selected.fromName}</strong></span>
                  <span>·</span>
                  <span>{formatDate(selected.createdAt)}</span>
                </div>
              </div>
              <div className="ltr-detail-body">{selected.body}</div>

              {/* Response — only for inbox letters not from self */}
              {selected.fromUid !== user?.uid && (
                <div className="ltr-response-area">
                  {selected.responses?.[user?.uid] ? (
                    <div className={`ltr-response-status ${selected.responses[user.uid]}`}>
                      {selected.responses[user.uid] === 'accepted' ? '✅ You accepted this letter' : '❌ You rejected this letter'}
                    </div>
                  ) : (
                    <div className="ltr-response-btns">
                      <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)', marginBottom: 12 }}>
                        Respond to this letter:
                      </p>
                      <button className="db-btn db-btn-primary" onClick={() => handleRespond('accepted')}>
                        ✅ Accept
                      </button>
                      <button className="db-btn db-btn-danger" onClick={() => handleRespond('rejected')} style={{ marginLeft: 8 }}>
                        ❌ Reject
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Show responses if sender */}
              {selected.fromUid === user?.uid && Object.keys(selected.responses || {}).length > 0 && (
                <div className="ltr-responses-list">
                  <h4>Responses:</h4>
                  {Object.entries(selected.responses).map(([uid, resp]) => {
                    const u = allUsers.find(u => u.id === uid)
                    return (
                      <div key={uid} className={`ltr-resp-item ${resp}`}>
                        <span>{u?.name || uid}</span>
                        <span className="ltr-resp-badge">{resp === 'accepted' ? '✅ Accepted' : '❌ Rejected'}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Letter list */}
          {!composing && !selected && (
            <div className="ltr-list">
              {(tab === 'inbox' ? inbox : sent).length === 0 ? (
                <div className="ltr-empty">
                  <span>{tab === 'inbox' ? '📭' : '📤'}</span>
                  <p>{tab === 'inbox' ? 'No letters received yet' : 'No letters sent yet'}</p>
                </div>
              ) : (
                (tab === 'inbox' ? inbox : sent).map(letter => (
                  <button
                    key={letter.id}
                    className={`ltr-item${isUnread(letter) && tab === 'inbox' ? ' unread' : ''}`}
                    onClick={() => openLetter(letter)}
                  >
                    <div className="ltr-item-avatar">
                      {(tab === 'inbox' ? letter.fromName : 'To')[0]}
                    </div>
                    <div className="ltr-item-body">
                      <div className="ltr-item-top">
                        <span className="ltr-item-from">
                          {tab === 'inbox' ? letter.fromName : `To: ${letter.toUids?.length} recipient(s)`}
                        </span>
                        <span className="ltr-item-date">{formatDate(letter.createdAt)}</span>
                      </div>
                      <p className="ltr-item-subject">{letter.subject}</p>
                      <p className="ltr-item-preview">{letter.body?.slice(0, 80)}…</p>
                    </div>
                    {isUnread(letter) && tab === 'inbox' && <div className="ltr-unread-dot" />}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
