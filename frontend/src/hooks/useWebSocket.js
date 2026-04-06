import { useEffect, useRef, useState } from 'react'
import { useAuth } from './useAuth'

export const useWebSocket = () => {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef(null)

  useEffect(() => {
    if (!user) return

    const ws = new WebSocket(`ws://localhost:8000/ws/${user.id}`)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('WebSocket connected')
      setIsConnected(true)
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setMessages(prev => [...prev, data])
    }

    ws.onclose = () => {
      console.log('WebSocket disconnected')
      setIsConnected(false)
    }

    return () => {
      ws.close()
    }
  }, [user])

  const sendMessage = (message) => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify(message))
    }
  }

  return { messages, sendMessage, isConnected }
}