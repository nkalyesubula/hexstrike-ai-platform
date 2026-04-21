import React, { useState, useEffect } from 'react'
import { Terminal as TerminalIcon, Play, Loader, History, Target, Search, ChevronDown, ChevronUp } from 'lucide-react'
import XTerminal from '../components/Terminal/XTerminal'

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
  const [showTerminal, setShowTerminal] = useState(true)

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
        
        if (data.status === 'completed') {
          clearInterval(pollInterval)
          setIsRunning(false)
          addOutput(`✅ Pentest completed successfully!`, 'success')
          
          if (data.formatted_findings && data.formatted_findings.length > 0) {
            addOutput(`📊 Found ${data.formatted_findings.length} findings:`, 'info')
            data.formatted_findings.forEach(finding => {
              const severityIcon = finding.severity === 'critical' ? '🔴' : 
                                  finding.severity === 'high' ? '🟠' : 
                                  finding.severity === 'medium' ? '🟡' : '🔵'
              addOutput(`  ${severityIcon} [${finding.severity.toUpperCase()}] ${finding.title}`, finding.severity)
            })
          }
          fetchSessions()
          setCurrentSessionId(null)
        } else if (data.status === 'failed') {
          clearInterval(pollInterval)
          setIsRunning(false)
          addOutput(`❌ Pentest failed: ${data.results?.error || 'Unknown error'}`, 'error')
          setCurrentSessionId(null)
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 3000)
    
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
    addOutput(`🚀 Starting penetration test against ${target}`, 'success')
    addOutput(`📋 Selected tools: ${selectedTools.length} tools`, 'info')
    
    try {
      const response = await fetchWithAuth('/api/tools/batch', {
        method: 'POST',
        body: JSON.stringify({ target, tools: selectedTools, auto_mode: true })
      })
      const data = await response.json()
      setCurrentSessionId(data.session_id)
      addOutput(`✅ Session created: ID ${data.session_id}`, 'success')
      addOutput(`🔄 Scanning in progress...`, 'info')
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

  const handleTerminalCommand = async (command, callback) => {
    const parts = command.split(' ')
    const tool = parts[0]
    const args = parts.slice(1)
    
    // Extract target from args
    let targetIP = ''
    for (const arg of args) {
      if (arg.match(/^(\d{1,3}\.){3}\d{1,3}$/) || arg.match(/^[a-zA-Z0-9.-]+$/)) {
        targetIP = arg
        break
      }
    }
    
    if (tool === 'nmap' || tool === 'gobuster' || tool === 'nuclei' || tool === 'nikto' || tool === 'hydra' || tool === 'sqlmap') {
      if (!targetIP) {
        callback(`\x1b[1;31mError: No target specified. Usage: ${tool} <target>\x1b[0m`)
        return
      }
      
      callback(`\x1b[1;33mExecuting ${tool} against ${targetIP}...\x1b[0m`)
      
      try {
        const response = await fetchWithAuth(`/api/tools/execute/${tool}`, {
          method: 'POST',
          body: JSON.stringify({ target: targetIP, tool_name: tool, parameters: {} })
        })
        const data = await response.json()
        
        if (data.success) {
          callback(`\x1b[1;32m✓ Tool started! Session ID: ${data.session_id}\x1b[0m`)
          callback(`\x1b[1;36mCheck the Console Output above for results.\x1b[0m`)
        } else {
          callback(`\x1b[1;31m✗ Failed: ${data.message || 'Unknown error'}\x1b[0m`)
        }
      } catch (error) {
        callback(`\x1b[1;31m✗ Error: ${error.message}\x1b[0m`)
      }
    } else {
      callback(`\x1b[1;31mUnknown command: ${tool}. Type 'help' for available commands.\x1b[0m`)
    }
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#1a1a2e', color: 'white', fontSize: '16px' }}>
        Loading tools...
      </div>
    )
  }

  const filteredTools = getFilteredTools()
  const totalTools = Object.keys(availableTools).length

  return (
    <div style={{ padding: '40px', background: '#1a1a2e', minHeight: '100vh', color: 'white' }}>
      <h1 style={{ fontSize: '36px', marginBottom: '10px', fontWeight: 'bold' }}>🔬 Penetration Testing Lab</h1>
      <p style={{ color: '#888', marginBottom: '25px', fontSize: '16px' }}>{totalTools} security tools available</p>
      
      <div style={{
        background: '#16213e',
        padding: '20px 25px',
        borderRadius: '12px',
        marginBottom: '25px'
      }}>
        <h3 style={{ marginBottom: '12px', fontSize: '18px', fontWeight: 'bold' }}>🎯 Target Configuration</h3>
        <div style={{ display: 'flex', gap: '15px' }}>
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="IP or domain (e.g., 192.168.56.101)"
            style={{
              flex: 1,
              maxWidth: '450px',
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
      
      <div style={{ display: 'flex', gap: '25px', marginBottom: '25px' }}>
        <div style={{ flex: '55%', background: '#16213e', padding: '20px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>🛠️ Select Tools</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={selectAllTools} style={{ background: '#10b98120', color: '#10b981', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>Select All</button>
              <button onClick={clearSelection} style={{ background: '#ef444420', color: '#ef4444', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>Clear</button>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
              <input type="text" placeholder="Search tools..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '10px 12px 10px 36px', background: '#0f3460', border: 'none', color: 'white', borderRadius: '8px', fontSize: '14px' }} />
            </div>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={{ padding: '10px 12px', background: '#0f3460', border: 'none', color: 'white', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>
              <option value="all">All ({totalTools})</option>
              {toolCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          
          <div style={{ maxHeight: '300px', overflow: 'auto' }}>
            {filteredTools.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#888', fontSize: '14px' }}>No tools found</div>
            ) : (
              filteredTools.map(([toolId, tool]) => (
                <label key={toolId} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', marginBottom: '8px', background: selectedTools.includes(toolId) ? '#6c63ff20' : '#0f3460', borderRadius: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={selectedTools.includes(toolId)} onChange={() => toggleTool(toolId)} disabled={isRunning} style={{ width: '18px', height: '18px' }} />
                  <div style={{ fontSize: '24px' }}>{tool.icon || '🛠️'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '4px' }}>{tool.name}</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>{tool.description.substring(0, 70)}...</div>
                  </div>
                  <div style={{ fontSize: '11px', background: '#6c63ff20', padding: '4px 10px', borderRadius: '20px', color: '#6c63ff', fontWeight: '500' }}>{tool.category}</div>
                </label>
              ))
            )}
          </div>
          
          <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #333', fontSize: '14px', color: '#888' }}>
            Selected: {selectedTools.length} / {totalTools} tools
          </div>
        </div>

        <div style={{ flex: '45%', background: '#16213e', padding: '20px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <History size={20} />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Session History</h3>
            </div>
            <button onClick={clearOutput} style={{ background: '#ef444420', color: '#ef4444', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>Clear</button>
          </div>
          <div style={{ maxHeight: '300px', overflow: 'auto' }}>
            {sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px', color: '#888', fontSize: '14px' }}>No sessions yet</div>
            ) : (
              sessions.map(session => (
                <div key={session.id} style={{ background: '#0f3460', padding: '12px', borderRadius: '8px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div><Target size={14} style={{ display: 'inline', marginRight: '6px' }} /><strong style={{ fontSize: '14px' }}>{session.target}</strong></div>
                    <span style={{ background: session.status === 'completed' ? '#10b98120' : '#f59e0b20', color: session.status === 'completed' ? '#10b981' : '#f59e0b', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '500' }}>{session.status}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>{new Date(session.started_at).toLocaleString()} | {session.findings_count} findings</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div style={{ background: '#16213e', borderRadius: '12px', overflow: 'hidden', marginTop: '25px' }}>
        <div 
          onClick={() => setShowTerminal(!showTerminal)}
          style={{
            padding: '15px 20px',
            background: '#0f3460',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: showTerminal ? '1px solid #6c63ff40' : 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TerminalIcon size={20} color="#6c63ff" />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Interactive Terminal</h3>
          </div>
          {showTerminal ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
        
        {showTerminal && (
          <div style={{ padding: '0' }}>
            <XTerminal 
              onCommand={handleTerminalCommand}
              height="400px"
            />
          </div>
        )}
      </div>

      <div style={{ background: '#16213e', padding: '20px', borderRadius: '12px', marginTop: '25px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <TerminalIcon size={20} />
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Console Output</h3>
        </div>
        <div style={{ background: '#0f3460', padding: '15px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', maxHeight: '200px', overflow: 'auto', lineHeight: '1.6' }}>
          {output.length === 0 ? (
            <div style={{ color: '#888', textAlign: 'center', padding: '30px', fontSize: '14px' }}>Ready. Configure target and select tools above.</div>
          ) : (
            output.map((line, idx) => {
              let color = '#aaa'
              if (line.type === 'error') color = '#ff6b6b'
              else if (line.type === 'success') color = '#51cf66'
              else if (line.type === 'critical') color = '#ef4444'
              else if (line.type === 'high') color = '#f59e0b'
              return <div key={idx} style={{ marginBottom: '6px', color: color, fontSize: '13px' }}>[{line.timestamp.toLocaleTimeString()}] {line.message}</div>
            })
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
    </div>
  )
}

export default LabPage
