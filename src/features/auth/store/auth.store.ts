import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '../types'

// Survives the redirect to the login page but not a closed tab, so the notice shows once.
const EXPIRED_KEY = 'loop_session_expired'

export function wasSessionExpired(): boolean {
  return sessionStorage.getItem(EXPIRED_KEY) === '1'
}

export function clearSessionExpired(): void {
  sessionStorage.removeItem(EXPIRED_KEY)
}

type AuthState = {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: AuthUser, token: string) => void
  logout: () => void
  // Like logout, but the login page tells the user their session expired.
  expireSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        localStorage.setItem('loop_token', token)
        set({ user, token, isAuthenticated: true })
      },

      logout: () => {
        localStorage.removeItem('loop_token')
        set({ user: null, token: null, isAuthenticated: false })
      },

      expireSession: () => {
        // Requests still in flight answer 401 after the session ended; they must not set the notice again.
        if (!get().isAuthenticated) return
        sessionStorage.setItem(EXPIRED_KEY, '1')
        get().logout()
      },
    }),
    {
      name: 'loop_auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
