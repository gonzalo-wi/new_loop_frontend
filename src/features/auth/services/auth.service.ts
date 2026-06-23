import { api } from '@/shared/lib/api'
import { BACKEND_ROLE_MAP } from '@/shared/constants'
import type { LoginCredentials, AuthResponse, LoginResponseDto } from '../types'
import type { UserRole } from '@/shared/types'

export async function loginService(credentials: LoginCredentials): Promise<AuthResponse> {
  const { data } = await api.post<LoginResponseDto>('/auth/login', {
    username: credentials.username,
    password: credentials.password,
  })

  const role: UserRole = BACKEND_ROLE_MAP[data.role] ?? 'controller'

  return {
    user: {
      id:       data.id,
      name:     data.name,
      username: data.username,
      role,
    },
    token: data.token,
  }
}
