import { api } from '@/shared/lib/api'
import { BACKEND_ROLE_MAP, FRONTEND_ROLE_MAP } from '@/shared/constants'
import type { User, UserFormData } from '../types'
import type { UserRole } from '@/shared/types'

// ── Backend DTOs ──────────────────────────────────────────────────────────────

type UserDto = {
  id: string
  name: string
  username: string
  role: string     // e.g. "ADMIN", "CONTROLADOR"
  active: boolean
  createdAt: string
  updatedAt: string
}

type SpringPage<T> = {
  content: T[]
  page: { size: number; number: number; totalElements: number; totalPages: number }
}

type ApiResponse<T> = { data: T; message: string }

// ── Adapters ──────────────────────────────────────────────────────────────────

function fromDto(dto: UserDto): User {
  return {
    id:        dto.id,
    name:      dto.name,
    username:  dto.username,
    role:      (BACKEND_ROLE_MAP[dto.role] ?? 'controller') as UserRole,
    status:    dto.active ? 'active' : 'inactive',
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  }
}

function toCreateDto(data: UserFormData) {
  return {
    name:     data.name,
    username: data.username,
    password: data.password,
    role:     FRONTEND_ROLE_MAP[data.role],
  }
}

function toUpdateDto(data: UserFormData) {
  const payload: { name?: string; password?: string; role?: string } = {
    name: data.name,
    role: FRONTEND_ROLE_MAP[data.role],
  }
  if (data.password) payload.password = data.password
  return payload
}

function extractMessage(err: unknown): string {
  const e = err as { response?: { data?: { message?: string } } }
  return e?.response?.data?.message ?? 'Error inesperado'
}

// ── Service functions ─────────────────────────────────────────────────────────

export async function fetchUsers(): Promise<User[]> {
  const { data } = await api.get<ApiResponse<SpringPage<UserDto>>>(
    '/users?size=200&sort=name,asc'
  )
  return data.data.content.map(fromDto)
}

export async function fetchUserById(id: string): Promise<User> {
  const { data } = await api.get<ApiResponse<UserDto>>(`/users/${id}`)
  return fromDto(data.data)
}

export async function createUser(formData: UserFormData): Promise<User> {
  try {
    const { data } = await api.post<ApiResponse<UserDto>>('/users', toCreateDto(formData))
    return fromDto(data.data)
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}

export async function updateUser(id: string, formData: UserFormData): Promise<User> {
  try {
    const { data } = await api.patch<ApiResponse<UserDto>>(
      `/users/${id}`,
      toUpdateDto(formData)
    )
    return fromDto(data.data)
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}

// Deactivates the user. Named "deleteUser" to keep UsersPage unchanged.
export async function deleteUser(id: string): Promise<void> {
  await api.patch(`/users/${id}/deactivate`)
}

export async function activateUser(id: string): Promise<void> {
  await api.patch(`/users/${id}/activate`)
}
