import { api } from './api'

export const learningService = {
  updateProgress: async (moduleId, completed, score, metadata = {}) => {
    const response = await api.post('/api/learning/progress', {
      module_id: moduleId,
      completed,
      score,
      metadata
    })
    return response.data
  },

  getProgress: async () => {
    const response = await api.get('/api/learning/progress')
    return response.data
  },

  generateQuiz: async (topic, difficulty = 'intermediate') => {
    const response = await api.get(`/api/learning/quiz/generate?topic=${topic}&difficulty=${difficulty}`)
    return response.data
  },

  submitQuiz: async (submission) => {
    const response = await api.post('/api/learning/quiz/submit', submission)
    return response.data
  },

  getFlashcards: async (topic, count = 20) => {
    const response = await api.get(`/api/learning/flashcards/${topic}?count=${count}`)
    return response.data
  },

  reviewFlashcard: async (cardId, difficultyRating) => {
    const response = await api.post('/api/learning/flashcards/review', {
      card_id: cardId,
      difficulty_rating: difficultyRating
    })
    return response.data
  }
}