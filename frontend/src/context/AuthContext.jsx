import React, { createContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token')
    if (token) {
      try {
        const userData = await authService.getCurrentUser()
        setUser(userData)
        setIsAuthenticated(true)
      } catch (error) {
        localStorage.removeItem('access_token')
        setUser(null)
        setIsAuthenticated(false)
      }
    }
    setLoading(false)
  }

  const register = async (userData) => {
    const response = await authService.register(userData)
    return response
  }

  const login = async (username, password) => {
    const response = await authService.login(username, password)
    await checkAuth()
    return response
  }

  const logout = () => {
    authService.logout()
    setUser(null)
    setIsAuthenticated(false)
  }

  const updateProfile = async (userData) => {
    const response = await authService.updateProfile(userData)
    setUser(response)
    return response
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated,
      register,
      login,
      logout,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}