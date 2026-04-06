import React, { useState, useEffect } from 'react'
import { Brain, CheckCircle, XCircle, ArrowRight, Clock, Award } from 'lucide-react'
import { learningService } from '../../services/learningService'
import LoadingSpinner from '../Common/LoadingSpinner'
import toast from 'react-hot-toast'

function QuizModule({ moduleId, topic = 'Network Security', difficulty = 'intermediate' }) {
  const [quiz, setQuiz] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState(null)

  useEffect(() => {
    loadQuiz()
  }, [moduleId, topic])

  useEffect(() => {
    if (timeLeft > 0 && !submitted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !submitted) {
      handleSubmit()
    }
  }, [timeLeft, submitted])

  const loadQuiz = async () => {
    setLoading(true)
    try {
      const data = await learningService.generateQuiz(topic, difficulty)
      setQuiz(data)
      setTimeLeft(data.time_limit || 300) // 5 minutes default
    } catch (error) {
      toast.error('Failed to load quiz')
      // Fallback mock quiz
      setQuiz({
        title: `${topic} Quiz`,
        questions: [
          {
            id: 1,
            question: 'What is the primary purpose of Nmap?',
            options: ['Password cracking', 'Network discovery', 'Web scraping', 'Data encryption'],
            correct: 'Network discovery',
            explanation: 'Nmap is used for network discovery and security scanning'
          },
          {
            id: 2,
            question: 'Which tool is commonly used for SQL injection detection?',
            options: ['Nmap', 'Hydra', 'SQLMap', 'John the Ripper'],
            correct: 'SQLMap',
            explanation: 'SQLMap is an automated tool for detecting SQL injection vulnerabilities'
          },
          {
            id: 3,
            question: 'What does the term "phishing" refer to?',
            options: ['Network scanning', 'Password cracking', 'Fake emails/websites to steal data', 'DDoS attacks'],
            correct: 'Fake emails/websites to steal data',
            explanation: 'Phishing is a social engineering attack using fake communications to steal sensitive data'
          },
          {
            id: 4,
            question: 'What is a zero-day vulnerability?',
            options: ['A vulnerability fixed within 24 hours', 'A vulnerability with no available patch', 'A vulnerability that only affects zero users', 'A vulnerability that requires zero privileges'],
            correct: 'A vulnerability with no available patch',
            explanation: 'Zero-day vulnerabilities are security flaws unknown to the vendor with no patch available'
          },
          {
            id: 5,
            question: 'Which protocol is most commonly used for secure web browsing?',
            options: ['HTTP', 'FTP', 'HTTPS', 'SSH'],
            correct: 'HTTPS',
            explanation: 'HTTPS (HTTP over SSL/TLS) encrypts web traffic for secure communication'
          }
        ],
        passing_score: 70
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (answer) => {
    setAnswers({
      ...answers,
      [quiz.questions[currentQuestion].id]: answer
    })
  }

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      handleSubmit()
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
        quiz_id: `${topic}_${Date.now()}`,
        score: correct,
        total: quiz.questions.length,
        answers: Object.entries(answers).map(([qId, answer]) => ({ question_id: qId, answer }))
      })
      toast.success(`Quiz submitted! Score: ${finalScore.toFixed(0)}%`)
    } catch (error) {
      console.error('Failed to submit quiz:', error)
    }
  }

  if (loading) return <LoadingSpinner />

  if (submitted) {
    const passed = score >= (quiz.passing_score || 70)
    return (
      <div className="text-center py-8">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
          passed ? 'bg-green-500/20' : 'bg-red-500/20'
        }`}>
          {passed ? <Award className="w-12 h-12 text-green-400" /> : <XCircle className="w-12 h-12 text-red-400" />}
        </div>
        <h3 className="text-3xl font-bold text-white mb-2">
          {passed ? 'Congratulations!' : 'Keep Learning!'}
        </h3>
        <p className="text-5xl font-bold gradient-text mb-4">{score.toFixed(0)}%</p>
        <p className="text-gray-300 mb-6">
          You got {Math.round(score * quiz.questions.length / 100)} out of {quiz.questions.length} correct
        </p>
        {!passed && (
          <button
            onClick={loadQuiz}
            className="px-6 py-3 bg-purple-600 rounded-lg text-white hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    )
  }

  const currentQ = quiz.questions[currentQuestion]

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">{quiz.title}</h3>
          <div className="flex items-center gap-2 text-yellow-400">
            <Clock className="w-5 h-5" />
            <span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
          </div>
        </div>
        <div className="flex justify-between text-sm text-gray-400">
          <span>Question {currentQuestion + 1} of {quiz.questions.length}</span>
          <span>{Math.round((currentQuestion / quiz.questions.length) * 100)}% Complete</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2 mt-2">
          <div 
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
            style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Question */}
      <div className="mb-8">
        <p className="text-xl text-white mb-6">{currentQ.question}</p>
        <div className="space-y-3">
          {currentQ.options.map((option, idx) => (
            <label
              key={idx}
              className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all ${
                answers[currentQ.id] === option
                  ? 'bg-purple-600 border border-purple-400'
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
      </div>

      {/* Navigation */}
      <div className="flex justify-end">
        <button
          onClick={handleNext}
          disabled={!answers[currentQ.id]}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-semibold hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {currentQuestion === quiz.questions.length - 1 ? 'Submit' : 'Next'}
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

export default QuizModule