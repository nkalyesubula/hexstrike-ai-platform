import React, { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import Navbar from './components/Common/Navbar'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

// Lazy load components
const Dashboard = lazy(() => import('./pages/DashboardPage'))
const LabPage = lazy(() => import('./pages/LabPage'))
const LearnPage = lazy(() => import('./pages/LearnPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))

function HomePage() {
  const [backendStatus, setBackendStatus] = React.useState('checking...')

  React.useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setBackendStatus('✅ Connected: ' + data.status))
      .catch(err => setBackendStatus('❌ Backend not reachable'))
  }, [])

  return (
    <div style={{
      minHeight: 'calc(100vh - 60px)',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      color: 'white'
    }}>
      <div>
        <h1 style={{ fontSize: '56px', marginBottom: '20px' }}>🚀 HexStrike AI</h1>
        <p style={{ fontSize: '20px', marginBottom: '10px' }}>
          AI-Powered Cybersecurity Learning Platform
        </p>
        <p style={{ fontSize: '14px', marginBottom: '30px', opacity: 0.8 }}>
          Backend: {backendStatus}
        </p>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          <a href="/login" style={{
            background: '#6c63ff',
            color: 'white',
            padding: '12px 24px',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: 'bold'
          }}>
            Login to Start
          </a>
          <a href="/register" style={{
            background: 'transparent',
            color: 'white',
            padding: '12px 24px',
            textDecoration: 'none',
            borderRadius: '8px',
            border: '2px solid white',
            fontWeight: 'bold'
          }}>
            Create Account
          </a>
        </div>
      </div>
    </div>
  )
}

function AppContent() {
  return (
    <Router>
      <Navbar />
      <Suspense fallback={
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: '#1a1a2e',
          color: 'white'
        }}>
          Loading...
        </div>
      }>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/lab" element={
            <ProtectedRoute>
              <LabPage />
            </ProtectedRoute>
          } />
          <Route path="/learn" element={
            <ProtectedRoute>
              <LearnPage />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
        </Routes>
      </Suspense>
    </Router>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
