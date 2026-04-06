import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Brain, Clock, Award, AlertCircle, CheckCircle, XCircle, ArrowLeft, ArrowRight, Flag, HelpCircle } from 'lucide-react'
import { learningService } from '../services/learningService'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

function QuizPage() {
  const { topic } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [quiz, setQuiz] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [selectedDifficulty, setSelectedDifficulty] = useState('intermediate')
  const [quizTopics, setQuizTopics] = useState([
    { id: 'network-security', name: 'Network Security', icon: '🌐', difficulty: 'intermediate' },
    { id: 'web-security', name: 'Web Application Security', icon: '🔒', difficulty: 'intermediate' },
    { id: 'penetration-testing', name: 'Penetration Testing', icon: '🎯', difficulty: 'advanced' },
    { id: 'cryptography', name: 'Cryptography', icon: '🔐', difficulty: 'intermediate' },
    { id: 'malware-analysis', name: 'Malware Analysis', icon: '🦠', difficulty: 'advanced' },
    { id: 'incident-response', name: 'Incident Response', icon: '🚨', difficulty: 'beginner' },
    { id: 'cloud-security', name: 'Cloud Security', icon: '☁️', difficulty: 'intermediate' },
    { id: 'social-engineering', name: 'Social Engineering', icon: '🎭', difficulty: 'beginner' },
  ])

  useEffect(() => {
    if (topic) {
      loadQuiz(topic, selectedDifficulty)
    }
  }, [topic, selectedDifficulty])

  useEffect(() => {
    if (timeLeft > 0 && !submitted && quiz) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !submitted && quiz) {
      handleSubmit()
    }
  }, [timeLeft, submitted, quiz])

  const loadQuiz = async (quizTopic, difficulty) => {
    setLoading(true)
    setAnswers({})
    setCurrentQuestion(0)
    setSubmitted(false)
    setScore(null)
    setShowExplanation(false)
    
    try {
      const data = await learningService.generateQuiz(quizTopic, difficulty)
      setQuiz(data)
      setTimeLeft(data.time_limit || 600) // 10 minutes default
    } catch (error) {
      console.error('Failed to load quiz:', error)
      // Fallback mock quiz data
      setQuiz(getMockQuiz(quizTopic, difficulty))
      setTimeLeft(600)
    } finally {
      setLoading(false)
    }
  }

  const getMockQuiz = (quizTopic, difficulty) => {
    const quizzes = {
      'network-security': {
        title: 'Network Security Fundamentals',
        description: 'Test your knowledge of network security concepts, protocols, and defense mechanisms.',
        questions: [
          {
            id: 1,
            question: 'Which protocol is used to securely transfer files over a network?',
            options: ['FTP', 'SFTP', 'HTTP', 'Telnet'],
            correct: 'SFTP',
            explanation: 'SFTP (SSH File Transfer Protocol) provides secure file transfer over SSH, encrypting both commands and data.'
          },
          {
            id: 2,
            question: 'What does a firewall do?',
            options: ['Encrypts network traffic', 'Monitors and controls incoming/outgoing traffic', 'Scans for viruses', 'Backs up data'],
            correct: 'Monitors and controls incoming/outgoing traffic',
            explanation: 'A firewall establishes a barrier between trusted internal networks and untrusted external networks.'
          },
          {
            id: 3,
            question: 'What is a VPN primarily used for?',
            options: ['Faster internet speeds', 'Creating secure encrypted connections', 'Blocking advertisements', 'Monitoring network traffic'],
            correct: 'Creating secure encrypted connections',
            explanation: 'VPNs create encrypted tunnels for secure communication over public networks.'
          },
          {
            id: 4,
            question: 'Which port does HTTPS typically use?',
            options: ['80', '443', '8080', '22'],
            correct: '443',
            explanation: 'HTTPS uses port 443 by default for encrypted web traffic.'
          },
          {
            id: 5,
            question: 'What is a DDoS attack?',
            options: ['Data Deletion on Servers', 'Distributed Denial of Service', 'Direct Database Overload System', 'Dynamic Data Output Stream'],
            correct: 'Distributed Denial of Service',
            explanation: 'DDoS attacks overwhelm a target with traffic from multiple sources, causing service disruption.'
          }
        ],
        passing_score: 70
      },
      'web-security': {
        title: 'Web Application Security',
        description: 'Test your knowledge of web vulnerabilities and secure coding practices.',
        questions: [
          {
            id: 1,
            question: 'What is Cross-Site Scripting (XSS)?',
            options: ['Stealing cookies via injected scripts', 'Database injection attack', 'Server overload attack', 'Password cracking technique'],
            correct: 'Stealing cookies via injected scripts',
            explanation: 'XSS injects malicious scripts into web pages viewed by other users.'
          },
          {
            id: 2,
            question: 'What does SQL Injection target?',
            options: ['Web server', 'Database', 'Network', 'Client browser'],
            correct: 'Database',
            explanation: 'SQL Injection manipulates database queries to access or modify data.'
          },
          {
            id: 3,
            question: 'Which header helps prevent clickjacking attacks?',
            options: ['CSP', 'X-Frame-Options', 'HSTS', 'CORS'],
            correct: 'X-Frame-Options',
            explanation: 'X-Frame-Options prevents your site from being embedded in frames.'
          }
        ],
        passing_score: 70
      },
      'penetration-testing': {
        title: 'Penetration Testing Methodology',
        description: 'Test your knowledge of pentesting phases, tools, and techniques.',
        questions: [
          {
            id: 1,
            question: 'What is the first phase of penetration testing?',
            options: ['Exploitation', 'Reconnaissance', 'Reporting', 'Privilege Escalation'],
            correct: 'Reconnaissance',
            explanation: 'Reconnaissance involves gathering information about the target before attempting exploitation.'
          },
          {
            id: 2,
            question: 'Which tool is commonly used for network scanning?',
            options: ['Metasploit', 'Nmap', 'Burp Suite', 'Wireshark'],
            correct: 'Nmap',
            explanation: 'Nmap is the industry standard for network discovery and security scanning.'
          },
          {
            id: 3,
            question: 'What is a "zero-day" vulnerability?',
            options: ['Fixed within 24 hours', 'Unknown to the vendor', 'Only affects zeros', 'Requires zero privileges'],
            correct: 'Unknown to the vendor',
            explanation: 'Zero-day vulnerabilities are unknown to the software vendor with no available patch.'
          }
        ],
        passing_score: 70
      }
    }
    
    return quizzes[quizTopic] || quizzes['network-security']
  }

  const handleAnswer = (answer) => {
    setAnswers({
      ...answers,
      [quiz.questions[currentQuestion].id]: answer
    })
    setShowExplanation(false)
  }

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setShowExplanation(false)
    } else {
      handleSubmit()
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
      setShowExplanation(false)
    }
  }

  const handleSubmit = async () => {
    // Calculate score
    let correct = 0
    quiz.questions.forEach(q => {
      if (answers[q.id] === q.correct) correct++
    })
    const finalScore = (correct / quiz.questions.length) * 100
    setScore(finalScore)
    setSubmitted(true)

    // Submit to backend
    try {
      await learningService.submitQuiz({
        quiz_id: `${quiz.title}_${Date.now()}`,
        score: correct,
        total: quiz.questions.length,
        answers: Object.entries(answers).map(([qId, answer]) => ({ 
          question_id: parseInt(qId), 
          answer,
          is_correct: quiz.questions.find(q => q.id === parseInt(qId))?.correct === answer
        }))
      })
      
      // Update user progress
      if (finalScore >= (quiz.passing_score || 70)) {
        await learningService.updateProgress(quiz.title, true, finalScore, {
          quiz_completed: true,
          score: finalScore,
          topic: topic
        })
        toast.success(`Great job! You passed with ${finalScore.toFixed(0)}%`)
      } else {
        toast.warning(`You scored ${finalScore.toFixed(0)}%. Keep practicing!`)
      }
    } catch (error) {
      console.error('Failed to submit quiz:', error)
      toast.error('Failed to save quiz results')
    }
  }

  const handleRetry = () => {
    loadQuiz(topic, selectedDifficulty)
  }

  const handleTopicSelect = (selectedTopic) => {
    navigate(`/quiz/${selectedTopic.id}`)
  }

  if (!topic) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Quiz Center</h1>
          <p className="text-gray-300 text-lg">Choose a topic to test your knowledge</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizTopics.map((quizTopic) => (
            <button
              key={quizTopic.id}
              onClick={() => handleTopicSelect(quizTopic)}
              className="glass-card p-6 text-left hover:scale-105 transition-all duration-300 group"
            >
              <div className="text-5xl mb-4">{quizTopic.icon}</div>
              <h3 className="text-xl font-bold text-white mb-2">{quizTopic.name}</h3>
              <div className="flex items-center gap-2 text-sm">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  quizTopic.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                  quizTopic.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {quizTopic.difficulty}
                </span>
                <span className="text-gray-400">10 questions</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (submitted) {
    const passed = score >= (quiz.passing_score || 70)
    return (
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="glass-card p-8 text-center">
          <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6 ${
            passed ? 'bg-green-500/20' : 'bg-red-500/20'
          }`}>
            {passed ? <Award className="w-16 h-16 text-green-400" /> : <XCircle className="w-16 h-16 text-red-400" />}
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-2">
            {passed ? 'Congratulations!' : 'Keep Learning!'}
          </h2>
          <p className="text-gray-300 mb-4">{quiz.title}</p>
          
          <div className="text-7xl font-bold gradient-text mb-4">{score.toFixed(0)}%</div>
          
          <p className="text-gray-300 mb-6">
            You got {Math.round(score * quiz.questions.length / 100)} out of {quiz.questions.length} correct
          </p>

          <div className="flex gap-4 justify-center">
            <button
              onClick={handleRetry}
              className="px-6 py-3 bg-purple-600 rounded-xl text-white font-semibold hover:bg-purple-700 transition-colors"
            >
              Take Again
            </button>
            <button
              onClick={() => navigate('/learn')}
              className="px-6 py-3 bg-white/10 rounded-xl text-white font-semibold hover:bg-white/20 transition-colors"
            >
              Back to Learning
            </button>
          </div>

          {/* Review Answers */}
          <div className="mt-8 pt-8 border-t border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">Review Your Answers</h3>
            <div className="space-y-4">
              {quiz.questions.map((q, idx) => {
                const userAnswer = answers[q.id]
                const isCorrect = userAnswer === q.correct
                return (
                  <div key={q.id} className={`p-4 rounded-xl text-left ${isCorrect ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                    <div className="flex items-start gap-3">
                      {isCorrect ? <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" /> : <XCircle className="w-5 h-5 text-red-400 mt-0.5" />}
                      <div className="flex-1">
                        <p className="text-white font-medium mb-2">Question {idx + 1}: {q.question}</p>
                        <p className="text-sm text-gray-300">Your answer: <span className={isCorrect ? 'text-green-400' : 'text-red-400'}>{userAnswer || 'Not answered'}</span></p>
                        {!isCorrect && <p className="text-sm text-green-400 mt-1">Correct answer: {q.correct}</p>}
                        <p className="text-sm text-gray-400 mt-2">{q.explanation}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentQ = quiz.questions[currentQuestion]
  const hasCurrentAnswer = answers[currentQ.id] !== undefined
  const isLastQuestion = currentQuestion === quiz.questions.length - 1

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/learn')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Learning
        </button>
        
        <div className="glass-card p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">{quiz.title}</h1>
              <p className="text-gray-400 text-sm mt-1">{quiz.description}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-yellow-400">
                <Clock className="w-5 h-5" />
                <span className="font-mono">
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-purple-400">
                <HelpCircle className="w-5 h-5" />
                <span>{currentQuestion + 1}/{quiz.questions.length}</span>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
              style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="glass-card p-8 mb-6">
        <div className="mb-6">
          <span className="text-sm text-purple-400">Question {currentQuestion + 1}</span>
          <h2 className="text-2xl text-white mt-2">{currentQ.question}</h2>
        </div>

        <div className="space-y-3">
          {currentQ.options.map((option, idx) => (
            <label
              key={idx}
              className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all ${
                answers[currentQ.id] === option
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 border border-purple-400'
                  : 'bg-white/10 hover:bg-white/20 border border-white/10'
              }`}
            >
              <input
                type="radio"
                name={`question-${currentQ.id}`}
                value={option}
                checked={answers[currentQ.id] === option}
                onChange={() => handleAnswer(option)}
                className="w-4 h-4 text-purple-600"
              />
              <span className="text-white">{option}</span>
            </label>
          ))}
        </div>

        {/* Show Explanation Button */}
        {hasCurrentAnswer && (
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="mt-4 text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            {showExplanation ? 'Hide Explanation' : 'Show Explanation'}
          </button>
        )}

        {showExplanation && hasCurrentAnswer && (
          <div className="mt-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
            <p className="text-blue-300 text-sm">
              <strong>💡 Explanation:</strong> {currentQ.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className="px-6 py-3 bg-white/10 rounded-xl text-white font-semibold hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Previous
        </button>
        
        <button
          onClick={handleNext}
          disabled={!hasCurrentAnswer}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-semibold hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLastQuestion ? (
            <>
              Submit Quiz
              <Flag className="w-5 h-5" />
            </>
          ) : (
            <>
              Next
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>

      {/* Question Navigator */}
      <div className="mt-8 glass-card p-4">
        <p className="text-sm text-gray-400 mb-3">Question Navigator</p>
        <div className="flex flex-wrap gap-2">
          {quiz.questions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentQuestion(idx)
                setShowExplanation(false)
              }}
              className={`w-10 h-10 rounded-lg transition-all ${
                idx === currentQuestion
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : answers[quiz.questions[idx].id]
                    ? 'bg-green-500/30 text-green-400'
                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default QuizPage