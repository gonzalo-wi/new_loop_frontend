import axios from 'axios'

// In dev, use the Vite proxy (/api → localhost:8080) to avoid CORS.
// In prod, set VITE_API_URL to the real backend origin (e.g. https://api.loop.com).
const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach stored auth token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('loop_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Normalize errors and handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('loop_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
