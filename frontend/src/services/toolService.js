import { api } from './api'

export const toolService = {
  executeTool: async (toolName, target, parameters = {}) => {
    const response = await api.post(`/api/tools/execute/${toolName}`, {
      target,
      tool_name: toolName,
      parameters
    })
    return response.data
  },

  executeBatch: async (target, tools) => {
    const response = await api.post('/api/tools/batch', {
      target,
      tools,
      auto_mode: true
    })
    return response.data
  },

  getSessionStatus: async (sessionId) => {
    const response = await api.get(`/api/tools/session/${sessionId}`)
    return response.data
  },

  getHistory: async (limit = 10) => {
    const response = await api.get(`/api/tools/history?limit=${limit}`)
    return response.data
  }
}