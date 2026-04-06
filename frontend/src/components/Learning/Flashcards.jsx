import React, { useState, useEffect } from 'react'
import { CreditCard, RotateCcw, ChevronLeft, ChevronRight, Check, X, Brain } from 'lucide-react'
import { learningService } from '../../services/learningService'
import LoadingSpinner from '../Common/LoadingSpinner'
import toast from 'react-hot-toast'

function Flashcards({ topic }) {
  const [cards, setCards] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mastery, setMastery] = useState({})

  useEffect(() => {
    loadFlashcards()
  }, [topic])

  const loadFlashcards = async () => {
    setLoading(true)
    try {
      const data = await learningService.getFlashcards(topic, 20)
      setCards(data.cards || data)
    } catch (error) {
      toast.error('Failed to load flashcards')
      // Fallback mock flashcards
      setCards([
        { front: 'What is Nmap?', back: 'Network Mapper - a tool for network discovery and security scanning' },
        { front: 'What is a vulnerability?', back: 'A weakness in a system that can be exploited by attackers' },
        { front: 'What does SQL stand for?', back: 'Structured Query Language - used to manage databases' },
        { front: 'What is phishing?', back: 'A social engineering attack using fake communications to steal data' },
        { front: 'What is encryption?', back: 'Converting data into a coded format to prevent unauthorized access' },
        { front: 'What is a firewall?', back: 'A network security system that monitors and controls incoming/outgoing traffic' },
        { front: 'What is 2FA?', back: 'Two-Factor Authentication - requires two forms of verification' },
        { front: 'What is a DDoS attack?', back: 'Distributed Denial of Service - overwhelming a system with traffic' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleMastery = async (level) => {
    const cardId = cards[currentIndex]?.id || currentIndex
    setMastery({ ...mastery, [cardId]: level })
    
    // Auto-advance after rating
    setTimeout(() => {
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1)
        setIsFlipped(false)
      } else {
        toast.success('You completed all flashcards!')
      }
    }, 500)
  }

  if (loading) return <LoadingSpinner />

  if (cards.length === 0) {
    return (
      <div className="text-center py-12">
        <CreditCard className="w-16 h-16 text-gray-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">No Flashcards Available</h3>
        <p className="text-gray-400">Check back later for new content</p>
      </div>
    )
  }

  const currentCard = cards[currentIndex]

  return (
    <div>
      {/* Progress */}
      <div className="mb-6 flex justify-between items-center">
        <span className="text-gray-400">Card {currentIndex + 1} of {cards.length}</span>
        <button
          onClick={loadFlashcards}
          className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
        >
          <RotateCcw className="w-4 h-4 text-gray-300" />
        </button>
      </div>

      {/* Flashcard */}
      <div
        className="relative h-96 cursor-pointer mb-8"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={`absolute inset-0 transition-all duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          {/* Front */}
          <div className="absolute inset-0 glass-card p-8 flex items-center justify-center backface-hidden">
            <div className="text-center">
              <Brain className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <p className="text-2xl text-white">{currentCard.front || currentCard.question || currentCard.term}</p>
              <p className="text-gray-400 mt-4 text-sm">Click to flip</p>
            </div>
          </div>
          
          {/* Back */}
          <div className="absolute inset-0 glass-card p-8 flex items-center justify-center backface-hidden rotate-y-180">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6 text-green-400" />
              </div>
              <p className="text-xl text-white">{currentCard.back || currentCard.answer || currentCard.definition}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Buttons */}
      {isFlipped && (
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => handleMastery(1)}
            className="px-6 py-3 bg-red-600/20 hover:bg-red-600/40 rounded-xl text-red-400 transition-colors"
          >
            <X className="w-5 h-5 inline mr-2" />
            Hard
          </button>
          <button
            onClick={() => handleMastery(3)}
            className="px-6 py-3 bg-yellow-600/20 hover:bg-yellow-600/40 rounded-xl text-yellow-400 transition-colors"
          >
            Medium
          </button>
          <button
            onClick={() => handleMastery(5)}
            className="px-6 py-3 bg-green-600/20 hover:bg-green-600/40 rounded-xl text-green-400 transition-colors"
          >
            <Check className="w-5 h-5 inline mr-2" />
            Easy
          </button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={() => {
            if (currentIndex > 0) {
              setCurrentIndex(currentIndex - 1)
              setIsFlipped(false)
            }
          }}
          disabled={currentIndex === 0}
          className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={() => {
            if (currentIndex < cards.length - 1) {
              setCurrentIndex(currentIndex + 1)
              setIsFlipped(false)
            }
          }}
          disabled={currentIndex === cards.length - 1}
          className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <style jsx>{`
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  )
}

export default Flashcards