import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
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
      const success = await login(formData.username, formData.password)
      if (!success) {
        throw new Error('Incorrect username or password')
      }
      navigate('/dashboard')
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
