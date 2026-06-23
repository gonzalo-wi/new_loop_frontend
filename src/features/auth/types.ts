import type { ID, UserRole } from '@/shared/types'

export type AuthUser = {
  id: ID
  name: string
  username: string
  role: UserRole
}

export type LoginCredentials = {
  username: string
  password: string
}

export type AuthResponse = {
  user: AuthUser
  token: string
}

// ── Backend DTO (raw response from POST /auth/login) ─────────────────────────
export type LoginResponseDto = {
  token: string
  type: string
  id: string
  name: string
  username: string
  role: string   // e.g. "ADMIN", "CONTROLADOR"
}
