import type { UserRole } from '@/shared/types'
import type { StockControl, StockControlStatus } from './types'

const CORRECTION_ROLES: readonly UserRole[] = ['admin', 'supervisor']
const CORRECTABLE_STATUSES: readonly StockControlStatus[] = ['SENT_TO_AGUAS', 'AGUAS_ERROR']

// Allowlist so a future read-only role gets no write buttons by default; viewers only read
// (the backend answers 403 to every write and remito for them).
const MANAGER_ROLES: readonly UserRole[] = ['admin', 'supervisor', 'controller']

export function canManageStockControls(role: UserRole | undefined): boolean {
  return role !== undefined && MANAGER_ROLES.includes(role)
}

// Mirrors the backend rule for POST /stock-controls/{id}/correct: once an entry
// reached Aguas it can't be edited, only corrected (with a reason) and re-sent.
export function canCorrectStockControl(
  role: UserRole | undefined,
  control: Pick<StockControl, 'type' | 'status'>
): boolean {
  return (
    role !== undefined &&
    CORRECTION_ROLES.includes(role) &&
    control.type === 'ENTRY' &&
    CORRECTABLE_STATUSES.includes(control.status)
  )
}
