import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import Navbar from './components/Common/Navbar'
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import LabPage from './pages/LabPage'
import LearnPage from './pages/LearnPage'
import ProfilePage from './pages/ProfilePage'

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <Navbar />
          <Toaster position="top-right" />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
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
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App