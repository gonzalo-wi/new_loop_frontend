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

// ── Integration issues (GET /integration-logs/issues) ────────────────────────

export type IntegrationIssueKind = 'RETRIES_EXHAUSTED' | 'STUCK' | 'NEVER_SENT' | 'RETRYING'

export type IntegrationIssue = {
  kind: IntegrationIssueKind
  integration: string          // AGUAS | ODOO
  operation: string | null     // null when no send was ever attempted
  entityName: string           // StockControl | DispenserMovement
  entityId: string
  routeCode: string | null
  entityKind: string | null    // EXIT/ENTRY or LOAD/UNLOAD
  entityDate: string | null
  logId: string | null         // null for NEVER_SENT: nothing to retry
  retryCount: number
  maxRetries: number
  lastError: string | null
  since: string
}

export type IntegrationIssues = {
  summary: { retriesExhausted: number; stuck: number; neverSent: number; retrying: number }
  issues: IntegrationIssue[]
  truncated: boolean           // the backend hit its row limit: list and counts are partial
}
