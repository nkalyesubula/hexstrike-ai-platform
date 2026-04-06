import React, { useState } from 'react'
import { BookOpen, Zap, Award, Clock, ChevronRight, Star, TrendingUp } from 'lucide-react'
import QuizModule from '../components/Learning/QuizModule'
import Flashcards from '../components/Learning/Flashcards'
import LearningPath from '../components/Learning/LearningPath'

function LearnPage() {
  const [selectedModule, setSelectedModule] = useState(null)
  const [activeSubTab, setActiveSubTab] = useState('path')

  const modules = [
    { id: 1, name: 'Network Reconnaissance', progress: 100, xp: 100, difficulty: 'Beginner', duration: '2 hours' },
    { id: 2, name: 'Vulnerability Scanning', progress: 75, xp: 150, difficulty: 'Beginner', duration: '3 hours' },
    { id: 3, name: 'Web Application Security', progress: 50, xp: 200, difficulty: 'Intermediate', duration: '4 hours' },
    { id: 4, name: 'Privilege Escalation', progress: 25, xp: 250, difficulty: 'Advanced', duration: '5 hours' },
    { id: 5, name: 'Wireless Security', progress: 0, xp: 200, difficulty: 'Intermediate', duration: '3 hours' },
  ]

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Learning Center</h1>
        <p className="text-gray-300 text-lg">Master cybersecurity at your own pace</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Sidebar - Modules */}
        <div className="lg:col-span-1">
          <div className="glass-card p-6 sticky top-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-purple-400" />
              Learning Modules
            </h2>
            <div className="space-y-3">
              {modules.map((module) => (
                <button
                  key={module.id}
                  onClick={() => setSelectedModule(module)}
                  className={`w-full text-left p-4 rounded-xl transition-all ${
                    selectedModule?.id === module.id
                      ? 'bg-gradient-to-r from-purple-600/50 to-pink-600/50 border border-purple-500'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-white font-semibold">{module.name}</h3>
                    <span className="text-sm text-purple-400">{module.xp} XP</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {module.duration}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      module.difficulty === 'Beginner' ? 'bg-green-500/20 text-green-400' :
                      module.difficulty === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {module.difficulty}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                      style={{ width: `${module.progress}%` }}
                    ></div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2">
          {selectedModule ? (
            <div className="glass-card p-6">
              <div className="flex gap-4 mb-6 border-b border-white/10">
                <button
                  onClick={() => setActiveSubTab('path')}
                  className={`px-4 py-2 transition-all ${activeSubTab === 'path' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'}`}
                >
                  Learning Path
                </button>
                <button
                  onClick={() => setActiveSubTab('quiz')}
                  className={`px-4 py-2 transition-all ${activeSubTab === 'quiz' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'}`}
                >
                  Quiz
                </button>
                <button
                  onClick={() => setActiveSubTab('flashcards')}
                  className={`px-4 py-2 transition-all ${activeSubTab === 'flashcards' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'}`}
                >
                  Flashcards
                </button>
              </div>

              {activeSubTab === 'path' && <LearningPath module={selectedModule} />}
              {activeSubTab === 'quiz' && <QuizModule moduleId={selectedModule.id} />}
              {activeSubTab === 'flashcards' && <Flashcards topic={selectedModule.name} />}
            </div>
          ) : (
            <div className="glass-card p-12 text-center">
              <Zap className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Select a Module to Begin</h3>
              <p className="text-gray-300">Choose a learning module from the sidebar to start your journey</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LearnPage