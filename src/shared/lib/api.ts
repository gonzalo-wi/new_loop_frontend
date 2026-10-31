import axios from 'axios'
import { useAuthStore } from '@/features/auth/store/auth.store'

// In dev, use the Vite proxy (/api → 192.168.0.42:8095) to avoid CORS.
// In prod, set VITE_API_URL to the real backend origin (e.g. https://api.loop.com).
const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
    // Lets the backend audit log tell panel actions apart from mobile app ones.
    'X-Client-App': 'web',
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
    // A wrong password on the login is also a 401: that one is shown on the form instead.
    const isLoginRequest = String(error.config?.url ?? '').includes('/auth/login')
    if (error.response?.status === 401 && !isLoginRequest) {
      // Through the store: only removing loop_token left the persisted state "authenticated", so the
      // login page bounced straight back into the panel. AdminLayout then redirects to the login.
      useAuthStore.getState().expireSession()
    }
    return Promise.reject(error)
  }
)

export default api
