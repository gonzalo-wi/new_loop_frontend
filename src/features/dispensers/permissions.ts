import type { UserRole } from '@/shared/types'

// Warehouse operators (controllers) can browse movements but not edit or cancel them
// from the panel; only back office fixes them. UI-only for now: the backend doesn't enforce it yet.
const MOVEMENT_MANAGER_ROLES: readonly UserRole[] = ['admin', 'supervisor']

export function canManageDispenserMovements(role: UserRole | undefined): boolean {
  return role !== undefined && MOVEMENT_MANAGER_ROLES.includes(role)
}
