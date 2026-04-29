const API_BASE_URL = import.meta.env.VITE_API_URL || ''

function buildUrl(endpoint) {
  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint
  }
  return `${API_BASE_URL}${endpoint}`
}

function buildHeaders(body, headers = {}) {
  const token = localStorage.getItem('access_token')
  const finalHeaders = { ...headers }

  if (body !== undefined && !(body instanceof FormData) && !finalHeaders['Content-Type']) {
    finalHeaders['Content-Type'] = 'application/json'
  }

  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`
  }

  return finalHeaders
}

async function request(endpoint, options = {}) {
  const { body, headers, ...rest } = options
  const response = await fetch(buildUrl(endpoint), {
    ...rest,
    headers: buildHeaders(body, headers),
    body
  })

  if (response.status === 401) {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new Error(data?.detail || data?.message || `Request failed with status ${response.status}`)
  }

  return { data, status: response.status, headers: response.headers }
}

const api = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, data, options = {}) => request(endpoint, {
    ...options,
    method: 'POST',
    body: options.body ?? (data instanceof URLSearchParams || data instanceof FormData ? data : JSON.stringify(data)),
    headers: data instanceof URLSearchParams
      ? { 'Content-Type': 'application/x-www-form-urlencoded', ...options.headers }
      : options.headers
  }),
  put: (endpoint, data, options = {}) => request(endpoint, {
    ...options,
    method: 'PUT',
    body: options.body ?? JSON.stringify(data)
  }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' })
}

async function apiCall(endpoint, options = {}) {
  const response = await request(endpoint, options)
  return response.data
}

export { api, apiCall, API_BASE_URL }
