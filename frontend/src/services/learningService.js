import { apiCall } from './api'

async function jsonRequest(endpoint, options = {}) {
  const response = await apiCall(endpoint, options)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data?.detail || 'Learning request failed')
  }

  return data
}

export const learningService = {
  updateProgress: async (moduleId, completed, score, metadata = {}) => {
    return jsonRequest('/api/learning/progress', {
      method: 'POST',
      body: JSON.stringify({
        module_id: moduleId,
        completed,
        score,
        metadata
      })
    })
  },

  getProgress: async () => {
    return jsonRequest('/api/learning/progress')
  },

  generateQuiz: async (topic, difficulty = 'intermediate') => {
    return jsonRequest(`/api/learning/quiz/generate?topic=${encodeURIComponent(topic)}&difficulty=${encodeURIComponent(difficulty)}`)
  },

  submitQuiz: async (submission) => {
    return jsonRequest('/api/learning/quiz/submit', {
      method: 'POST',
      body: JSON.stringify(submission)
    })
  },

  getFlashcards: async (topic, count = 20) => {
    return jsonRequest(`/api/learning/flashcards/${encodeURIComponent(topic)}?count=${count}`)
  },

  reviewFlashcard: async (cardId, difficultyRating) => {
    return jsonRequest('/api/learning/flashcards/review', {
      method: 'POST',
      body: JSON.stringify({
        card_id: cardId,
        difficulty_rating: difficultyRating
      })
    })
  }
}
