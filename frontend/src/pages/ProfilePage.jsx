import React from 'react'
import { useAuth } from '../context/AuthContext'

function ProfilePage() {
  const { user } = useAuth()

  return (
    <div style={{
      padding: '40px',
      background: '#1a1a2e',
      minHeight: '100vh',
      color: 'white'
    }}>
      <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>👤 Profile</h1>
      
      <div style={{
        background: '#16213e',
        padding: '30px',
        borderRadius: '10px',
        maxWidth: '500px'
      }}>
        <div style={{
          width: '100px',
          height: '100px',
          background: '#6c63ff',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '48px',
          margin: '0 auto 20px'
        }}>
          {user?.username?.[0]?.toUpperCase() || 'U'}
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ color: '#888', fontSize: '12px' }}>Username</label>
          <p style={{ fontSize: '18px' }}>{user?.username}</p>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ color: '#888', fontSize: '12px' }}>Email</label>
          <p style={{ fontSize: '18px' }}>{user?.email}</p>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ color: '#888', fontSize: '12px' }}>Full Name</label>
          <p style={{ fontSize: '18px' }}>{user?.full_name || 'Not provided'}</p>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ color: '#888', fontSize: '12px' }}>Member Since</label>
          <p style={{ fontSize: '14px' }}>{new Date(user?.created_at).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
