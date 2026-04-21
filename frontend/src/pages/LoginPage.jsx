import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

function LoginPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('1. Logging in as:', formData.username)
      
      // Login request
      const loginResponse = await fetch('/api/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: formData.username,
          password: formData.password
        })
      })

      const loginData = await loginResponse.json()
      console.log('2. Login response:', loginResponse.status)

      if (!loginResponse.ok) {
        throw new Error(loginData.detail || 'Login failed')
      }

      const token = loginData.access_token
      console.log('3. Token received, length:', token.length)
      
      // Store token
      localStorage.setItem('access_token', token)
      
      // Test if token is stored correctly
      const storedToken = localStorage.getItem('access_token')
      console.log('4. Token stored, retrieved length:', storedToken?.length)
      
      // Now make the me request with explicit headers
      console.log('5. Fetching /api/auth/me...')
      const meResponse = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('6. Me response status:', meResponse.status)
      console.log('7. Me response headers:', [...meResponse.headers.entries()])

      if (!meResponse.ok) {
        const errorText = await meResponse.text()
        console.error('8. Me endpoint error:', errorText)
        throw new Error(`Failed to get user info: ${meResponse.status}`)
      }

      const userData = await meResponse.json()
      console.log('9. User data received:', userData)
      
      localStorage.setItem('user', JSON.stringify(userData))
      
      // Redirect
      window.location.href = '/dashboard'
      
    } catch (err) {
      console.error('Login error:', err)
      setError(err.message || 'Login failed. Please try again.')
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 60px)',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#1a1a2e',
        padding: '40px',
        borderRadius: '10px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{
          fontSize: '28px',
          color: 'white',
          marginBottom: '10px',
          textAlign: 'center'
        }}>Welcome Back</h1>
        <p style={{
          color: '#888',
          textAlign: 'center',
          marginBottom: '30px'
        }}>Sign in to continue learning</p>

        {error && (
          <div style={{
            background: '#ff6b6b20',
            border: '1px solid #ff6b6b',
            color: '#ff6b6b',
            padding: '10px',
            borderRadius: '5px',
            marginBottom: '20px',
            textAlign: 'center',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: '#888', display: 'block', marginBottom: '5px' }}>
              Username
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              style={{
                width: '100%',
                padding: '10px',
                background: '#0f3460',
                border: 'none',
                color: 'white',
                borderRadius: '5px',
                fontSize: '16px'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: '#888', display: 'block', marginBottom: '5px' }}>
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              style={{
                width: '100%',
                padding: '10px',
                background: '#0f3460',
                border: 'none',
                color: 'white',
                borderRadius: '5px',
                fontSize: '16px'
              }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: '#6c63ff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          marginTop: '20px',
          color: '#888'
        }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#6c63ff', textDecoration: 'none' }}>
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
