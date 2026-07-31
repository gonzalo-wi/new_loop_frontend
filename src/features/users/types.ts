import type { ID, UserRole, OperationalStatus } from '@/shared/types'

export type User = {
  id: ID
  name: string
  username: string
  role: UserRole
  branchId?: string        // required for controller/picker, optional otherwise
  branchName?: string      // resolved by the API for display
  status: OperationalStatus   // mapped from active: boolean in API
  createdAt: string
  updatedAt: string
}

export type UserFormData = {
  name: string
  username: string
  password?: string      // required on create, omit on update
  role: UserRole
  branchId?: string
  status: 'active' | 'inactive'
}

// Roles that require a branch assigned. The backend enforces this too (400),
// this just drives the UI (required field + client-side validation).
export const BRANCH_REQUIRED_ROLES: UserRole[] = ['controller', 'picker']
