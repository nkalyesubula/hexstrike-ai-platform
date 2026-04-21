import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Shield, LayoutDashboard, FlaskConical, BookOpen, User, LogOut, Menu, X, Home } from 'lucide-react'

function Navbar() {
  const { isAuthenticated, logout, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true
    if (path !== '/' && location.pathname.startsWith(path)) return true
    return false
  }

  const navLinks = [
    { path: '/dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { path: '/lab', name: 'Pentest Lab', icon: FlaskConical },
    { path: '/learn', name: 'Learn', icon: BookOpen },
    { path: '/profile', name: 'Profile', icon: User },
  ]

  const getLinkStyle = (path) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '8px',
    textDecoration: 'none',
    transition: 'all 0.2s',
    background: isActive(path) ? '#6c63ff' : 'transparent',
    color: isActive(path) ? 'white' : '#e0e0e0',
    fontWeight: isActive(path) ? '600' : '400'
  })

  // If not authenticated, only show minimal navbar with logo and auth buttons
  if (!isAuthenticated) {
    return (
      <nav style={{
        background: '#1a1a2e',
        padding: '12px 24px',
        borderBottom: '1px solid #333',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #6c63ff, #a855f7)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Shield size={20} color="white" />
            </div>
            <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>
              HexStrike<span style={{ color: '#6c63ff' }}>AI</span>
            </span>
          </Link>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to="/login" style={{
              padding: '8px 20px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: 'white',
              transition: 'all 0.2s'
            }}>
              Login
            </Link>
            <Link to="/register" style={{
              padding: '8px 20px',
              borderRadius: '8px',
              textDecoration: 'none',
              background: '#6c63ff',
              color: 'white',
              transition: 'all 0.2s'
            }}>
              Sign Up
            </Link>
          </div>
        </div>
      </nav>
    )
  }

  // Authenticated user navbar
  return (
    <nav style={{
      background: '#1a1a2e',
      padding: '12px 24px',
      borderBottom: '1px solid #333',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap'
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #6c63ff, #a855f7)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Shield size={20} color="white" />
          </div>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>
            HexStrike<span style={{ color: '#6c63ff' }}>AI</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div style={{ 
          display: windowWidth < 768 ? 'none' : 'flex', 
          alignItems: 'center', 
          gap: '8px' 
        }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <Link to="/" style={getLinkStyle('/')}>
              <Home size={18} />
              <span>Home</span>
            </Link>
            {navLinks.map((link) => {
              const Icon = link.icon
              const active = isActive(link.path)
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    background: active ? '#6c63ff' : 'transparent',
                    color: active ? 'white' : '#e0e0e0',
                    fontWeight: active ? '600' : '400'
                  }}
                >
                  <Icon size={18} />
                  <span>{link.name}</span>
                </Link>
              )
            })}
          </div>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            marginLeft: '16px',
            paddingLeft: '16px',
            borderLeft: '1px solid #333'
          }}>
            <span style={{ fontSize: '14px', color: '#888' }}>
              👋 <span style={{ color: '#6c63ff' }}>{user?.username}</span>
            </span>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#ef444420',
                color: '#ef4444',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{
            display: windowWidth >= 768 ? 'none' : 'block',
            background: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && windowWidth < 768 && (
        <div style={{
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid #333'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} style={getLinkStyle('/')}>
              <Home size={18} />
              Home
            </Link>
            {navLinks.map((link) => {
              const Icon = link.icon
              const active = isActive(link.path)
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    background: active ? '#6c63ff' : 'transparent',
                    color: active ? 'white' : '#e0e0e0'
                  }}
                >
                  <Icon size={18} />
                  {link.name}
                </Link>
              )
            })}
            <button
              onClick={() => {
                handleLogout()
                setIsMobileMenuOpen(false)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#ef444420',
                color: '#ef4444',
                border: 'none',
                padding: '12px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
