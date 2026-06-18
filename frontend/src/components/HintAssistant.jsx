import React, { useState, useRef, useEffect } from 'react'

const MODULES = [
  'Network Reconnaissance',
  'Vulnerability Scanning',
  'Web Application Security',
  'Password Attacks & Cracking',
  'Wireless Network Security',
  'Privilege Escalation'
]

export default function HintAssistant() {
  const [open, setOpen] = useState(false)
  const [module, setModule] = useState(MODULES[0])
  const [labExercise, setLabExercise] = useState('')
  const [hintLevel, setHintLevel] = useState(1)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const requestHint = async (level) => {
    setLoading(true)
    try {
      const res = await fetch('/api/hints/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'I need help with this lab' }],
          module_name: module,
          lab_exercise: labExercise || 'default',
          hint_level: level
        })
      })
      const data = await res.json()
      if (data.hint) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.hint, level: data.hint_level, canGoDeeper: data.can_go_deeper }])
        setHintLevel(data.hint_level)
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I couldn\'t fetch a hint right now.' }])
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error connecting to hint service.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleGetHint = () => {
    requestHint(1)
    setMessages([])
  }

  const handleMoreHelp = () => {
    requestHint(hintLevel + 1)
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          color: 'white',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="AI Hint Assistant"
      >
        💡
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed',
          bottom: '90px',
          right: '24px',
          width: '340px',
          maxHeight: '480px',
          background: '#1a1a2e',
          border: '1px solid #2a2a4a',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          color: 'white',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <strong>💡 Hint Assistant</strong>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '16px' }}
            >
              ✕
            </button>
          </div>

          {/* Module / Lab selectors */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #2a2a4a' }}>
            <label style={{ fontSize: '12px', opacity: 0.7 }}>Module</label>
            <select
              value={module}
              onChange={(e) => setModule(e.target.value)}
              style={{
                width: '100%', marginTop: '4px', marginBottom: '8px',
                background: '#0f0f1e', color: 'white', border: '1px solid #2a2a4a',
                borderRadius: '6px', padding: '6px', fontSize: '13px'
              }}
            >
              {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>

            <label style={{ fontSize: '12px', opacity: 0.7 }}>Lab Exercise (optional)</label>
            <input
              value={labExercise}
              onChange={(e) => setLabExercise(e.target.value)}
              placeholder="e.g. Scan Metasploitable with Nmap"
              style={{
                width: '100%', marginTop: '4px',
                background: '#0f0f1e', color: 'white', border: '1px solid #2a2a4a',
                borderRadius: '6px', padding: '6px', fontSize: '13px', boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', minHeight: '120px', maxHeight: '200px' }}>
            {messages.length === 0 && (
              <p style={{ opacity: 0.6, fontSize: '13px' }}>
                Stuck on a lab? Click "Get a Hint" below for a gentle nudge in the right direction.
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{
                background: '#2a2a4a',
                borderRadius: '8px',
                padding: '10px 12px',
                marginBottom: '8px',
                fontSize: '13px',
                lineHeight: '1.4'
              }}>
                <div style={{ fontSize: '11px', opacity: 0.6, marginBottom: '4px' }}>
                  Hint Level {m.level}/3
                </div>
                {m.content}
              </div>
            ))}
            {loading && <p style={{ opacity: 0.6, fontSize: '13px' }}>Thinking...</p>}
          </div>

          {/* Actions */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #2a2a4a', display: 'flex', gap: '8px' }}>
            <button
              onClick={handleGetHint}
              disabled={loading}
              style={{
                flex: 1, padding: '8px', borderRadius: '6px', border: 'none',
                background: '#6c63ff', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'
              }}
            >
              Get a Hint
            </button>
            {messages.length > 0 && messages[messages.length - 1].canGoDeeper && (
              <button
                onClick={handleMoreHelp}
                disabled={loading}
                style={{
                  flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #6c63ff',
                  background: 'transparent', color: '#6c63ff', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'
                }}
              >
                More Help
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
