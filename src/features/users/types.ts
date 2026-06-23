import type { ID, UserRole, OperationalStatus } from '@/shared/types'

export type User = {
  id: ID
  name: string
  username: string
  role: UserRole
  status: OperationalStatus   // mapped from active: boolean in API
  createdAt: string
  updatedAt: string
}

export type UserFormData = {
  name: string
  username: string
  password?: string      // required on create, omit on update
  role: UserRole
  status: 'active' | 'inactive'
}
