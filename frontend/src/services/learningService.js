import { api } from './api'

export const learningService = {
  getModules: async () => {
    const response = await api.get('/api/learning/modules')
    return response.data
  },

  getModule: async (moduleId) => {
    const response = await api.get(`/api/learning/modules/${moduleId}`)
    return response.data
  },

  submitModuleQuiz: async (moduleId, answers) => {
    const response = await api.post(`/api/learning/modules/${moduleId}/quiz/submit`, answers)
    return response.data
  },

  getQuizHistory: async (moduleId) => {
    const response = await api.get(`/api/learning/modules/${moduleId}/quiz/history`)
    return response.data
  }
}
