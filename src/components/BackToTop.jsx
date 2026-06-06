import { useState, useEffect } from 'react'
import './BackToTop.css'

export default function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <button
      className={`back-to-top${visible ? ' visible' : ''}`}
      onClick={scrollTop}
      aria-label="Back to top"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
        <path d="M18 15l-6-6-6 6"/>
      </svg>
    </button>
  )
}
