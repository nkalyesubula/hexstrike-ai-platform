import React, { useState } from 'react'
import { CheckCircle, Circle, Play, Lock, Award, Clock, FileText } from 'lucide-react'

function LearningPath({ module }) {
  const [currentLesson, setCurrentLesson] = useState(0)

  const lessons = [
    { id: 1, title: 'Introduction', duration: '10 min', type: 'video', completed: true },
    { id: 2, title: 'Core Concepts', duration: '20 min', type: 'reading', completed: true },
    { id: 3, title: 'Hands-on Lab', duration: '30 min', type: 'lab', completed: false },
    { id: 4, title: 'Practice Exercise', duration: '15 min', type: 'exercise', completed: false },
    { id: 5, title: 'Assessment', duration: '10 min', type: 'quiz', completed: false },
  ]

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video': return <Play className="w-4 h-4" />
      case 'reading': return <FileText className="w-4 h-4" />
      case 'lab': return <Award className="w-4 h-4" />
      case 'exercise': return <Clock className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  return (
    <div>
      {/* Module Info */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">{module.name}</h3>
        <p className="text-gray-400">Master the fundamentals of {module.name.toLowerCase()}</p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Module Progress</span>
          <span>{Math.round((lessons.filter(l => l.completed).length / lessons.length) * 100)}%</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
            style={{ width: `${(lessons.filter(l => l.completed).length / lessons.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Lessons */}
      <div className="space-y-3">
        {lessons.map((lesson, idx) => (
          <div
            key={lesson.id}
            className={`flex items-center justify-between p-4 rounded-xl transition-all cursor-pointer ${
              idx === currentLesson
                ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-500'
                : 'bg-white/5 hover:bg-white/10'
            }`}
            onClick={() => setCurrentLesson(idx)}
          >
            <div className="flex items-center gap-4">
              {lesson.completed ? (
                <CheckCircle className="w-6 h-6 text-green-400" />
              ) : idx === currentLesson ? (
                <Play className="w-6 h-6 text-purple-400" />
              ) : (
                <Circle className="w-6 h-6 text-gray-500" />
              )}
              <div>
                <p className="text-white font-medium">{lesson.title}</p>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span className="flex items-center gap-1">{getTypeIcon(lesson.type)} {lesson.type}</span>
                  <span>•</span>
                  <span>{lesson.duration}</span>
                </div>
              </div>
            </div>
            {!lesson.completed && idx !== currentLesson && (
              <Lock className="w-4 h-4 text-gray-500" />
            )}
          </div>
        ))}
      </div>

      {/* Current Lesson Content */}
      {currentLesson === 2 && (
        <div className="mt-6 p-6 bg-black/50 rounded-xl">
          <h4 className="text-lg font-bold text-white mb-4">Hands-on Lab: Practical Exercise</h4>
          <div className="space-y-4">
            <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
              <p className="text-purple-300 font-semibold mb-2">Lab Environment Ready</p>
              <p className="text-gray-300 mb-3">Target VM: 192.168.56.101 (Metasploitable2)</p>
              <button className="px-4 py-2 bg-purple-600 rounded-lg text-white text-sm hover:bg-purple-700 transition-colors">
                Launch Lab Environment →
              </button>
            </div>
            <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
              <p className="text-blue-300 font-semibold mb-2">Learning Objectives</p>
              <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside">
                <li>Perform reconnaissance using Nmap</li>
                <li>Identify open ports and services</li>
                <li>Detect common vulnerabilities</li>
                <li>Generate a penetration test report</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {currentLesson === 4 && (
        <div className="mt-6 p-6 bg-black/50 rounded-xl">
          <h4 className="text-lg font-bold text-white mb-4">Module Assessment</h4>
          <p className="text-gray-300 mb-4">Test your knowledge with 10 multiple-choice questions</p>
          <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-semibold">
            Start Quiz →
          </button>
        </div>
      )}
    </div>
  )
}

export default LearningPath