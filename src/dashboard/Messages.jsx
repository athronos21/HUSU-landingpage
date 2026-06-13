import { useState, useEffect, useRef } from 'react'
import {
  collection, addDoc, onSnapshot, query,
  orderBy, serverTimestamp, limit, where
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useCollection } from '../hooks/useFirestore'
import { COMMS_ROLES } from './roles'
import './Dashboard.css'
import './Messages.css'

const GROUP_ROOM = 'group'

export default function Messages() {
  const { user, profile } = useAuth()
  const { docs: allUsers } = useCollection('users', 'createdAt')
  const [activeRoom, setActiveRoom] = useState(GROUP_ROOM)
  const [messages,   setMessages]   = useState([])
  const [text,       setText]       = useState('')
  const [sending,    setSending]    = useState(false)
  const bottomRef = useRef(null)

  // Eligible chat members — all comms roles except self
  const members = allUsers.filter(u =>
    u.id !== user?.uid &&
    COMMS_ROLES.includes(u.role) &&
    u.status !== 'pending'
  )

  // Get room ID for 1-on-1
  const getRoomId = (uid) => {
    const ids = [user.uid, uid].sort()
    return `dm_${ids[0]}_${ids[1]}`
  }

  // Listen to messages in active room — scoped query, no full collection read
  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'messages'),
      where('roomId', '==', activeRoom),
      orderBy('createdAt', 'asc'),
      limit(100)
    )
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [user, activeRoom])

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async e => {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)
    try {
      await addDoc(collection(db, 'messages'), {
        roomId:    activeRoom,
        fromUid:   user.uid,
        fromName:  profile?.name || user.email,
        fromImage: profile?.image || null,
        text:      text.trim(),
        createdAt: serverTimestamp(),
      })
      setText('')
    } catch (e) {
      console.error(e)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (ts) => {
    if (!ts) return ''
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDay = (ts) => {
    if (!ts) return ''
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    const today = new Date()
    const isToday = d.toDateString() === today.toDateString()
    if (isToday) return 'Today'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Group messages by day
  const grouped = messages.reduce((acc, msg) => {
    const day = formatDay(msg.createdAt)
    if (!acc[day]) acc[day] = []
    acc[day].push(msg)
    return acc
  }, {})

  const activeUser = activeRoom !== GROUP_ROOM
    ? allUsers.find(u => activeRoom === getRoomId(u.id))
    : null

  const initials = (name) => (name || '?').split(' ').map(n => n[0]).join('').toUpperCase()

  return (
    <div className="dash-page msg-page">
      <div className="dash-page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1>💬 Messages</h1>
          <p>Internal communication with union leadership</p>
        </div>
      </div>

      <div className="msg-layout">

        {/* ── Contacts sidebar ── */}
        <div className="msg-sidebar">
          {/* Group chat */}
          <button
            className={`msg-contact${activeRoom === GROUP_ROOM ? ' active' : ''}`}
            onClick={() => setActiveRoom(GROUP_ROOM)}
          >
            <div className="msg-contact-avatar group">👥</div>
            <div className="msg-contact-info">
              <span className="msg-contact-name">Group Chat</span>
              <span className="msg-contact-role">All leaders & heads</span>
            </div>
          </button>

          <div className="msg-divider-label">Direct Messages</div>

          {members.map(u => (
            <button
              key={u.id}
              className={`msg-contact${activeRoom === getRoomId(u.id) ? ' active' : ''}`}
              onClick={() => setActiveRoom(getRoomId(u.id))}
            >
              <div className="msg-contact-avatar">
                {u.image
                  ? <img src={u.image} alt={u.name} />
                  : initials(u.name)
                }
              </div>
              <div className="msg-contact-info">
                <span className="msg-contact-name">{u.name}</span>
                <span className="msg-contact-role">
                  {u.role === 'affair_head' ? `Head · ${u.affairName || ''}` :
                   u.role === 'assoc_head'  ? `Assoc · ${u.affairName || ''}` :
                   u.role === 'admin' ? 'Administrator' : u.role}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* ── Chat area ── */}
        <div className="msg-chat">

          {/* Header */}
          <div className="msg-chat-header">
            {activeRoom === GROUP_ROOM ? (
              <>
                <div className="msg-chat-avatar group">👥</div>
                <div>
                  <p className="msg-chat-name">Group Chat</p>
                  <p className="msg-chat-sub">{members.length + 1} members</p>
                </div>
              </>
            ) : activeUser ? (
              <>
                <div className="msg-chat-avatar">
                  {activeUser.image
                    ? <img src={activeUser.image} alt={activeUser.name} />
                    : initials(activeUser.name)
                  }
                </div>
                <div>
                  <p className="msg-chat-name">{activeUser.name}</p>
                  <p className="msg-chat-sub">
                    {activeUser.role === 'affair_head' ? `Head · ${activeUser.affairName}` : activeUser.role}
                  </p>
                </div>
              </>
            ) : null}
          </div>

          {/* Messages */}
          <div className="msg-messages">
            {Object.entries(grouped).map(([day, msgs]) => (
              <div key={day}>
                <div className="msg-day-label">{day}</div>
                {msgs.map((msg, i) => {
                  const isMine = msg.fromUid === user?.uid
                  const prevMsg = msgs[i - 1]
                  const showAvatar = !isMine && (!prevMsg || prevMsg.fromUid !== msg.fromUid)
                  return (
                    <div key={msg.id} className={`msg-row${isMine ? ' mine' : ''}`}>
                      {!isMine && (
                        <div className={`msg-avatar${showAvatar ? '' : ' invisible'}`}>
                          {showAvatar && (initials(msg.fromName))}
                        </div>
                      )}
                      <div className="msg-bubble-wrap">
                        {showAvatar && !isMine && (
                          <span className="msg-sender-name">{msg.fromName}</span>
                        )}
                        <div className="msg-bubble">
                          <p>{msg.text}</p>
                          <span className="msg-time">{formatTime(msg.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
            {messages.length === 0 && (
              <div className="msg-empty">
                <span>💬</span>
                <p>No messages yet. Start the conversation!</p>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form className="msg-input-row" onSubmit={handleSend}>
            <input
              className="msg-input"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Type a message…"
              autoComplete="off"
            />
            <button type="submit" className="msg-send-btn" disabled={!text.trim() || sending}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
