const API_BASE_URL = ''

async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('access_token')
  const isFormBody = options.body instanceof URLSearchParams || options.body instanceof FormData
  
  const headers = {
    ...(isFormBody ? {} : { 'Content-Type': 'application/json' }),
    ...options.headers
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  })
  
  if (response.status === 401) {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }
  
  return response
}

async function request(method, endpoint, data, options = {}) {
  const headers = options.headers || {}
  const isFormBody = data instanceof URLSearchParams || data instanceof FormData
  const response = await apiCall(endpoint, {
    ...options,
    method,
    headers,
    body: data === undefined ? undefined : isFormBody ? data : JSON.stringify(data)
  })

  const contentType = response.headers.get('content-type') || ''
  const responseData = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    throw new Error(responseData?.detail || responseData || 'API request failed')
  }

  return {
    data: responseData,
    status: response.status,
    headers: response.headers
  }
}

const api = {
  get: (endpoint, options) => request('GET', endpoint, undefined, options),
  post: (endpoint, data, options) => request('POST', endpoint, data, options),
  put: (endpoint, data, options) => request('PUT', endpoint, data, options),
  patch: (endpoint, data, options) => request('PATCH', endpoint, data, options),
  delete: (endpoint, options) => request('DELETE', endpoint, undefined, options)
}

export { api, apiCall, API_BASE_URL }
