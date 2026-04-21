import { useState, useEffect } from 'react'

export function usePersistedState(key, initialState) {
  const [state, setState] = useState(() => {
    try {
      const storedValue = localStorage.getItem(key)
      if (storedValue !== null) {
        // For string values, don't try to parse JSON
        if (typeof initialState === 'string') {
          return storedValue
        }
        return JSON.parse(storedValue)
      }
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error)
    }
    return initialState
  })

  useEffect(() => {
    try {
      if (typeof state === 'string') {
        localStorage.setItem(key, state)
      } else {
        localStorage.setItem(key, JSON.stringify(state))
      }
    } catch (error) {
      console.error(`Error writing ${key} to localStorage:`, error)
    }
  }, [key, state])

  return [state, setState]
}
