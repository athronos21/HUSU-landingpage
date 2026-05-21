import './News.css'

const TELEGRAM_CHANNEL = 'HUSUNews'

export default function News() {
  return (
    <div className="coming-soon-page">
      <div className="cs-content">
        <div className="cs-icon">📰</div>
        <span className="cs-label">News & Announcements</span>
        <h1>Coming Soon</h1>
        <p>We're setting up our official news channel. Stay tuned for the latest updates, announcements, and news from Haramaya University Students' Union.</p>
        <a
          href={`https://t.me/${TELEGRAM_CHANNEL}`}
          target="_blank"
          rel="noreferrer"
          className="cs-tg-btn"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 13.5l-2.95-.924c-.64-.203-.658-.64.136-.954l11.57-4.461c.537-.194 1.006.131.968.06z"/>
          </svg>
          Follow on Telegram
        </a>
      </div>
    </div>
  )
}
