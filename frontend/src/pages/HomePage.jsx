import React from 'react'
import { Link } from 'react-router-dom'
import { Shield, Zap, BookOpen, Trophy, ArrowRight, Sparkles, Cpu, GraduationCap, Target } from 'lucide-react'

function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 px-6">
        <div className="container mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-purple-500/20 backdrop-blur-sm rounded-full px-4 py-2 mb-8 border border-purple-500/30 animate-pulse-slow">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span className="text-purple-300 text-sm">AI-Powered Learning Platform</span>
          </div>
          
          <h1 className="text-7xl md:text-8xl font-bold mb-6">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent animate-gradient">
              HexStrike AI
            </span>
          </h1>
          <p className="text-2xl text-gray-300 mb-4 max-w-3xl mx-auto">
            Learn Cybersecurity Through AI-Guided Penetration Testing
          </p>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12">
            Master real-world security skills with autonomous AI agents that explain every step
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-semibold text-lg hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/25">
              Start Learning Free
              <ArrowRight className="inline ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/demo" className="px-8 py-4 bg-white/10 backdrop-blur-sm rounded-xl text-white font-semibold text-lg hover:bg-white/20 transition-all duration-300 border border-white/20">
              Watch Demo
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative py-20 px-6 bg-black/30">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">
            <span className="gradient-text">Why Choose HexStrike AI?</span>
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-card p-8 text-center hover:scale-105 transition-all duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Cpu className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">AI-Powered Analysis</h3>
              <p className="text-gray-300">GPT-4o explains every vulnerability and suggests remediation steps in plain English</p>
            </div>
            
            <div className="glass-card p-8 text-center hover:scale-105 transition-all duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <GraduationCap className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Interactive Learning</h3>
              <p className="text-gray-300">Quizzes, flashcards, and hands-on labs make cybersecurity concepts stick</p>
            </div>
            
            <div className="glass-card p-8 text-center hover:scale-105 transition-all duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Real Tools, Safe Environment</h3>
              <p className="text-gray-300">Practice with 150+ professional pentesting tools in an isolated lab</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="relative py-20 px-6">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold gradient-text mb-2">150+</div>
              <div className="text-gray-300">Security Tools</div>
            </div>
            <div>
              <div className="text-5xl font-bold gradient-text mb-2">24/7</div>
              <div className="text-gray-300">AI Support</div>
            </div>
            <div>
              <div className="text-5xl font-bold gradient-text mb-2">1000+</div>
              <div className="text-gray-300">Practice Modules</div>
            </div>
            <div>
              <div className="text-5xl font-bold gradient-text mb-2">10k+</div>
              <div className="text-gray-300">Active Students</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-20 px-6">
        <div className="container mx-auto text-center">
          <div className="glass-card p-12 max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-white mb-4">Ready to Start Your Journey?</h2>
            <p className="text-xl text-gray-300 mb-8">Join thousands of students learning cybersecurity the smart way</p>
            <Link to="/register" className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-semibold text-lg hover:scale-105 transition-all duration-300">
              Get Started Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage