import React, { useState, useEffect } from 'react'
import { BookOpen, Search, CheckCircle, AlertCircle, Award, Clock, Target, Shield, Zap, Code, Database, Server, Wifi, Key, Globe, Lock, Terminal, FileText, History } from 'lucide-react'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'
import { learningService } from '../services/learningService'

function LearnPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [selectedModule, setSelectedModule] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  
  const [modules, setModules] = useState([])
  const [filteredModules, setFilteredModules] = useState([])
  const [moduleContent, setModuleContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quizAnswers, setQuizAnswers] = useState({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizResults, setQuizResults] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [quizHistory, setQuizHistory] = useState([])
  const [notes, setNotes] = useState('')
  const [quizError, setQuizError] = useState('')

  useEffect(() => {
    fetchModules()
  }, [])

  useEffect(() => {
    filterModules()
  }, [modules, searchTerm, selectedDifficulty])

  useEffect(() => {
    if (selectedModule) {
      fetchModuleContent(selectedModule.id)
      fetchQuizHistory(selectedModule.id)
      const savedNotes = localStorage.getItem(`notes_${selectedModule.id}`)
      setNotes(savedNotes || '')
      setQuizError('')
      setQuizSubmitted(false)
      setQuizResults(null)
      setQuizAnswers({})
    }
  }, [selectedModule])

  const fetchModules = async () => {
    try {
      const data = await learningService.getModules()
      setModules(data)
      setFilteredModules(data)
      if (!selectedModule && data.length > 0) {
        setSelectedModule(data[0])
      }
    } catch (err) {
      console.error('Error fetching modules:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchModuleContent = async (moduleId) => {
    setLoading(true)
    try {
      const data = await learningService.getModule(moduleId)
      setModuleContent(data)
    } catch (err) {
      console.error('Error fetching module content:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchQuizHistory = async (moduleId) => {
    try {
      const data = await learningService.getQuizHistory(moduleId)
      setQuizHistory(data)
    } catch (err) {
      console.error('Error fetching quiz history:', err)
    }
  }

  const filterModules = () => {
    let filtered = [...modules]
    if (searchTerm) {
      filtered = filtered.filter(m => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(m => m.difficulty === selectedDifficulty)
    }
    setFilteredModules(filtered)
  }

  const handleQuizAnswer = (questionIndex, answer) => {
    setQuizAnswers(prev => ({ ...prev, [questionIndex]: answer }))
    setQuizError('')
  }

  const submitQuiz = async () => {
    const totalQuestions = moduleContent?.quiz_questions?.length || 0
    const answeredCount = Object.keys(quizAnswers).length
    
    if (answeredCount !== totalQuestions) {
      setQuizError(`Please answer all questions! (${answeredCount}/${totalQuestions} answered)`)
      return
    }
    
    setSubmitting(true)
    setQuizError('')
    
    const answersArray = Object.keys(quizAnswers).map(key => ({
      question_index: parseInt(key),
      answer: quizAnswers[key]
    }))
    
    try {
      const results = await learningService.submitModuleQuiz(selectedModule.id, answersArray)
      setQuizResults(results)
      setQuizSubmitted(true)
      fetchModules()
      fetchQuizHistory(selectedModule.id)
    } catch (err) {
      console.error('Error submitting quiz:', err)
      setQuizError(err.message || 'Failed to submit quiz')
    } finally {
      setSubmitting(false)
    }
  }

  const resetQuiz = () => {
    setQuizSubmitted(false)
    setQuizResults(null)
    setQuizAnswers({})
    setQuizError('')
  }

  const saveNotes = () => {
    if (selectedModule) {
      localStorage.setItem(`notes_${selectedModule.id}`, notes)
      alert('Notes saved successfully!')
    }
  }

  const difficultyColors = {
    'Beginner': { color: '#10b981', bg: '#10b98120', icon: '🌱' },
    'Intermediate': { color: '#f59e0b', bg: '#f59e0b20', icon: '⚡' },
    'Advanced': { color: '#ef4444', bg: '#ef444420', icon: '🔥' }
  }

  if (loading && modules.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#1a1a2e', color: 'white', fontSize: '16px' }}>
        Loading learning modules...
      </div>
    )
  }

  const totalQuestions = moduleContent?.quiz_questions?.length || 0
  const answeredCount = Object.keys(quizAnswers).length
  const allQuestionsAnswered = answeredCount === totalQuestions && totalQuestions > 0

  return (
    <div style={{ padding: '40px', background: '#1a1a2e', minHeight: '100vh', color: 'white' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '36px', marginBottom: '10px', fontWeight: 'bold' }}>📚 Learning Center</h1>
        <p style={{ color: '#888', fontSize: '16px' }}>Master cybersecurity at your own pace with interactive modules</p>
      </div>

      <div style={{ background: '#16213e', padding: '20px 25px', borderRadius: '12px', marginBottom: '30px' }}>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ width: '280px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
            <input
              type="text"
              placeholder="Search modules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px 12px 10px 36px', background: '#0f3460', border: 'none', color: 'white', borderRadius: '8px', fontSize: '14px' }}
            />
          </div>
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            style={{ padding: '10px 16px', background: '#0f3460', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}
          >
            <option value="all">All Difficulties</option>
            <option value="Beginner">🌱 Beginner</option>
            <option value="Intermediate">⚡ Intermediate</option>
            <option value="Advanced">🔥 Advanced</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '30px' }}>
        {/* Sidebar */}
        <div>
          <div style={{ background: '#16213e', borderRadius: '12px', overflow: 'hidden', position: 'sticky', top: '20px' }}>
            <div style={{ padding: '18px', background: '#0f3460', borderBottom: '1px solid #1a1a2e' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Modules ({filteredModules.length})</h3>
            </div>
            <div style={{ maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
              {filteredModules.map(module => {
                const progress = module.user_progress?.score || 0
                const isCompleted = module.user_progress?.completed
                const difficulty = difficultyColors[module.difficulty]
                return (
                  <div
                    key={module.id}
                    onClick={() => setSelectedModule(module)}
                    style={{
                      padding: '15px',
                      borderBottom: '1px solid #0f3460',
                      cursor: 'pointer',
                      background: selectedModule?.id === module.id ? '#6c63ff20' : 'transparent',
                      transition: 'background 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '45px', height: '45px' }}>
                        <CircularProgressbar
                          value={progress}
                          text={`${progress}%`}
                          styles={buildStyles({ textSize: '24px', pathColor: isCompleted ? '#10b981' : '#6c63ff', textColor: '#fff', trailColor: '#0f3460' })}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '5px' }}>{module.icon} {module.name}</div>
                        <div style={{ fontSize: '12px', color: '#888' }}>
                          <span style={{ color: difficulty.color }}>{difficulty.icon} {module.difficulty}</span> • {module.xp} XP
                        </div>
                      </div>
                      {isCompleted && <CheckCircle size={18} color="#10b981" />}
                    </div>
                  </div>
                )
              })}
              {filteredModules.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: '#888', fontSize: '14px' }}>No modules found</div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div>
          {selectedModule && moduleContent ? (
            <div>
              <div style={{ background: 'linear-gradient(135deg, #16213e 0%, #0f3460 100%)', padding: '30px', borderRadius: '12px', marginBottom: '25px' }}>
                <div style={{ fontSize: '56px', marginBottom: '12px' }}>{selectedModule.icon}</div>
                <h2 style={{ margin: 0, marginBottom: '10px', fontSize: '28px', fontWeight: 'bold' }}>{selectedModule.name}</h2>
                <div style={{ display: 'flex', gap: '15px', marginTop: '10px', flexWrap: 'wrap' }}>
                  <span style={{ color: difficultyColors[selectedModule.difficulty]?.color, background: difficultyColors[selectedModule.difficulty]?.bg, padding: '5px 14px', borderRadius: '25px', fontSize: '13px', fontWeight: '500' }}>
                    {difficultyColors[selectedModule.difficulty]?.icon} {selectedModule.difficulty}
                  </span>
                  <span style={{ fontSize: '14px' }}>🎯 {selectedModule.xp} XP</span>
                  <span style={{ fontSize: '14px' }}>⏱️ {selectedModule.duration}</span>
                </div>
                <p style={{ color: '#aaa', marginTop: '15px', fontSize: '15px', lineHeight: '1.6' }}>{selectedModule.description}</p>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', borderBottom: '1px solid #333', flexWrap: 'wrap' }}>
                {['overview', 'quiz', 'exercise', 'history', 'notes'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{ padding: '10px 20px', background: 'transparent', border: 'none', color: activeTab === tab ? '#6c63ff' : '#888', cursor: 'pointer', borderBottom: activeTab === tab ? '2px solid #6c63ff' : 'none', fontWeight: activeTab === tab ? 'bold' : 'normal', fontSize: '15px' }}
                  >
                    {tab === 'overview' && '📖 Overview'}
                    {tab === 'quiz' && '📝 Quiz'}
                    {tab === 'exercise' && '🔬 Lab Exercise'}
                    {tab === 'history' && '📜 History'}
                    {tab === 'notes' && '📝 Notes'}
                  </button>
                ))}
              </div>

              {activeTab === 'overview' && (
                <div style={{ background: '#16213e', borderRadius: '12px', padding: '30px' }}>
                  <h3 style={{ fontSize: '20px', marginBottom: '20px', fontWeight: 'bold' }}>📖 Module Overview</h3>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', color: '#ccc', fontSize: '15px' }}>{moduleContent.long_description}</div>
                  
                  <h3 style={{ fontSize: '20px', marginTop: '30px', marginBottom: '20px', fontWeight: 'bold' }}>🎯 Learning Objectives</h3>
                  <ul style={{ color: '#ccc', lineHeight: '2', fontSize: '15px', paddingLeft: '25px' }}>
                    {moduleContent.learning_objectives?.map((obj, idx) => <li key={idx}>{obj}</li>)}
                  </ul>
                </div>
              )}

              {activeTab === 'quiz' && (
                <div style={{ background: '#16213e', borderRadius: '12px', padding: '30px' }}>
                  <h3 style={{ fontSize: '20px', marginBottom: '15px', fontWeight: 'bold' }}>📝 Module Quiz</h3>
                  <p style={{ color: '#888', marginBottom: '25px', fontSize: '14px' }}>Test your knowledge! You need 70% to pass and earn XP.</p>

                  {!quizSubmitted && totalQuestions > 0 && (
                    <div style={{ background: '#0f3460', padding: '12px 16px', borderRadius: '8px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px' }}>📊 Progress:</span>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: allQuestionsAnswered ? '#10b981' : '#f59e0b' }}>
                        {answeredCount}/{totalQuestions} answered
                        {allQuestionsAnswered && ' ✅ Ready!'}
                      </span>
                    </div>
                  )}

                  {quizError && (
                    <div style={{ background: '#ef444420', color: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '25px', fontSize: '14px' }}>
                      ❌ {quizError}
                    </div>
                  )}

                  {!quizSubmitted ? (
                    <>
                      {moduleContent.quiz_questions?.map((q, idx) => (
                        <div key={idx} style={{ marginBottom: '30px', padding: '20px', background: '#0f3460', borderRadius: '10px' }}>
                          <p style={{ fontWeight: 'bold', marginBottom: '15px', fontSize: '16px' }}>{idx + 1}. {q.question}</p>
                          <div style={{ display: 'grid', gap: '10px' }}>
                            {q.options.map((option, optIdx) => (
                              <label key={optIdx} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '10px', borderRadius: '8px', background: quizAnswers[idx] === option ? '#6c63ff20' : 'transparent' }}>
                                <input type="radio" name={`q${idx}`} value={option} checked={quizAnswers[idx] === option} onChange={() => handleQuizAnswer(idx, option)} style={{ width: '16px', height: '16px' }} />
                                <span style={{ fontSize: '15px' }}>{option}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                      
                      <button 
                        onClick={submitQuiz} 
                        disabled={submitting || !allQuestionsAnswered}
                        style={{ width: '100%', padding: '14px', background: allQuestionsAnswered ? '#6c63ff' : '#888', color: 'white', border: 'none', borderRadius: '8px', cursor: allQuestionsAnswered ? 'pointer' : 'not-allowed', fontSize: '16px', fontWeight: 'bold' }}
                      >
                        {submitting ? 'Submitting...' : allQuestionsAnswered ? 'Submit Quiz' : `Answer ${totalQuestions - answeredCount} more`}
                      </button>
                    </>
                  ) : (
                    <div>
                      <div style={{ textAlign: 'center', padding: '30px', background: quizResults?.passed ? '#10b98120' : '#ef444420', borderRadius: '12px', marginBottom: '25px' }}>
                        {quizResults?.passed ? (
                          <>
                            <CheckCircle size={56} color="#10b981" />
                            <h2 style={{ color: '#10b981', fontSize: '24px', marginTop: '15px', marginBottom: '8px' }}>🎉 Congratulations!</h2>
                            <p style={{ fontSize: '18px', fontWeight: 'bold' }}>You scored {quizResults.percentage}%</p>
                            <p style={{ fontSize: '15px' }}>You earned {selectedModule.xp} XP!</p>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={56} color="#ef4444" />
                            <h2 style={{ color: '#ef4444', fontSize: '24px', marginTop: '15px', marginBottom: '8px' }}>Keep Learning!</h2>
                            <p style={{ fontSize: '18px', fontWeight: 'bold' }}>You scored {quizResults?.percentage}%</p>
                            <p style={{ fontSize: '15px' }}>Need 70% to pass.</p>
                            <button onClick={resetQuiz} style={{ marginTop: '20px', background: '#6c63ff', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold' }}>🔄 Retake Quiz</button>
                          </>
                        )}
                      </div>
                      
                      <h4 style={{ fontSize: '18px', marginBottom: '20px', fontWeight: 'bold' }}>📋 Answer Review:</h4>
                      {quizResults?.results?.map((result, idx) => (
                        <div key={idx} style={{ marginBottom: '15px', padding: '15px', background: result.is_correct ? '#10b98120' : '#ef444420', borderRadius: '10px', borderLeft: `4px solid ${result.is_correct ? '#10b981' : '#ef4444'}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                            {result.is_correct ? <CheckCircle size={18} color="#10b981" /> : <AlertCircle size={18} color="#ef4444" />}
                            <strong style={{ fontSize: '15px' }}>Question {idx + 1}: {result.question}</strong>
                          </div>
                          <div style={{ marginLeft: '28px', fontSize: '14px' }}>
                            <div>📝 Your answer: <span style={{ color: result.is_correct ? '#10b981' : '#ef4444' }}>{result.user_answer}</span></div>
                            <div>✅ Correct: <span style={{ color: '#10b981' }}>{result.correct_answer}</span></div>
                            <div style={{ fontSize: '13px', color: '#aaa', marginTop: '8px' }}>💡 {result.explanation}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'exercise' && moduleContent.practical_exercise && (
                <div style={{ background: '#16213e', borderRadius: '12px', padding: '30px' }}>
                  <h3 style={{ fontSize: '20px', marginBottom: '20px', fontWeight: 'bold' }}>🔬 Hands-on Lab Exercise</h3>
                  <div style={{ background: '#0f3460', padding: '25px', borderRadius: '10px' }}>
                    <h4 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: 'bold' }}>{moduleContent.practical_exercise.title}</h4>
                    <p style={{ fontSize: '14px', marginBottom: '12px' }}><strong>🎯 Target:</strong> <code style={{ background: '#1a1a2e', padding: '4px 8px', borderRadius: '6px', fontSize: '14px' }}>{moduleContent.practical_exercise.target}</code></p>
                    <p style={{ fontSize: '14px', marginBottom: '12px' }}><strong>🛠️ Tools Required:</strong> {moduleContent.practical_exercise.tools?.map(t => <span key={t} style={{ background: '#6c63ff20', padding: '4px 12px', borderRadius: '20px', marginRight: '8px', fontSize: '13px' }}>{t}</span>)}</p>
                    <h4 style={{ fontSize: '16px', marginTop: '20px', marginBottom: '12px', fontWeight: 'bold' }}>📝 Steps to Complete:</h4>
                    <ol style={{ lineHeight: '2', paddingLeft: '25px', fontSize: '14px' }}>
                      {moduleContent.practical_exercise.steps?.map((step, idx) => <li key={idx}>{step}</li>)}
                    </ol>
                    <button onClick={() => window.location.href = '/lab'} style={{ marginTop: '25px', background: '#6c63ff', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold' }}>🚀 Go to Pentest Lab</button>
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div style={{ background: '#16213e', borderRadius: '12px', padding: '30px' }}>
                  <h3 style={{ fontSize: '20px', marginBottom: '20px', fontWeight: 'bold' }}>📜 Quiz Attempt History</h3>
                  {quizHistory.length === 0 ? (
                    <p style={{ color: '#888', textAlign: 'center', padding: '50px', fontSize: '14px' }}>No quiz attempts yet. Take the quiz to see your history!</p>
                  ) : (
                    <div style={{ display: 'grid', gap: '15px' }}>
                      {quizHistory.map((attempt, idx) => (
                        <div key={attempt.id} style={{ background: '#0f3460', padding: '15px', borderRadius: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                            <div>
                              <span style={{ fontWeight: 'bold', fontSize: '15px' }}>Attempt #{quizHistory.length - idx}</span>
                              <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>{new Date(attempt.completed_at).toLocaleString()}</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '24px', fontWeight: 'bold', color: attempt.passed ? '#10b981' : '#ef4444' }}>{attempt.percentage}%</div>
                              <div style={{ fontSize: '12px', color: '#888' }}>{attempt.score}/{attempt.total} correct</div>
                            </div>
                            <div>
                              <span style={{ background: attempt.passed ? '#10b98120' : '#ef444420', color: attempt.passed ? '#10b981' : '#ef4444', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' }}>
                                {attempt.passed ? '✅ Passed' : '❌ Failed'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'notes' && (
                <div style={{ background: '#16213e', borderRadius: '12px', padding: '30px' }}>
                  <h3 style={{ fontSize: '20px', marginBottom: '20px', fontWeight: 'bold' }}>📝 Study Notes</h3>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Write your study notes here..."
                    style={{ width: '100%', minHeight: '300px', padding: '15px', background: '#0f3460', border: 'none', color: 'white', borderRadius: '10px', fontFamily: 'monospace', fontSize: '14px', lineHeight: '1.6' }}
                  />
                  <button onClick={saveNotes} style={{ marginTop: '20px', background: '#6c63ff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>💾 Save Notes</button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: '#16213e', padding: '60px', borderRadius: '12px', textAlign: 'center' }}>
              <BookOpen size={64} color="#6c63ff" />
              <h3 style={{ marginTop: '20px', fontSize: '22px', fontWeight: 'bold' }}>Select a Module to Begin</h3>
              <p style={{ color: '#888', fontSize: '15px', marginTop: '10px' }}>Choose a learning module from the sidebar to start your journey</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LearnPage
