import { news } from '../data/data'
import { TelegramIcon } from '../components/SocialIcons'
import './News.css'

const TELEGRAM_CHANNEL = 'HUSUNews'

const categoryColors = {
  Announcement: { bg: '#1a3a6b22', color: '#4a7fd4', border: '#1a3a6b44' },
  Academic:     { bg: '#05966922', color: '#10b981', border: '#05966944' },
  Service:      { bg: '#e8a02022', color: '#e8a020', border: '#e8a02044' },
  Discipline:   { bg: '#7c3aed22', color: '#a78bfa', border: '#7c3aed44' },
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export default function News() {
  return (
    <div className="news-page">

      {/* Hero */}
      <section className="page-hero news-hero">
        <div className="news-hero-bg" />
        <div className="container">
          <p className="page-hero-sub">Stay Informed</p>
          <h1>News &amp; Announcements</h1>
          <p>The latest updates, announcements, and news from Haramaya University Students' Union.</p>
        </div>
      </section>

      {/* News list */}
      <section className="section news-section">
        <div className="container">

          <div className="news-top-row">
            <div>
              <p className="section-subtitle">Latest Updates</p>
              <h2 className="section-title">Recent News</h2>
              <div className="accent-bar" />
            </div>
            <a
              href={`https://t.me/${TELEGRAM_CHANNEL}`}
              target="_blank"
              rel="noreferrer"
              className="tg-follow-btn"
            >
              <TelegramIcon size={18} />
              Follow on Telegram
            </a>
          </div>

          <div className="news-list">
            {news.map((item, i) => {
              const cat = categoryColors[item.category] || categoryColors.Announcement
              return (
                <article key={item.id} className="news-card">
                  <div className="nc-index">{String(i + 1).padStart(2, '0')}</div>
                  <div className="nc-body">
                    <div className="nc-meta">
                      <span
                        className="nc-category"
                        style={{ background: cat.bg, color: cat.color, borderColor: cat.border }}
                      >
                        {item.category}
                      </span>
                      <span className="nc-date">{formatDate(item.date)}</span>
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.summary}</p>
                  </div>
                  <div className="nc-accent" />
                </article>
              )
            })}
          </div>

          {/* Telegram CTA */}
          <div className="news-tg-cta">
            <TelegramIcon size={32} />
            <div>
              <h4>Get real-time updates</h4>
              <p>Follow our Telegram channel for instant news and announcements.</p>
            </div>
            <a
              href={`https://t.me/${TELEGRAM_CHANNEL}`}
              target="_blank"
              rel="noreferrer"
              className="tg-follow-btn"
            >
              Join Channel
            </a>
          </div>

        </div>
      </section>
    </div>
  )
}
