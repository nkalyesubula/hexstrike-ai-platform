import React, { useState, useEffect } from 'react'
import { Award, Brain, Target, TrendingUp, Bug, Activity, Clock, Shield, AlertTriangle } from 'lucide-react'

function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [recentSessions, setRecentSessions] = useState([])
  const [achievements, setAchievements] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchWithAuth = async (endpoint) => {
    const token = localStorage.getItem('access_token')
    const response = await fetch(endpoint, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (response.status === 401) {
      window.location.href = '/login'
      throw new Error('Unauthorized')
    }
    return response.json()
  }

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsData, sessionsData, achievementsData] = await Promise.all([
        fetchWithAuth('/api/analytics/stats'),
        fetchWithAuth('/api/tools/history?limit=5'),
        fetchWithAuth('/api/analytics/achievements')
      ])
      setStats(statsData)
      setRecentSessions(sessionsData)
      setAchievements(achievementsData)
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#1a1a2e',
        color: 'white'
      }}>
        Loading dashboard...
      </div>
    )
  }

  const statsCards = [
    { title: 'Total XP', value: stats?.total_experience_points || 0, icon: Award, color: '#f59e0b' },
    { title: 'Modules Done', value: stats?.completed_modules || 0, icon: Brain, color: '#8b5cf6' },
    { title: 'Pentests', value: stats?.successful_sessions || 0, icon: Target, color: '#10b981' },
    { title: 'Findings', value: stats?.total_findings || 0, icon: Bug, color: '#ef4444' },
    { title: 'Avg Quiz Score', value: `${stats?.average_quiz_score?.toFixed(0) || 0}%`, icon: TrendingUp, color: '#3b82f6' },
  ]

  return (
    <div style={{
      padding: '40px',
      background: '#1a1a2e',
      minHeight: '100vh',
      color: 'white'
    }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '10px' }}>Dashboard</h1>
        <p style={{ color: '#888' }}>Track your cybersecurity learning progress</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {statsCards.map((card, idx) => {
          const Icon = card.icon
          return (
            <div key={idx} style={{
              background: '#16213e',
              padding: '20px',
              borderRadius: '10px',
              borderLeft: `4px solid ${card.color}`,
              transition: 'transform 0.2s'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ color: '#888', fontSize: '14px' }}>{card.title}</p>
                  <p style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '10px' }}>{card.value}</p>
                </div>
                <Icon size={40} color={card.color} />
              </div>
            </div>
          )
        })}
      </div>

      <div style={{
        background: '#16213e',
        padding: '20px',
        borderRadius: '10px',
        marginBottom: '30px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Recent Pentest Sessions</h3>
          <Activity size={20} color="#6c63ff" />
        </div>
        
        {recentSessions.length === 0 ? (
          <div style={{ color: '#888', textAlign: 'center', padding: '40px' }}>
            No pentest sessions yet. Go to the Pentest Lab to start your first scan!
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>Target</th>
                  <th style={{ padding: '10px' }}>Date</th>
                  <th style={{ padding: '10px' }}>Findings</th>
                  <th style={{ padding: '10px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentSessions.map(session => (
                  <tr key={session.id} style={{ borderBottom: '1px solid #333' }}>
                    <td style={{ padding: '10px' }}>{session.target}</td>
                    <td style={{ padding: '10px' }}>{new Date(session.started_at).toLocaleDateString()}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{
                        background: session.findings_count > 0 ? '#ef444420' : '#10b98120',
                        color: session.findings_count > 0 ? '#ef4444' : '#10b981',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}>
                        {session.findings_count} findings
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span style={{
                        background: session.status === 'completed' ? '#10b98120' : '#f59e0b20',
                        color: session.status === 'completed' ? '#10b981' : '#f59e0b',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}>
                        {session.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{
        background: '#16213e',
        padding: '20px',
        borderRadius: '10px'
      }}>
        <h3 style={{ marginBottom: '20px' }}>🏆 Achievements</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px'
        }}>
          {achievements.map(achievement => (
            <div key={achievement.id} style={{
              background: achievement.earned ? '#10b98120' : '#ffffff10',
              padding: '15px',
              borderRadius: '8px',
              border: achievement.earned ? '1px solid #10b981' : '1px solid #333',
              opacity: achievement.earned ? 1 : 0.5
            }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>{achievement.icon}</div>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{achievement.name}</div>
              <div style={{ fontSize: '12px', color: '#888' }}>{achievement.description}</div>
              {achievement.progress && (
                <div style={{
                  marginTop: '10px',
                  fontSize: '11px',
                  color: '#6c63ff'
                }}>
                  Progress: {achievement.progress}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
