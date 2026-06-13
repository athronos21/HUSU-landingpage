import { useState, useMemo, useEffect } from 'react'
import { useNews } from '../hooks/usePublicData'
import { TelegramIcon } from '../components/SocialIcons'
import './News.css'

const TELEGRAM_CHANNEL = 'HUSU_News'

const CAT = {
  Announcement: { color: '#1877f2', bg: '#e7f3ff', border: '#1877f2' },
  Academic:     { color: '#42b72a', bg: '#e6f4ea', border: '#42b72a' },
  Service:      { color: '#f59e0b', bg: '#fef3c7', border: '#f59e0b' },
  Discipline:   { color: '#8b5cf6', bg: '#f3e8ff', border: '#8b5cf6' },
}
const ALL_CATS = ['All', ...Object.keys(CAT)]

function cleanSummary(text, maxLen = 300) {
  if (!text) return ''
  const noUrls = text.replace(/https?:\/\/\S+/g, '').replace(/\s{2,}/g, ' ').trim()
  if (noUrls.length > maxLen) return noUrls.slice(0, maxLen) + '...'
  return noUrls
}

function timeAgo(d) {
  if (!d) return ''
  const minutes = Math.floor((Date.now() - new Date(d)) / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function CatBadge({ cat }) {
  const s = CAT[cat] || CAT.Announcement
  return (
    <span className="fb-cat-badge" style={{ color: s.color, background: s.bg, borderColor: s.border }}>
      {cat}
    </span>
  )
}

export default function News() {
  const { data: news, loading } = useNews()
  const [search,  setSearch]  = useState('')
  const [activeCat, setActiveCat] = useState('All')
  const [expanded, setExpanded] = useState(null)
  const [liked, setLiked] = useState({})
  const [likeCount, setLikeCount] = useState({})
  const [showComments, setShowComments] = useState(null)
  const [comments, setComments] = useState({})
  const [commentText, setCommentText] = useState('')
  const [showShareModal, setShowShareModal] = useState(null)

  // Initialize like counts from random seed
  useEffect(() => {
    const counts = {}
    news.forEach(item => {
      counts[item.id] = Math.floor(Math.random() * 50) + 10
    })
    setLikeCount(counts)
  }, [news])

  // Debug: Log news items with images
  useEffect(() => {
    if (news.length > 0) {
      const withImages = news.filter(n => n.image && n.image.trim())
      console.log(`📰 News loaded: ${news.length} total, ${withImages.length} with images`)
      withImages.forEach(n => {
        console.log(`  - ${n.title}: ${n.image}`)
      })
    }
  }, [news])

  const toggleLike = (id) => {
    setLiked(prev => {
      const newLiked = { ...prev, [id]: !prev[id] }
      // Update count
      setLikeCount(prevCount => ({
        ...prevCount,
        [id]: (prevCount[id] || 0) + (newLiked[id] ? 1 : -1)
      }))
      return newLiked
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

  const handleShare = (item) => {
    if (navigator.share) {
      navigator.share({
        title: item.title,
        text: item.summary,
        url: window.location.href
      }).catch(() => setShowShareModal(item))
    } else {
      setShowShareModal(item)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    const btn = event.target.closest('button')
    const originalText = btn.innerHTML
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copied!`
    setTimeout(() => {
      setShowShareModal(null)
    }, 1000)
  }

  const filtered = useMemo(() => news.filter(item => {
    const q = search.toLowerCase()
    return (activeCat === 'All' || item.category === activeCat) &&
      (!q || item.title?.toLowerCase().includes(q) || item.summary?.toLowerCase().includes(q))
  }), [news, search, activeCat])

  return (
    <div className="fb-page">
      
      {/* Header */}
      <div className="fb-header">
        <div className="container">
          <div className="fb-header-content">
            <div>
              <h1 className="fb-title">News Feed</h1>
              <p className="fb-subtitle">{news.length} articles • Latest updates from HUSU</p>
            </div>
            <a href={`https://t.me/${TELEGRAM_CHANNEL}`} target="_blank" rel="noreferrer" className="fb-telegram-btn">
              <TelegramIcon size={20} />
              <span>Follow on Telegram</span>
            </a>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="fb-filters">
        <div className="container">
          <div className="fb-search-wrap">
            <svg className="fb-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              className="fb-search"
              placeholder="Search news..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="fb-cats">
            {ALL_CATS.map(c => (
              <button
                key={c}
                className={`fb-cat-pill${activeCat === c ? ' active' : ''}`}
                onClick={() => setActiveCat(c)}
              >
                {c}
                <span className="fb-cat-count">{c === 'All' ? news.length : news.filter(n => n.category === c).length}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feed with Sidebar */}
      <div className="fb-feed">
        <div className="container fb-feed-container">
          
          {/* Sidebar */}
          <aside className="fb-sidebar">
            <div className="fb-sidebar-card">
              <h3 className="fb-sidebar-title">📊 Quick Stats</h3>
              <div className="fb-stat-grid">
                <div className="fb-stat-item">
                  <div className="fb-stat-value">{news.length}</div>
                  <div className="fb-stat-label">Total Articles</div>
                </div>
                <div className="fb-stat-item">
                  <div className="fb-stat-value">{news.filter(n => n.category === 'Announcement').length}</div>
                  <div className="fb-stat-label">Announcements</div>
                </div>
                <div className="fb-stat-item">
                  <div className="fb-stat-value">{news.filter(n => n.category === 'Academic').length}</div>
                  <div className="fb-stat-label">Academic</div>
                </div>
                <div className="fb-stat-item">
                  <div className="fb-stat-value">{news.filter(n => n.category === 'Service').length}</div>
                  <div className="fb-stat-label">Service</div>
                </div>
              </div>
            </div>
            
            <div className="fb-sidebar-card">
              <h3 className="fb-sidebar-title">🔥 Trending Affairs</h3>
              <div className="fb-affairs-list">
                {[...new Set(news.filter(n => n.affair).map(n => n.affair))].slice(0, 5).map(affair => (
                  <div key={affair} className="fb-affair-item">
                    <div className="fb-affair-icon">🏛️</div>
                    <div className="fb-affair-name">{affair}</div>
                    <div className="fb-affair-count">{news.filter(n => n.affair === affair).length}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="fb-sidebar-card fb-telegram-card">
              <div className="fb-telegram-icon"><TelegramIcon size={32} /></div>
              <h3 className="fb-sidebar-title">Stay Connected</h3>
              <p className="fb-sidebar-text">Get instant notifications on Telegram</p>
              <a href={`https://t.me/${TELEGRAM_CHANNEL}`} target="_blank" rel="noreferrer" className="fb-sidebar-btn">
                Join Channel
              </a>
            </div>
          </aside>

          {/* Main Feed */}
          <main className="fb-main">
            {loading ? (
              <div className="fb-loading">
                <div className="fb-spinner" />
                <p>Loading news...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="fb-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <h3>No articles found</h3>
                <p>Try adjusting your search or filters</p>
                <button className="fb-clear-btn" onClick={() => { setSearch(''); setActiveCat('All') }}>
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="fb-cards">
                {filtered.map((item, idx) => (
                  <article key={item.id} className="fb-card">
                    {/* Pinned Badge */}
                    {idx === 0 && (
                      <div className="fb-pinned-badge">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                          <path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z"/>
                        </svg>
                        Pinned Post
                      </div>
                    )}
                    
                    {/* Card Header */}
                    <div className="fb-card-header">
                      <div className="fb-card-avatar">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                        </svg>
                      </div>
                      <div className="fb-card-meta">
                        <div className="fb-card-author">
                          {item.postedBy || 'HUSU News'}
                          {item.affair && <span className="fb-affair-tag"> • {item.affair}</span>}
                        </div>
                        <div className="fb-card-time">
                          {timeAgo(item.createdAt || item.date)} • <CatBadge cat={item.category} />
                        </div>
                      </div>
                      <button className="fb-menu-btn">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
                        </svg>
                      </button>
                    </div>

                    {/* Card Body */}
                    <div className="fb-card-body">
                      <h2 className="fb-card-title">{item.title}</h2>
                      <p className="fb-card-text">
                        {expanded === item.id 
                          ? cleanSummary(item.summary, 1000)
                          : cleanSummary(item.summary, 200)
                        }
                      </p>
                      {item.summary && item.summary.length > 200 && (
                        <button 
                          className="fb-see-more"
                          onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                        >
                          {expanded === item.id ? 'See less' : 'See more'}
                        </button>
                      )}
                    </div>

                    {/* Image */}
                    {item.image && item.image.trim() && (
                      <div className="fb-card-img">
                        <img 
                          src={item.image} 
                          alt={item.title}
                          onError={(e) => {
                            console.error('Image failed to load:', item.image, 'for news:', item.id)
                            e.target.style.display = 'none'
                          }}
                          onLoad={() => console.log('Image loaded successfully:', item.image)}
                        />
                      </div>
                    )}

                    {/* Reaction Bar */}
                    <div className="fb-reactions-bar">
                      <div className="fb-reactions-summary">
                        <div className="fb-reaction-icons">
                          <span className="fb-reaction-icon" style={{ background: '#1877f2' }}>👍</span>
                          <span className="fb-reaction-icon" style={{ background: '#f33e58' }}>❤️</span>
                        </div>
                        <span className="fb-reaction-count">{likeCount[item.id] || 0}</span>
                      </div>
                      <div className="fb-engagement-summary">
                        <span onClick={() => handleCommentClick(item.id)} style={{ cursor: 'pointer' }}>
                          {(comments[item.id] || []).length} comment{(comments[item.id] || []).length !== 1 ? 's' : ''}
                        </span>
                        <span>{Math.floor(Math.random() * 15) + 5} shares</span>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="fb-card-footer">
                      <button 
                        className={`fb-action-btn${liked[item.id] ? ' active' : ''}`}
                        onClick={() => toggleLike(item.id)}
                      >
                        <svg viewBox="0 0 24 24" fill={liked[item.id] ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                        </svg>
                        {liked[item.id] ? 'Liked' : 'Like'}
                      </button>
                      <button 
                        className={`fb-action-btn${showComments === item.id ? ' active' : ''}`}
                        onClick={() => handleCommentClick(item.id)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        Comment
                      </button>
                      <button className="fb-action-btn" onClick={() => handleShare(item)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                        </svg>
                        Share
                      </button>
                    </div>

                    {/* Comment Section */}
                    {showComments === item.id && (
                      <div className="fb-comments-section">
                        <div className="fb-comments-list">
                          {(comments[item.id] || []).map(comment => (
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
                          {(comments[item.id] || []).length === 0 && (
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
                              onKeyPress={e => e.key === 'Enter' && handleAddComment(item.id)}
                            />
                            <button 
                              className="fb-comment-send"
                              onClick={() => handleAddComment(item.id)}
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
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fb-share-modal-overlay" onClick={() => setShowShareModal(null)}>
          <div className="fb-share-modal" onClick={e => e.stopPropagation()}>
            <button className="fb-share-close" onClick={() => setShowShareModal(null)}>×</button>
            <h3>Share this article</h3>
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
