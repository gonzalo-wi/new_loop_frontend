export type AuditLog = {
  id: string
  userId: string | null
  userRole: string | null
  action: string
  entityName: string
  entityId: string
  oldValue: string | null
  newValue: string | null
  reason: string | null
  source: string
  ipAddress: string | null
  createdAt: string
}

export type AuditPage = {
  content: AuditLog[]
  page: {
    size: number
    number: number
    totalElements: number
    totalPages: number
  }
}

export type AuditParams = {
  entityName?: string
  action?: string
  entityId?: string
  from?: string
  to?: string
  page: number
  size: number
}
