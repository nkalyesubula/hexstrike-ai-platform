import React, { useEffect, useState } from 'react'
import { Brain, Check, ChevronLeft, ChevronRight, CreditCard, RotateCcw, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { learningService } from '../../services/learningService'
import LoadingSpinner from '../Common/LoadingSpinner'

const MASTERY_STORAGE_KEY = 'flashcard_mastery_by_topic'
const MASTERY_LEVELS = {
  hard: 1,
  medium: 3,
  easy: 5,
}

function Flashcards({ topic }) {
  const [cards, setCards] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [totalCards, setTotalCards] = useState(20)
  const [masteryByTopic, setMasteryByTopic] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(MASTERY_STORAGE_KEY)) || {}
    } catch {
      return {}
    }
  })

  const topicKey = topic || 'default'
  const topicMastery = masteryByTopic[topicKey] || {}

  useEffect(() => {
    loadFlashcards()
  }, [topic])

  const persistMastery = (nextMasteryByTopic) => {
    setMasteryByTopic(nextMasteryByTopic)
    localStorage.setItem(MASTERY_STORAGE_KEY, JSON.stringify(nextMasteryByTopic))
  }

  const loadFlashcards = async (options = {}) => {
    const { ignoreSavedMastery = false } = options
    setLoading(true)
    setCurrentIndex(0)
    setIsFlipped(false)

    try {
      const data = await learningService.getFlashcards(topic, 20)
      const apiCards = Array.isArray(data?.cards) ? data.cards : Array.isArray(data) ? data : []
      const activeCards = ignoreSavedMastery
        ? apiCards
        : apiCards.filter((card) => (topicMastery[card.id] || 0) < MASTERY_LEVELS.easy)
      setCards(activeCards)
      setTotalCards(data?.count || apiCards.length || 20)
    } catch (error) {
      toast.error('Failed to load flashcards')
      setCards([])
      setTotalCards(20)
    } finally {
      setLoading(false)
    }
  }

  const restartFlashcards = async () => {
    const nextMasteryByTopic = { ...masteryByTopic }
    delete nextMasteryByTopic[topicKey]
    persistMastery(nextMasteryByTopic)
    await loadFlashcards({ ignoreSavedMastery: true })
  }

  const handleMastery = async (masteryType) => {
    const currentCard = cards[currentIndex]
    if (!currentCard) {
      return
    }

    const masteryLevel = MASTERY_LEVELS[masteryType]
    const nextMasteryByTopic = {
      ...masteryByTopic,
      [topicKey]: {
        ...topicMastery,
        [currentCard.id]: masteryLevel
      }
    }

    persistMastery(nextMasteryByTopic)
    setIsFlipped(false)

    try {
      await learningService.reviewFlashcard(currentCard.id, masteryLevel)
    } catch (error) {
     
    }

    const remainingCards = cards.filter((_, index) => index !== currentIndex)
    let nextCards = remainingCards

    if (masteryType === 'hard') {
      const insertIndex = Math.min(currentIndex + 3, remainingCards.length)
      nextCards = [...remainingCards]
      nextCards.splice(insertIndex, 0, currentCard)
    }

    if (masteryType === 'medium') {
      const insertIndex = Math.min(currentIndex + 8, remainingCards.length)
      nextCards = [...remainingCards]
      nextCards.splice(insertIndex, 0, currentCard)
    }

    setCards(nextCards)

    if (nextCards.length === 0) {
      setCurrentIndex(0)
      toast.success('You mastered all 20 flashcards in this module.')
      return
    }

    setCurrentIndex(Math.min(currentIndex, nextCards.length - 1))
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
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>All Flashcards Mastered</h3>
        <p style={{ color: '#9ca3af' }}>Reload the set if you want to review this module again.</p>
        <button
          onClick={restartFlashcards}
          title="Reload flashcards"
          style={{ marginTop: '20px', padding: '12px 22px', background: '#0f3460', border: '1px solid #223458', borderRadius: '8px', color: '#d1d5db', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Reload Flashcards
        </button>
      </div>
    )
  }

  const currentCard = cards[currentIndex]
  const masteredCount = Object.values(topicMastery).filter((level) => level >= MASTERY_LEVELS.easy).length
  const frontText = currentCard.front || currentCard.question || currentCard.term
  const backText = currentCard.back || currentCard.answer || currentCard.definition

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '280px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <span style={{ color: '#9ca3af', fontSize: '14px' }}>{cards.length} cards remaining</span>
            <span style={{ color: '#d1d5db', fontSize: '14px', fontWeight: 'bold' }}>{masteredCount}/{totalCards} mastered</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(totalCards, 1)}, minmax(0, 1fr))`, gap: '4px', width: '100%' }}>
            {Array.from({ length: totalCards }, (_, index) => (
              <div
                key={`${topicKey}-segment-${index}`}
                style={{
                  height: '12px',
                  borderRadius: '999px',
                  background: index < masteredCount ? '#10b981' : '#0f3460',
                  border: `1px solid ${index < masteredCount ? '#34d399' : '#223458'}`
                }}
              />
            ))}
          </div>
        </div>
        <button
          onClick={restartFlashcards}
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
            onClick={(event) => { event.stopPropagation(); handleMastery('hard') }}
            style={{ padding: '12px 22px', background: '#ef444420', border: '1px solid #ef444450', borderRadius: '8px', color: '#f87171', cursor: 'pointer', fontWeight: 'bold' }}
          >
            <X size={16} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
            Hard
          </button>
          <button
            onClick={(event) => { event.stopPropagation(); handleMastery('medium') }}
            style={{ padding: '12px 22px', background: '#f59e0b20', border: '1px solid #f59e0b50', borderRadius: '8px', color: '#fbbf24', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Medium
          </button>
          <button
            onClick={(event) => { event.stopPropagation(); handleMastery('easy') }}
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
        <span style={{ color: '#9ca3af', fontSize: '14px' }}>{masteredCount}/{totalCards} mastered</span>
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
