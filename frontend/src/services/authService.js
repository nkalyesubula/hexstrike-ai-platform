import { api } from './api'

export const authService = {
  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData)
    return response.data
  },

  login: async (username, password) => {
    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)
    
    const response = await api.post('/api/auth/token', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token)
    }
    return response.data
  },

  logout: () => {
    localStorage.removeItem('access_token')
  },

  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me')
    return response.data
  },

  updateProfile: async (userData) => {
    const response = await api.put('/api/auth/me', userData)
    return response.data
  }
}