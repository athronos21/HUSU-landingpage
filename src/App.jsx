import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import BackToTop from './components/BackToTop'
import AnnouncementBanner from './components/AnnouncementBanner'

const Home    = lazy(() => import('./pages/Home'))
const About   = lazy(() => import('./pages/About'))
const News    = lazy(() => import('./pages/News'))
const Events  = lazy(() => import('./pages/Events'))
const Affairs = lazy(() => import('./pages/Affairs'))
const Contact = lazy(() => import('./pages/Contact'))
const NotFound = lazy(() => import('./pages/NotFound'))

const pageTitles = {
  '/':        'Home',
  '/about':   'About Us',
  '/affairs': 'Affairs',
  '/news':    'News & Announcements',
  '/events':  'Events & Activities',
  '/contact': 'Contact Us',
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function PageTitle() {
  const { pathname } = useLocation()
  useEffect(() => {
    const title = pageTitles[pathname]
    document.title = title
      ? `${title} | Haramaya University Students' Union`
      : "Haramaya University Students' Union"
  }, [pathname])
  return null
}

function PageLoader() {
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #060d1a 0%, #0f2040 100%)',
    }}>
      <div style={{
        width: 40, height: 40,
        border: '3px solid rgba(232,160,32,0.2)',
        borderTopColor: '#e8a020',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <PageTitle />
      <AnnouncementBanner />
      <Navbar />
      <main>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/"        element={<Home />} />
            <Route path="/about"   element={<About />} />
            <Route path="/news"    element={<News />} />
            <Route path="/events"  element={<Events />} />
            <Route path="/affairs" element={<Affairs />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*"        element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <BackToTop />
    </BrowserRouter>
  )
}
