import React, { useState } from 'react'
import { Terminal, Play, AlertCircle, CheckCircle, Clock, Target, Code, Shield } from 'lucide-react'
import PentestConsole from '../components/PentestLab/PentestConsole'
import ToolExecutor from '../components/PentestLab/ToolExecutor'
import ResultsViewer from '../components/PentestLab/ResultsViewer'
import SessionHistory from '../components/PentestLab/SessionHistory'

function LabPage() {
  const [activeTab, setActiveTab] = useState('console')
  const [currentSession, setCurrentSession] = useState(null)

  const tabs = [
    { id: 'console', name: 'Pentest Console', icon: Terminal },
    { id: 'tools', name: 'Tool Executor', icon: Play },
    { id: 'results', name: 'Results', icon: AlertCircle },
    { id: 'history', name: 'History', icon: Clock },
  ]

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Penetration Testing Lab</h1>
        <p className="text-gray-300 text-lg">Execute real security tools with AI guidance</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-t-lg transition-all ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            {tab.name}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'console' && <PentestConsole onSessionStart={setCurrentSession} />}
        {activeTab === 'tools' && <ToolExecutor onExecutionComplete={(result) => console.log('Execution complete:', result)} />}
        {activeTab === 'results' && <ResultsViewer sessionId={currentSession?.id} />}
        {activeTab === 'history' && <SessionHistory onSelectSession={setCurrentSession} />}
      </div>

      {/* Safety Notice */}
      <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div>
            <p className="text-yellow-400 font-semibold">⚠️ Responsible Use Only</p>
            <p className="text-yellow-300/70 text-sm">These tools should only be used against systems you own or have explicit permission to test.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LabPage