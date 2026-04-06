import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { User, Mail, Award, Calendar, Edit2, Save, X, Shield, Trophy, Target } from 'lucide-react'

function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
  })

  const handleSave = async () => {
    await updateProfile(formData)
    setIsEditing(false)
  }

  const achievements = [
    { id: 1, name: 'First Blood', description: 'Completed first pentest', icon: Target, earned: true },
    { id: 2, name: 'Bug Hunter', description: 'Found 10 vulnerabilities', icon: Shield, earned: true },
    { id: 3, name: 'Quiz Master', description: 'Scored 100% on 5 quizzes', icon: Trophy, earned: false },
    { id: 4, name: 'Speed Runner', description: 'Completed a pentest in under 5 minutes', icon: Award, earned: false },
  ]

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="glass-card p-8 mb-8 text-center">
          <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <User className="w-16 h-16 text-white" />
          </div>
          
          {isEditing ? (
            <div className="space-y-4 max-w-md mx-auto">
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 rounded-lg text-white border border-white/20 focus:border-purple-500 focus:outline-none"
                placeholder="Full Name"
              />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 rounded-lg text-white border border-white/20 focus:border-purple-500 focus:outline-none"
                placeholder="Email"
              />
              <div className="flex gap-2 justify-center">
                <button onClick={handleSave} className="px-4 py-2 bg-green-500 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2">
                  <Save className="w-4 h-4" /> Save
                </button>
                <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2">
                  <X className="w-4 h-4" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-3xl font-bold text-white mb-2">{user?.full_name || user?.username}</h2>
              <p className="text-gray-300 flex items-center justify-center gap-2 mb-4">
                <Mail className="w-4 h-4" />
                {user?.email}
              </p>
              <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center gap-2">
                <Edit2 className="w-4 h-4" /> Edit Profile
              </button>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card p-6 text-center">
            <div className="text-3xl font-bold gradient-text mb-1">15</div>
            <div className="text-gray-300">Modules Completed</div>
          </div>
          <div className="glass-card p-6 text-center">
            <div className="text-3xl font-bold gradient-text mb-1">1,250</div>
            <div className="text-gray-300">Total XP</div>
          </div>
          <div className="glass-card p-6 text-center">
            <div className="text-3xl font-bold gradient-text mb-1">Top 15%</div>
            <div className="text-gray-300">Global Rank</div>
          </div>
        </div>

        {/* Achievements */}
        <div className="glass-card p-8">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Award className="w-6 h-6 text-purple-400" />
            Achievements
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {achievements.map((achievement) => (
              <div key={achievement.id} className={`p-4 rounded-xl flex items-center gap-4 ${achievement.earned ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-white/5'}`}>
                <div className={`p-2 rounded-lg ${achievement.earned ? 'bg-purple-500' : 'bg-gray-600'}`}>
                  <achievement.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-semibold">{achievement.name}</h4>
                  <p className="text-sm text-gray-400">{achievement.description}</p>
                </div>
                {achievement.earned && <CheckCircle className="w-5 h-5 text-green-400 ml-auto" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage