import type { UserRole } from '@/shared/types'
import type { StockControl, StockControlStatus } from './types'

const CORRECTION_ROLES: readonly UserRole[] = ['admin', 'supervisor']
const CORRECTABLE_STATUSES: readonly StockControlStatus[] = ['SENT_TO_AGUAS', 'AGUAS_ERROR']

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
