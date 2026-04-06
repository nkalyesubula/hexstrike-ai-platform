import React, { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { TrendingUp, Calendar, Filter } from 'lucide-react'
import { api } from '../../services/api'

function ProgressChart() {
  const [timeRange, setTimeRange] = useState('week')
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChartData()
  }, [timeRange])

  const fetchChartData = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/api/analytics/progress?range=${timeRange}`)
      setChartData(response.data)
    } catch (error) {
      console.error('Failed to fetch chart data:', error)
      // Mock data
      const mockData = {
        week: [
          { name: 'Mon', score: 65, modules: 1, time: 45 },
          { name: 'Tue', score: 72, modules: 2, time: 90 },
          { name: 'Wed', score: 78, modules: 1, time: 60 },
          { name: 'Thu', score: 85, modules: 3, time: 120 },
          { name: 'Fri', score: 88, modules: 2, time: 75 },
          { name: 'Sat', score: 90, modules: 1, time: 30 },
          { name: 'Sun', score: 92, modules: 2, time: 105 }
        ],
        month: [
          { name: 'Week 1', score: 65, modules: 5, time: 300 },
          { name: 'Week 2', score: 72, modules: 7, time: 420 },
          { name: 'Week 3', score: 78, modules: 6, time: 360 },
          { name: 'Week 4', score: 85, modules: 8, time: 480 }
        ],
        year: [
          { name: 'Jan', score: 55, modules: 12, time: 720 },
          { name: 'Feb', score: 62, modules: 15, time: 900 },
          { name: 'Mar', score: 68, modules: 18, time: 1080 },
          { name: 'Apr', score: 72, modules: 20, time: 1200 },
          { name: 'May', score: 75, modules: 22, time: 1320 },
          { name: 'Jun', score: 78, modules: 25, time: 1500 }
        ]
      }
      setChartData(mockData[timeRange] || mockData.week)
    } finally {
      setLoading(false)
    }
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-white/10 rounded-lg p-3 shadow-xl">
          <p className="text-white font-semibold mb-2">{label}</p>
          {payload.map((p, idx) => (
            <p key={idx} className="text-sm" style={{ color: p.color }}>
              {p.name}: {p.value} {p.unit || ''}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center justify-center h-80">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            Learning Progress
          </h3>
          <p className="text-sm text-gray-400 mt-1">Track your improvement over time</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange('week')}
            className={`px-3 py-1 rounded-lg text-sm transition-all ${
              timeRange === 'week'
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-3 py-1 rounded-lg text-sm transition-all ${
              timeRange === 'month'
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setTimeRange('year')}
            className={`px-3 py-1 rounded-lg text-sm transition-all ${
              timeRange === 'year'
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            Year
          </button>
        </div>
      </div>

      {/* Quiz Score Trend */}
      <div className="mb-8">
        <h4 className="text-white font-medium mb-3">Quiz Performance Trend</h4>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="score" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              fill="url(#scoreGradient)"
              name="Quiz Score"
              unit="%"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Modules Completed */}
      <div>
        <h4 className="text-white font-medium mb-3">Modules Completed</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="modules" 
              fill="#ec4899" 
              radius={[4, 4, 0, 0]}
              name="Modules Completed"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
        <div className="text-center">
          <p className="text-2xl font-bold text-white">
            {chartData.reduce((sum, d) => sum + (d.modules || 0), 0)}
          </p>
          <p className="text-xs text-gray-400">Total Modules</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-white">
            {(chartData.reduce((sum, d) => sum + (d.score || 0), 0) / chartData.length).toFixed(0)}%
          </p>
          <p className="text-xs text-gray-400">Avg Score</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-white">
            {Math.max(...chartData.map(d => d.score || 0))}%
          </p>
          <p className="text-xs text-gray-400">Peak Performance</p>
        </div>
      </div>
    </div>
  )
}

export default ProgressChart