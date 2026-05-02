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
  const [masteryByTopic, setMasteryByTopic] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('flashcard_mastery_by_topic')) || {}
    } catch {
      return {}
    }
  })

  const topicKey = topic || 'default'
  const topicMastery = masteryByTopic[topicKey] || {}

  useEffect(() => {
    loadFlashcards()
  }, [topic])

  const loadFlashcards = async () => {
    setLoading(true)
    setCurrentIndex(0)
    setIsFlipped(false)
    try {
      const data = await learningService.getFlashcards(topic, 20)
      const apiCards = Array.isArray(data?.cards) ? data.cards : Array.isArray(data) ? data : []
      setCards(apiCards)
    } catch (error) {
      toast.error('Failed to load flashcards')
      setCards([])
    } finally {
      setLoading(false)
    }
  }

  const handleMastery = async (level) => {
    const cardId = cards[currentIndex]?.id || currentIndex
    const nextMasteryByTopic = {
      ...masteryByTopic,
      [topicKey]: {
        ...topicMastery,
        [cardId]: level
      }
    }

    setMasteryByTopic(nextMasteryByTopic)
    localStorage.setItem('flashcard_mastery_by_topic', JSON.stringify(nextMasteryByTopic))

    try {
      await learningService.reviewFlashcard(cardId, level)
    } catch (error) {
      // Keep the study flow smooth even if progress tracking is unavailable.
    }
    
    setTimeout(() => {
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1)
        setIsFlipped(false)
      } else {
        toast.success('You completed all flashcards!')
      }
    }, 500)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '260px', color: '#9ca3af', flexDirection: 'column', gap: '16px' }}>
        <LoadingSpinner />
        <span>Loading flashcards...</span>
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <CreditCard size={56} color="#6b7280" style={{ marginBottom: '16px' }} />
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>No Flashcards Available</h3>
        <p style={{ color: '#9ca3af' }}>This module does not have review cards yet.</p>
      </div>
    )
  }

  const currentCard = cards[currentIndex]
  const masteredCount = Object.keys(topicMastery).filter(cardId =>
    cards.some(card => String(card.id) === String(cardId))
  ).length
  const frontText = currentCard.front || currentCard.question || currentCard.term
  const backText = currentCard.back || currentCard.answer || currentCard.definition

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <span style={{ color: '#9ca3af', fontSize: '14px' }}>Card {currentIndex + 1} of {cards.length}</span>
          <div style={{ marginTop: '8px', width: '220px', height: '8px', background: '#0f3460', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ width: `${((currentIndex + 1) / cards.length) * 100}%`, height: '100%', background: '#6c63ff' }} />
          </div>
        </div>
        <button
          onClick={loadFlashcards}
          title="Reload flashcards"
          style={{ width: '40px', height: '40px', background: '#0f3460', border: 'none', borderRadius: '8px', color: '#d1d5db', cursor: 'pointer' }}
        >
          <RotateCcw size={16} />
        </button>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsFlipped(!isFlipped)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            setIsFlipped(!isFlipped)
          }
        }}
        style={{ height: '360px', cursor: 'pointer', marginBottom: '28px', perspective: '1200px' }}
      >
        <div style={{ position: 'relative', width: '100%', height: '100%', transition: 'transform 0.5s', transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'none' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0f3460 0%, #16213e 100%)', border: '1px solid #2b3f69', borderRadius: '12px', padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', backfaceVisibility: 'hidden' }}>
            <div style={{ textAlign: 'center', maxWidth: '760px' }}>
              <Brain size={48} color="#a78bfa" style={{ marginBottom: '16px' }} />
              <p style={{ fontSize: '24px', color: 'white', lineHeight: 1.45, margin: 0 }}>{frontText}</p>
              <p style={{ color: '#9ca3af', marginTop: '18px', fontSize: '14px' }}>Click to reveal answer</p>
            </div>
          </div>
          
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #103f55 0%, #16213e 100%)', border: '1px solid #2b6953', borderRadius: '12px', padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
            <div style={{ textAlign: 'center', maxWidth: '760px' }}>
              <div style={{ width: '48px', height: '48px', background: '#10b98120', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Check size={24} color="#34d399" />
              </div>
              <p style={{ fontSize: '20px', color: 'white', lineHeight: 1.55, margin: 0 }}>{backText}</p>
            </div>
          </div>
        </div>
      </div>

      {isFlipped && (
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={(event) => { event.stopPropagation(); handleMastery(1) }}
            style={{ padding: '12px 22px', background: '#ef444420', border: '1px solid #ef444450', borderRadius: '8px', color: '#f87171', cursor: 'pointer', fontWeight: 'bold' }}
          >
            <X size={16} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
            Hard
          </button>
          <button
            onClick={(event) => { event.stopPropagation(); handleMastery(3) }}
            style={{ padding: '12px 22px', background: '#f59e0b20', border: '1px solid #f59e0b50', borderRadius: '8px', color: '#fbbf24', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Medium
          </button>
          <button
            onClick={(event) => { event.stopPropagation(); handleMastery(5) }}
            style={{ padding: '12px 22px', background: '#10b98120', border: '1px solid #10b98150', borderRadius: '8px', color: '#34d399', cursor: 'pointer', fontWeight: 'bold' }}
          >
            <Check size={16} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
            Easy
          </button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '28px' }}>
        <button
          onClick={() => {
            if (currentIndex > 0) {
              setCurrentIndex(currentIndex - 1)
              setIsFlipped(false)
            }
          }}
          disabled={currentIndex === 0}
          title="Previous card"
          style={{ width: '44px', height: '44px', background: '#0f3460', border: 'none', borderRadius: '8px', color: 'white', cursor: currentIndex === 0 ? 'not-allowed' : 'pointer', opacity: currentIndex === 0 ? 0.5 : 1 }}
        >
          <ChevronLeft size={24} />
        </button>
        <span style={{ color: '#9ca3af', fontSize: '14px' }}>{masteredCount}/{cards.length} rated</span>
        <button
          onClick={() => {
            if (currentIndex < cards.length - 1) {
              setCurrentIndex(currentIndex + 1)
              setIsFlipped(false)
            }
          }}
          disabled={currentIndex === cards.length - 1}
          title="Next card"
          style={{ width: '44px', height: '44px', background: '#0f3460', border: 'none', borderRadius: '8px', color: 'white', cursor: currentIndex === cards.length - 1 ? 'not-allowed' : 'pointer', opacity: currentIndex === cards.length - 1 ? 0.5 : 1 }}
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  )
}

export default Flashcards
