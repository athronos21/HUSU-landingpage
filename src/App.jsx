import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import BackToTop from './components/BackToTop'
import AnnouncementBanner from './components/AnnouncementBanner'
import ProtectedRoute from './dashboard/ProtectedRoute'

// Public pages
const Home     = lazy(() => import('./pages/Home'))
const About    = lazy(() => import('./pages/About'))
const News     = lazy(() => import('./pages/News'))
const Events   = lazy(() => import('./pages/Events'))
const Affairs  = lazy(() => import('./pages/Affairs'))
const Contact  = lazy(() => import('./pages/Contact'))
const Election = lazy(() => import('./pages/Election'))
const NotFound = lazy(() => import('./pages/NotFound'))

// Dashboard pages
const Login              = lazy(() => import('./dashboard/Login'))
const ChangePassword     = lazy(() => import('./dashboard/ChangePassword'))
const DashboardLayout    = lazy(() => import('./dashboard/DashboardLayout'))
const Overview           = lazy(() => import('./dashboard/Overview'))
const ManageSiteSettings = lazy(() => import('./dashboard/ManageSiteSettings'))
const ManageNews         = lazy(() => import('./dashboard/ManageNews'))
const ManageEvents       = lazy(() => import('./dashboard/ManageEvents'))
const ManageAffairs      = lazy(() => import('./dashboard/ManageAffairs'))
const ManageTeam         = lazy(() => import('./dashboard/ManageTeam'))
const ManageContact      = lazy(() => import('./dashboard/ManageContact'))
const ManageUsers        = lazy(() => import('./dashboard/ManageUsers'))
const MyProfile          = lazy(() => import('./dashboard/MyProfile'))
const Letters            = lazy(() => import('./dashboard/Letters'))
const Messages           = lazy(() => import('./dashboard/Messages'))
const ManageElections    = lazy(() => import('./dashboard/ManageElections'))
const Vote               = lazy(() => import('./dashboard/Vote'))

const pageTitles = {
  '/':         'Home',
  '/about':    'About Us',
  '/affairs':  'Affairs',
  '/news':     'News & Announcements',
  '/events':   'Events & Activities',
  '/contact':  'Contact Us',
  '/login':    'Login',
  '/dashboard':'Dashboard',
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
      minHeight: '60vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'linear-gradient(135deg,#060d1a 0%,#0f2040 100%)',
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

function PublicLayout({ children }) {
  return (
    <>
      <AnnouncementBanner />
      <Navbar />
      <main>{children}</main>
      <Footer />
      <BackToTop />
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ScrollToTop />
        <PageTitle />
        <Suspense fallback={<PageLoader />}>
          <Routes>

            {/* ── Public pages ── */}
            <Route path="/"        element={<PublicLayout><Home /></PublicLayout>} />
            <Route path="/about"   element={<PublicLayout><About /></PublicLayout>} />
            <Route path="/news"    element={<PublicLayout><News /></PublicLayout>} />
            <Route path="/events"  element={<PublicLayout><Events /></PublicLayout>} />
            <Route path="/affairs" element={<PublicLayout><Affairs /></PublicLayout>} />
            <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
            <Route path="/election" element={<PublicLayout><Election /></PublicLayout>} />

            {/* ── Auth ── */}
            <Route path="/login" element={<Login />} />
            <Route path="/change-password" element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            } />

            {/* ── Dashboard ── */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Overview />} />
              <Route path="site"    element={<ProtectedRoute allowedRoles={['admin']}><ManageSiteSettings /></ProtectedRoute>} />
              <Route path="news"    element={<ProtectedRoute allowedRoles={['admin','news_org','affair_head','assoc_head','president','vice_president','general_secretary','general_speaker','general_auditor']}><ManageNews /></ProtectedRoute>} />
              <Route path="events"  element={<ProtectedRoute allowedRoles={['admin','events_org','affair_head','assoc_head','president','vice_president','general_secretary','general_speaker','general_auditor']}><ManageEvents /></ProtectedRoute>} />
              <Route path="affairs" element={<ProtectedRoute allowedRoles={['admin','affair_head','assoc_head']}><ManageAffairs /></ProtectedRoute>} />
              <Route path="team"    element={<ProtectedRoute allowedRoles={['admin']}><ManageTeam /></ProtectedRoute>} />
              <Route path="contact" element={<ProtectedRoute allowedRoles={['admin']}><ManageContact /></ProtectedRoute>} />
              <Route path="users"    element={<ProtectedRoute allowedRoles={['admin']}><ManageUsers /></ProtectedRoute>} />
              <Route path="profile"   element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />
              <Route path="letters"   element={<ProtectedRoute><Letters /></ProtectedRoute>} />
              <Route path="messages"  element={<ProtectedRoute><Messages /></ProtectedRoute>} />
              <Route path="elections" element={<ProtectedRoute allowedRoles={['admin']}><ManageElections /></ProtectedRoute>} />
              <Route path="vote"      element={<ProtectedRoute allowedRoles={['admin']}><Vote /></ProtectedRoute>} />
            </Route>

            <Route path="*" element={<PublicLayout><NotFound /></PublicLayout>} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
