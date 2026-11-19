import type { UserRole } from '@/shared/types'
import type { StockControl, StockControlStatus } from './types'

const CORRECTION_ROLES: readonly UserRole[] = ['admin', 'supervisor']
const CORRECTABLE_STATUSES: readonly StockControlStatus[] = ['SENT_TO_AGUAS', 'AGUAS_ERROR']

// Allowlists so a future read-only role gets no write buttons by default. Viewers only read
// controls, but they do print their branch's remitos (the backend scopes them to their branch).
const MANAGER_ROLES: readonly UserRole[] = ['admin', 'supervisor', 'controller']
const REMITO_PRINTER_ROLES: readonly UserRole[] = [...MANAGER_ROLES, 'viewer']

export function canManageStockControls(role: UserRole | undefined): boolean {
  return role !== undefined && MANAGER_ROLES.includes(role)
}

export function canPrintRemitos(role: UserRole | undefined): boolean {
  return role !== undefined && REMITO_PRINTER_ROLES.includes(role)
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
