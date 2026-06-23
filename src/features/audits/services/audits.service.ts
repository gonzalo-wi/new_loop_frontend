import type { AuditLog } from '../types'
import { MOCK_AUDIT_LOGS } from '../mocks/audits.mock'

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  await new Promise((r) => setTimeout(r, 400))
  return [...MOCK_AUDIT_LOGS].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
