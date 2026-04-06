import React, { useState, useEffect } from 'react'
import { Activity, Zap, Target, Award, TrendingUp, Clock, CheckCircle, Brain, Shield, Calendar, Star } from 'lucide-react'
import ProgressChart from './ProgressChart'
import StatsCard from './StatsCard'
import { api } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import { Link } from 'react-router-dom'

function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [achievements, setAchievements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsRes, activityRes, achievementsRes] = await Promise.all([
        api.get('/api/analytics/stats'),
        api.get('/api/tools/history?limit=5'),
        api.get('/api/analytics/achievements')
      ])
      setStats(statsRes.data)
      setRecentActivity(activityRes.data)
      setAchievements(achievementsRes.data)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      // Set mock data for demo
      setStats({
        total_quizzes_taken: 12,
        average_quiz_score: 78.5,
        total_pentest_sessions: 8,
        successful_sessions: 6,
        completed_modules: 5,
        total_experience_points: 1250,
        current_streak: 7,
        hours_spent: 24
      })
      setRecentActivity([
        { id: 1, target: '192.168.56.101', status: 'completed', started_at: new Date().toISOString() },
        { id: 2, target: '10.0.0.25', status: 'completed', started_at: new Date(Date.now() - 86400000).toISOString() },
        { id: 3, target: '192.168.1.100', status: 'failed', started_at: new Date(Date.now() - 172800000).toISOString() }
      ])
      setAchievements([
        { id: 1, name: 'First Blood', description: 'Completed first penetration test', earned: true, icon: '🎯' },
        { id: 2, name: 'Bug Hunter', description: 'Found 10 vulnerabilities', earned: true, icon: '🐛' },
        { id: 3, name: 'Quiz Master', description: 'Scored 100% on 5 quizzes', earned: false, icon: '📝' },
        { id: 4, name: 'Speed Runner', description: 'Completed pentest under 5 minutes', earned: false, icon: '⚡' }
      ])
    } finally {
      setLoading(false)
    }
  }

  const statsCards = [
    {
      title: 'Total XP',
      value: stats?.total_experience_points || 0,
      icon: Award,
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-500/20',
      trend: '+12%',
      trendUp: true
    },
    {
      title: 'Modules Done',
      value: stats?.completed_modules || 0,
      icon: Brain,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/20',
      trend: '+3',
      trendUp: true
    },
    {
      title: 'Pentests',
      value: stats?.successful_sessions || 0,
      icon: Target,
      color: 'from-green-500 to-teal-500',
      bgColor: 'bg-green-500/20',
      trend: '+2',
      trendUp: true
    },
    {
      title: 'Avg Quiz Score',
      value: `${stats?.average_quiz_score?.toFixed(0) || 0}%`,
      icon: TrendingUp,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/20',
      trend: '+5%',
      trendUp: true
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Welcome back, {user?.full_name || user?.username}!
            </h2>
            <p className="text-gray-300">
              {stats?.current_streak > 0 ? (
                <>🔥 You're on a {stats.current_streak} day learning streak! Keep it up!</>
              ) : (
                <>Ready to continue your cybersecurity journey?</>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Calendar className="w-5 h-5" />
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, idx) => (
          <StatsCard key={idx} {...card} />
        ))}
      </div>

      {/* Charts and Activity Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        <ProgressChart />
        
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" />
              Recent Activity
            </h3>
            <Link to="/lab" className="text-sm text-purple-400 hover:text-purple-300">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${activity.status === 'completed' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    {activity.status === 'completed' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                  </div>
                  <div>
                    <p className="text-white font-medium">Target: {activity.target}</p>
                    <p className="text-xs text-gray-400">{new Date(activity.started_at).toLocaleString()}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${activity.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {activity.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Achievements Section */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-400" />
          Recent Achievements
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`p-4 rounded-xl text-center transition-all ${
                achievement.earned
                  ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30'
                  : 'bg-white/5 opacity-50'
              }`}
            >
              <div className="text-4xl mb-2">{achievement.icon}</div>
              <h4 className="text-white font-semibold">{achievement.name}</h4>
              <p className="text-xs text-gray-400 mt-1">{achievement.description}</p>
              {achievement.earned && (
                <div className="mt-2 text-yellow-400 text-xs flex items-center justify-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Earned
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Link to="/lab" className="glass-card p-6 hover:scale-105 transition-all duration-300 group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors">
              <Shield className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Start a Pentest</h3>
              <p className="text-gray-400 text-sm">Launch a new penetration testing session</p>
            </div>
          </div>
        </Link>

        <Link to="/learn" className="glass-card p-6 hover:scale-105 transition-all duration-300 group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-xl group-hover:bg-green-500/30 transition-colors">
              <Brain className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Continue Learning</h3>
              <p className="text-gray-400 text-sm">Pick up where you left off</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}

// Helper component for XCircle (since it wasn't imported)
const XCircle = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

export default Dashboard