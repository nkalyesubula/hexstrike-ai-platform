import React, { useState, useEffect, useRef } from 'react'
import { Terminal, Play, Loader, History, Target, Search } from 'lucide-react'

function LabPage() {
  const [target, setTarget] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [output, setOutput] = useState([])
  const [selectedTools, setSelectedTools] = useState([])
  const [sessions, setSessions] = useState([])
  const [currentSessionId, setCurrentSessionId] = useState(null)
  const [availableTools, setAvailableTools] = useState({})
  const [toolCategories, setToolCategories] = useState([])
  const [loadingTools, setLoadingTools] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [currentProgress, setCurrentProgress] = useState(null)
  
  const announcedToolsRef = useRef(new Set())

  const fetchWithAuth = async (endpoint, options = {}) => {
    const token = localStorage.getItem('access_token')
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    })
    if (response.status === 401) {
      window.location.href = '/login'
      throw new Error('Unauthorized')
    }
    return response
  }

  useEffect(() => {
    fetchTools()
    fetchSessions()
    const interval = setInterval(fetchSessions, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchTools = async () => {
    try {
      const response = await fetchWithAuth('/api/tools/available')
      const data = await response.json()
      setAvailableTools(data.tools || {})
      setToolCategories(data.categories || [])
    } catch (err) {
      console.error('Error fetching tools:', err)
    } finally {
      setLoadingTools(false)
    }
  }

  const fetchSessions = async () => {
    try {
      const response = await fetchWithAuth('/api/tools/history?limit=10')
      const data = await response.json()
      setSessions(data || [])
    } catch (err) {
      console.error('Error fetching sessions:', err)
    }
  }

  useEffect(() => {
    if (!currentSessionId) return
    
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetchWithAuth(`/api/tools/session/${currentSessionId}`)
        const data = await response.json()
        
        if (data.progress) {
          setCurrentProgress(data.progress)
          const currentTool = data.progress.current_tool_name
          if (currentTool && !announcedToolsRef.current.has(currentTool)) {
            announcedToolsRef.current.add(currentTool)
            addOutput(`🔧 Running ${currentTool}...`, 'info')
          }
        }
        
        if (data.status === 'completed') {
          clearInterval(pollInterval)
          setIsRunning(false)
          addOutput(`✅ Scan completed successfully!`, 'success')
          
          if (data.formatted_findings && data.formatted_findings.length > 0) {
            addOutput(`\n📊 Found ${data.formatted_findings.length} findings:`, 'success')
            data.formatted_findings.forEach(finding => {
              let severityIcon = '🔵 INFO'
              if (finding.severity === 'critical') severityIcon = '🔴 CRITICAL'
              else if (finding.severity === 'high') severityIcon = '🟠 HIGH'
              else if (finding.severity === 'medium') severityIcon = '🟡 MEDIUM'
              
              addOutput(`  ${severityIcon}: ${finding.title}`, finding.severity)
              if (finding.description && finding.description !== finding.title) {
                addOutput(`     ${finding.description}`, 'info')
              }
              if (finding.ai_explanation) {
                addOutput(`     🤖 ${finding.ai_explanation}`, 'info')
              }
            })
          } else {
            addOutput(`ℹ️ No findings discovered`, 'info')
          }
          
          announcedToolsRef.current.clear()
          fetchSessions()
          setCurrentSessionId(null)
          setCurrentProgress(null)
        } else if (data.status === 'failed') {
          clearInterval(pollInterval)
          setIsRunning(false)
          addOutput(`❌ Scan failed: ${data.results?.error || 'Unknown error'}`, 'error')
          announcedToolsRef.current.clear()
          setCurrentSessionId(null)
          setCurrentProgress(null)
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 2000)
    
    return () => clearInterval(pollInterval)
  }, [currentSessionId])

  const addOutput = (message, type = 'info') => {
    setOutput(prev => [...prev, { message, type, timestamp: new Date() }])
  }

  const startPentest = async () => {
    if (!target) {
      addOutput('❌ Please enter a target IP or domain', 'error')
      return
    }

    if (selectedTools.length === 0) {
      addOutput('❌ Please select at least one tool', 'error')
      return
    }

    setIsRunning(true)
    setOutput([])
    announcedToolsRef.current.clear()
    addOutput(`🚀 Starting scan against ${target}`, 'success')
    addOutput(`📋 Selected tools: ${selectedTools.join(', ')}`, 'info')
    
    try {
      const response = await fetchWithAuth('/api/tools/batch', {
        method: 'POST',
        body: JSON.stringify({ target, tools: selectedTools, auto_mode: true })
      })
      const data = await response.json()
      setCurrentSessionId(data.session_id)
      addOutput(`✅ Session created: ID ${data.session_id}`, 'success')
    } catch (error) {
      addOutput(`❌ Error: ${error.message}`, 'error')
      setIsRunning(false)
    }
  }

  const toggleTool = (toolId) => {
    setSelectedTools(prev =>
      prev.includes(toolId) ? prev.filter(t => t !== toolId) : [...prev, toolId]
    )
  }

  const selectAllTools = () => {
    const allToolIds = Object.keys(availableTools)
    setSelectedTools(allToolIds)
    addOutput(`✅ Selected all ${allToolIds.length} tools`, 'success')
  }

  const clearSelection = () => {
    setSelectedTools([])
    addOutput(`Cleared tool selection`, 'info')
  }

  const clearOutput = () => {
    setOutput([])
  }

  const getFilteredTools = () => {
    let tools = Object.entries(availableTools)
    if (selectedCategory !== 'all') {
      tools = tools.filter(([_, tool]) => tool.category === selectedCategory)
    }
    if (searchTerm) {
      tools = tools.filter(([name, tool]) => 
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tool.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    return tools
  }

  if (loadingTools) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#1a1a2e', color: 'white' }}>
        Loading tools...
      </div>
    )
  }

  const filteredTools = getFilteredTools()
  const totalTools = Object.keys(availableTools).length

  return (
    <div style={{ padding: '40px', background: '#1a1a2e', minHeight: '100vh', color: 'white' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '10px', fontWeight: 'bold' }}>🔬 Penetration Testing Lab</h1>
      <p style={{ color: '#888', marginBottom: '25px', fontSize: '15px' }}>{totalTools} security tools available</p>
      
      {isRunning && currentProgress && (
        <div style={{ background: '#16213e', padding: '15px', borderRadius: '12px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span>Progress</span>
            <span>{currentProgress.current_tool + 1}/{currentProgress.total_tools} tools</span>
          </div>
          <div style={{ height: '8px', background: '#0f3460', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ 
              width: `${((currentProgress.current_tool + 1) / currentProgress.total_tools) * 100}%`, 
              height: '100%', 
              background: '#6c63ff',
              transition: 'width 0.3s'
            }} />
          </div>
          <div style={{ marginTop: '10px', fontSize: '13px', color: '#6c63ff' }}>
            {currentProgress.status || 'Running...'}
          </div>
        </div>
      )}
      
      <div style={{
        background: '#16213e',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '25px'
      }}>
        <h3 style={{ marginBottom: '12px', fontSize: '18px', fontWeight: 'bold' }}>🎯 Target</h3>
        <div style={{ display: 'flex', gap: '15px' }}>
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="Enter target IP (e.g., 192.168.56.101)"
            style={{
              flex: 1,
              maxWidth: '400px',
              padding: '12px 16px',
              background: '#0f3460',
              border: '1px solid #6c63ff40',
              borderRadius: '8px',
              color: 'white',
              fontSize: '15px'
            }}
            disabled={isRunning}
          />
          <button
            onClick={startPentest}
            disabled={isRunning || !target || selectedTools.length === 0}
            style={{
              background: '#6c63ff',
              color: 'white',
              border: 'none',
              padding: '12px 28px',
              borderRadius: '8px',
              cursor: 'pointer',
              opacity: isRunning || !target || selectedTools.length === 0 ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: 'bold',
              fontSize: '15px'
            }}
          >
            {isRunning ? <Loader size={18} className="spin" /> : <Play size={18} />}
            {isRunning ? 'Scanning...' : `Start (${selectedTools.length})`}
          </button>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '25px' }}>
        <div style={{ flex: '55%', background: '#16213e', padding: '20px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>🛠️ Tools</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={selectAllTools} style={{ background: '#10b98120', color: '#10b981', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>All</button>
              <button onClick={clearSelection} style={{ background: '#ef444420', color: '#ef4444', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Clear</button>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
              <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '10px 12px 10px 36px', background: '#0f3460', border: 'none', color: 'white', borderRadius: '8px', fontSize: '14px' }} />
            </div>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={{ padding: '10px', background: '#0f3460', border: 'none', color: 'white', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>
              <option value="all">All ({totalTools})</option>
              {toolCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          
          <div style={{ maxHeight: '400px', overflow: 'auto' }}>
            {filteredTools.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>No tools found</div>
            ) : (
              filteredTools.map(([toolId, tool]) => (
                <label key={toolId} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', marginBottom: '8px', background: selectedTools.includes(toolId) ? '#6c63ff20' : '#0f3460', borderRadius: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={selectedTools.includes(toolId)} onChange={() => toggleTool(toolId)} disabled={isRunning} />
                  <div style={{ fontSize: '24px' }}>{tool.icon || '🛠️'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{tool.name}</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>{tool.description.substring(0, 60)}...</div>
                  </div>
                  <div style={{ fontSize: '11px', background: '#6c63ff20', padding: '4px 10px', borderRadius: '20px', color: '#6c63ff' }}>{tool.category}</div>
                </label>
              ))
            )}
          </div>
          
          <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #333', fontSize: '14px', color: '#888' }}>
            Selected: {selectedTools.length} / {totalTools}
          </div>
        </div>

        <div style={{ flex: '45%', background: '#16213e', padding: '20px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <History size={20} />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>History</h3>
            </div>
            <button onClick={clearOutput} style={{ background: '#ef444420', color: '#ef4444', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Clear</button>
          </div>
          <div style={{ maxHeight: '400px', overflow: 'auto' }}>
            {sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px', color: '#888' }}>No sessions</div>
            ) : (
              sessions.map(session => (
                <div key={session.id} style={{ background: '#0f3460', padding: '12px', borderRadius: '8px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div><Target size={14} style={{ display: 'inline', marginRight: '6px' }} /><strong>{session.target}</strong></div>
                    <span style={{ background: session.status === 'completed' ? '#10b98120' : '#f59e0b20', color: session.status === 'completed' ? '#10b981' : '#f59e0b', padding: '4px 10px', borderRadius: '20px', fontSize: '11px' }}>{session.status}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>{new Date(session.started_at).toLocaleString()} | {session.findings_count} findings</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div style={{ background: '#16213e', padding: '20px', borderRadius: '12px', marginTop: '25px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <Terminal size={20} />
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Console</h3>
        </div>
        <div style={{ background: '#0f3460', padding: '15px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', maxHeight: '300px', overflow: 'auto', lineHeight: '1.6' }}>
          {output.length === 0 ? (
            <div style={{ color: '#888', textAlign: 'center', padding: '30px' }}>Ready</div>
          ) : (
            output.map((line, idx) => {
              let color = '#aaa'
              if (line.type === 'error') color = '#ff6b6b'
              else if (line.type === 'success') color = '#51cf66'
              else if (line.type === 'critical') color = '#ef4444'
              else if (line.type === 'high') color = '#f59e0b'
              return <div key={idx} style={{ marginBottom: '6px', color: color, whiteSpace: 'pre-wrap' }}>[{line.timestamp.toLocaleTimeString()}] {line.message}</div>
            })
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
    </div>
  )
}

export default LabPage
