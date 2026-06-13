import { useState, useMemo, useEffect } from 'react'
import { useEvents } from '../hooks/usePublicData'
import { TelegramIcon } from '../components/SocialIcons'
import './Events.css'

const TELEGRAM_CHANNEL = 'HUSU_Events'

const CAT = {
  Sports:   { color: '#42b72a', bg: '#e6f4ea', border: '#42b72a', icon: '⚽' },
  Academic: { color: '#1877f2', bg: '#e7f3ff', border: '#1877f2', icon: '🎓' },
  Workshop: { color: '#8b5cf6', bg: '#f3e8ff', border: '#8b5cf6', icon: '🛠️' },
  Culture:  { color: '#f59e0b', bg: '#fef3c7', border: '#f59e0b', icon: '🎭' },
}

function cleanText(text, maxLen = 300) {
  if (!text) return ''
  const noUrls = text.replace(/https?:\/\/\S+/g, '').replace(/\s{2,}/g, ' ').trim()
  if (noUrls.length > maxLen) return noUrls.slice(0, maxLen) + '...'
  return noUrls
}

function isPast(d) { return d && new Date(d) < new Date() }

function formatDate(d) {
  if (!d) return ''
  const date = new Date(d)
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function timeUntil(d) {
  if (!d || isPast(d)) return null
  const days = Math.ceil((new Date(d) - new Date()) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days <= 7) return `In ${days} days`
  return null
}

function CatBadge({ cat }) {
  const s = CAT[cat] || CAT.Academic
  return (
    <span className="fb-ev-badge" style={{ color: s.color, background: s.bg, borderColor: s.border }}>
      {s.icon} {cat}
    </span>
  )
}

export default function Events() {
  const { data: events, loading } = useEvents()
  const [activeCat,  setActiveCat]  = useState('All')
  const [activeTime, setActiveTime] = useState('All')
  const [selected,   setSelected]   = useState(null)
  const [interested, setInterested] = useState({})
  const [interestedCount, setInterestedCount] = useState({})
  const [showComments, setShowComments] = useState(null)
  const [comments, setComments] = useState({})
  const [commentText, setCommentText] = useState('')
  const [showShareModal, setShowShareModal] = useState(null)

  // Initialize interested counts
  useEffect(() => {
    const counts = {}
    events.forEach(event => {
      counts[event.id] = Math.floor(Math.random() * 50) + 20
    })
    setInterestedCount(counts)
  }, [events])

  // Debug: Log events with images
  useEffect(() => {
    if (events.length > 0) {
      const withImages = events.filter(e => e.image && e.image.trim())
      console.log(`📅 Events loaded: ${events.length} total, ${withImages.length} with images`)
      withImages.forEach(e => {
        console.log(`  - ${e.title}: ${e.image}`)
      })
    }
  }, [events])

  const toggleInterested = (id) => {
    setInterested(prev => {
      const newInterested = { ...prev, [id]: !prev[id] }
      setInterestedCount(prevCount => ({
        ...prevCount,
        [id]: (prevCount[id] || 0) + (newInterested[id] ? 1 : -1)
      }))
      return newInterested
    })
  }

  const handleCommentClick = (id) => {
    setShowComments(showComments === id ? null : id)
    setCommentText('')
  }

  const handleAddComment = (id) => {
    if (!commentText.trim()) return
    
    setComments(prev => ({
      ...prev,
      [id]: [
        ...(prev[id] || []),
        {
          id: Date.now(),
          text: commentText,
          author: 'You',
          time: 'Just now'
        }
      ]
    }))
    setCommentText('')
  }

  const handleShare = (event) => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description,
        url: window.location.href
      }).catch(() => setShowShareModal(event))
    } else {
      setShowShareModal(event)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setTimeout(() => {
      setShowShareModal(null)
    }, 1000)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    alert('Link copied to clipboard!')
    setShowShareModal(null)
  }

  const filtered = useMemo(() => events.filter(e =>
    (activeCat  === 'All' || e.category === activeCat) &&
    (activeTime === 'All' || (activeTime === 'Upcoming' && !isPast(e.date)) || (activeTime === 'Past' && isPast(e.date)))
  ), [events, activeCat, activeTime])

  const upcoming = events.filter(e => !isPast(e.date))

  return (
    <div className="fb-ev-page">
      
      {/* Header */}
      <div className="fb-ev-header">
        <div className="container">
          <div className="fb-ev-header-content">
            <div>
              <h1 className="fb-ev-title">Events</h1>
              <p className="fb-ev-subtitle">{upcoming.length} upcoming • {events.length} total events</p>
            </div>
            <a href={`https://t.me/${TELEGRAM_CHANNEL}`} target="_blank" rel="noreferrer" className="fb-telegram-btn">
              <TelegramIcon size={20} />
              <span>Follow on Telegram</span>
            </a>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="fb-ev-filters">
        <div className="container">
          <div className="fb-ev-time-btns">
            {['All', 'Upcoming', 'Past'].map(t => (
              <button 
                key={t} 
                className={`fb-ev-time-btn${activeTime === t ? ' active' : ''}`}
                onClick={() => setActiveTime(t)}
              >
                {t}
                <span className="fb-cat-count">{
                  t === 'All' ? events.length :
                  t === 'Upcoming' ? upcoming.length :
                  events.filter(e => isPast(e.date)).length
                }</span>
              </button>
            ))}
          </div>
          <div className="fb-ev-cats">
            <button 
              className={`fb-cat-pill${activeCat === 'All' ? ' active' : ''}`}
              onClick={() => setActiveCat('All')}
            >
              All
            </button>
            {Object.keys(CAT).map(c => (
              <button
                key={c}
                className={`fb-cat-pill${activeCat === c ? ' active' : ''}`}
                onClick={() => setActiveCat(c)}
              >
                {CAT[c].icon} {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feed with Sidebar */}
      <div className="fb-ev-feed">
        <div className="container fb-ev-feed-container">
          
          {/* Sidebar */}
          <aside className="fb-ev-sidebar">
            <div className="fb-ev-sidebar-card">
              <h3 className="fb-ev-sidebar-title">📅 Event Summary</h3>
              <div className="fb-ev-stat-grid">
                <div className="fb-ev-stat-item">
                  <div className="fb-ev-stat-value">{upcoming.length}</div>
                  <div className="fb-ev-stat-label">Upcoming</div>
                </div>
                <div className="fb-ev-stat-item">
                  <div className="fb-ev-stat-value">{events.filter(e => isPast(e.date)).length}</div>
                  <div className="fb-ev-stat-label">Past</div>
                </div>
                <div className="fb-ev-stat-item">
                  <div className="fb-ev-stat-value">{events.filter(e => e.category === 'Sports').length}</div>
                  <div className="fb-ev-stat-label">Sports</div>
                </div>
                <div className="fb-ev-stat-item">
                  <div className="fb-ev-stat-value">{events.filter(e => e.category === 'Academic').length}</div>
                  <div className="fb-ev-stat-label">Academic</div>
                </div>
              </div>
            </div>

            {upcoming.length > 0 && (
              <div className="fb-ev-sidebar-card fb-ev-next-card">
                <h3 className="fb-ev-sidebar-title">⚡ Next Event</h3>
                <div className="fb-ev-next-preview" onClick={() => setSelected(upcoming[0])}>
                  <div className="fb-ev-next-cat" style={{ background: CAT[upcoming[0].category]?.bg, color: CAT[upcoming[0].category]?.color }}>
                    {CAT[upcoming[0].category]?.icon} {upcoming[0].category}
                  </div>
                  <h4 className="fb-ev-next-title">{upcoming[0].title}</h4>
                  <div className="fb-ev-next-date">{formatDate(upcoming[0].date)}</div>
                  {timeUntil(upcoming[0].date) && (
                    <div className="fb-ev-next-countdown">{timeUntil(upcoming[0].date)}</div>
                  )}
                </div>
              </div>
            )}
            
            <div className="fb-ev-sidebar-card">
              <h3 className="fb-ev-sidebar-title">🎯 By Category</h3>
              <div className="fb-ev-cats-list">
                {Object.entries(CAT).map(([cat, style]) => (
                  <div key={cat} className="fb-ev-cat-item" onClick={() => setActiveCat(cat)}>
                    <span className="fb-ev-cat-icon" style={{ background: style.bg }}>{style.icon}</span>
                    <span className="fb-ev-cat-name">{cat}</span>
                    <span className="fb-ev-cat-count">{events.filter(e => e.category === cat).length}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="fb-ev-sidebar-card fb-telegram-card">
              <div className="fb-telegram-icon"><TelegramIcon size={32} /></div>
              <h3 className="fb-ev-sidebar-title">Never Miss an Event</h3>
              <p className="fb-sidebar-text">Get instant event reminders on Telegram</p>
              <a href={`https://t.me/${TELEGRAM_CHANNEL}`} target="_blank" rel="noreferrer" className="fb-sidebar-btn">
                Join Channel
              </a>
            </div>
          </aside>

          {/* Main Feed */}
          <main className="fb-ev-main">
            {loading ? (
              <div className="fb-ev-loading">
                <div className="fb-spinner" />
                <p>Loading events...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="fb-ev-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <h3>No events found</h3>
                <p>Try adjusting your filters</p>
                <button className="fb-clear-btn" onClick={() => { setActiveCat('All'); setActiveTime('All') }}>
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="fb-ev-cards">
                {filtered.map((event, idx) => {
                  const past = isPast(event.date)
                  const cat = CAT[event.category] || CAT.Academic
                  const until = timeUntil(event.date)
                  
                  return (
                    <article 
                      key={event.id} 
                      className={`fb-ev-card${past ? ' past' : ''}`}
                      onClick={() => setSelected(event)}
                    >
                      {/* Featured Badge */}
                      {idx === 0 && !past && (
                        <div className="fb-ev-featured-badge">
                          ⭐ Featured Event
                        </div>
                      )}
                      
                      {/* Card Header */}
                      <div className="fb-ev-card-header">
                        <div className="fb-ev-card-avatar" style={{ background: `linear-gradient(135deg, ${cat.color}, ${cat.color}dd)` }}>
                          <span>{cat.icon}</span>
                        </div>
                        <div className="fb-ev-card-meta">
                          <div className="fb-ev-card-author">
                            HUSU Events
                            {event.affair && <span className="fb-affair-tag"> • {event.affair}</span>}
                          </div>
                          <div className="fb-ev-card-time">
                            {formatDate(event.date)} • <CatBadge cat={event.category} />
                          </div>
                        </div>
                        {until && !past && (
                          <div className="fb-ev-countdown">{until}</div>
                        )}
                        {past && (
                          <div className="fb-ev-past-badge">Ended</div>
                        )}
                      </div>

                      {/* Image */}
                      {event.image && event.image.trim() && (
                        <div className="fb-ev-card-img">
                          <img 
                            src={event.image} 
                            alt={event.title}
                            onError={(e) => {
                              console.error('Image failed to load:', event.image, 'for event:', event.id)
                              e.target.style.display = 'none'
                            }}
                            onLoad={() => console.log('Image loaded successfully:', event.image)}
                          />
                        </div>
                      )}

                      {/* Body */}
                      <div className="fb-ev-card-body">
                        <h2 className="fb-ev-card-title">{event.title}</h2>
                        {event.description && (
                          <p className="fb-ev-card-text">{cleanText(event.description, 200)}</p>
                        )}
                        
                        {/* Event Details */}
                        <div className="fb-ev-details">
                          {event.time && (
                            <div className="fb-ev-detail">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                              </svg>
                              {event.time}
                            </div>
                          )}
                          {event.location && (
                            <div className="fb-ev-detail">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                <circle cx="12" cy="10" r="3"/>
                              </svg>
                              {event.location}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Engagement Bar */}
                      <div className="fb-ev-engagement">
                        <span onClick={(e) => { e.stopPropagation(); handleCommentClick(event.id); }} style={{ cursor: 'pointer' }}>
                          {interestedCount[event.id] || 0} interested
                        </span>
                        <span>•</span>
                        <span onClick={(e) => { e.stopPropagation(); handleCommentClick(event.id); }} style={{ cursor: 'pointer' }}>
                          {(comments[event.id] || []).length} comment{(comments[event.id] || []).length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Footer */}
                      <div className="fb-ev-card-footer">
                        <button 
                          className={`fb-action-btn${interested[event.id] ? ' active' : ''}`}
                          onClick={(e) => { e.stopPropagation(); toggleInterested(event.id); }}
                        >
                          <svg viewBox="0 0 24 24" fill={interested[event.id] ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                          </svg>
                          {interested[event.id] ? 'Interested ✓' : 'Interested'}
                        </button>
                        <button 
                          className={`fb-action-btn${showComments === event.id ? ' active' : ''}`}
                          onClick={(e) => { e.stopPropagation(); handleCommentClick(event.id); }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                          </svg>
                          Comment
                        </button>
                        <button 
                          className="fb-action-btn"
                          onClick={(e) => { e.stopPropagation(); handleShare(event); }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                          </svg>
                          Share
                        </button>
                      </div>

                      {/* Comment Section */}
                      {showComments === event.id && (
                        <div className="fb-comments-section" onClick={(e) => e.stopPropagation()}>
                          <div className="fb-comments-list">
                            {(comments[event.id] || []).map(comment => (
                              <div key={comment.id} className="fb-comment">
                                <div className="fb-comment-avatar">
                                  <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                                  </svg>
                                </div>
                                <div className="fb-comment-content">
                                  <div className="fb-comment-bubble">
                                    <strong>{comment.author}</strong>
                                    <p>{comment.text}</p>
                                  </div>
                                  <div className="fb-comment-meta">
                                    <span>{comment.time}</span>
                                    <button>Like</button>
                                    <button>Reply</button>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {(comments[event.id] || []).length === 0 && (
                              <p className="fb-no-comments">No comments yet. Be the first to comment!</p>
                            )}
                          </div>
                          <div className="fb-comment-input">
                            <div className="fb-comment-avatar">
                              <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                              </svg>
                            </div>
                            <div className="fb-comment-input-wrapper">
                              <input
                                type="text"
                                placeholder="Write a comment..."
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && handleAddComment(event.id)}
                              />
                              <button 
                                className="fb-comment-send"
                                onClick={() => handleAddComment(event.id)}
                                disabled={!commentText.trim()}
                              >
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <div className="fb-ev-modal-overlay" onClick={() => setSelected(null)}>
          <div className="fb-ev-modal" onClick={e => e.stopPropagation()}>
            <button className="fb-ev-modal-close" onClick={() => setSelected(null)}>×</button>
            
            {selected.image && selected.image.trim() && (
              <div className="fb-ev-modal-img">
                <img 
                  src={selected.image} 
                  alt={selected.title}
                  onError={(e) => {
                    console.error('Modal image failed to load:', selected.image, 'for event:', selected.id)
                    e.target.style.display = 'none'
                  }}
                  onLoad={() => console.log('Modal image loaded successfully:', selected.image)}
                />
              </div>
            )}
            
            <div className="fb-ev-modal-body">
              <div className="fb-ev-modal-header">
                <CatBadge cat={selected.category} />
                {isPast(selected.date) ? (
                  <span className="fb-ev-past-badge">Ended</span>
                ) : timeUntil(selected.date) && (
                  <span className="fb-ev-countdown">{timeUntil(selected.date)}</span>
                )}
              </div>
              
              <h2 className="fb-ev-modal-title">{selected.title}</h2>
              
              <div className="fb-ev-modal-details">
                <div className="fb-ev-modal-detail">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <span>{formatDate(selected.date)}</span>
                </div>
                {selected.time && (
                  <div className="fb-ev-modal-detail">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span>{selected.time}</span>
                  </div>
                )}
                {selected.location && (
                  <div className="fb-ev-modal-detail">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span>{selected.location}</span>
                  </div>
                )}
                {selected.affair && (
                  <div className="fb-ev-modal-detail">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                    <span>{selected.affair}</span>
                  </div>
                )}
              </div>
              
              {selected.description && (
                <p className="fb-ev-modal-desc">{cleanText(selected.description, 800)}</p>
              )}
              
              {selected.postedBy && (
                <p className="fb-ev-modal-by">Posted by {selected.postedBy}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fb-share-modal-overlay" onClick={() => setShowShareModal(null)}>
          <div className="fb-share-modal" onClick={e => e.stopPropagation()}>
            <button className="fb-share-close" onClick={() => setShowShareModal(null)}>×</button>
            <h3>Share this event</h3>
            <p className="fb-share-title">{showShareModal.title}</p>
            <div className="fb-share-options">
              <button onClick={copyLink} className="fb-share-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
                Copy Link
              </button>
              <a 
                href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(showShareModal.title)}`}
                target="_blank" 
                rel="noreferrer"
                className="fb-share-btn"
              >
                <TelegramIcon size={20} />
                Telegram
              </a>
              <a 
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                target="_blank" 
                rel="noreferrer"
                className="fb-share-btn"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
