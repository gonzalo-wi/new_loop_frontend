import type { ID, OperationalStatus } from '@/shared/types'

export type AuditEventType =
  | 'stock_entry'
  | 'stock_exit'
  | 'stock_transfer'
  | 'stock_adjustment'
  | 'delivery_created'
  | 'delivery_completed'
  | 'delivery_cancelled'
  | 'branch_created'
  | 'branch_updated'
  | 'product_created'
  | 'product_updated'
  | 'user_login'
  | 'user_created'

export type AuditLog = {
  id: ID
  eventType: AuditEventType
  entityType: string
  entityId: ID
  entityLabel: string
  action: string
  description: string
  userId: ID
  userName: string
  userRole: string
  status: OperationalStatus
  metadata?: Record<string, unknown>
  createdAt: string
}
