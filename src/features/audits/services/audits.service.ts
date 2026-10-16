import { api } from '@/shared/lib/api'
import type { AuditLog, AuditPage, AuditParams } from '../types'

type AuditLogDto = AuditLog  // backend shape matches frontend type directly

type SpringPage<T> = {
  content: T[]
  page: { size: number; number: number; totalElements: number; totalPages: number }
}

type ApiResponse<T> = { data: T; message: string }

export async function fetchAuditLogs(params: AuditParams): Promise<AuditPage> {
  const q = new URLSearchParams()
  if (params.entityName) q.set('entityName', params.entityName)
  if (params.action)     q.set('action', params.action)
  if (params.entityId)   q.set('entityId', params.entityId)
  if (params.userId)     q.set('userId', params.userId)
  if (params.source)     q.set('source', params.source)
  // The endpoint filters on a timestamp, so a bare date must be widened to the
  // whole day — otherwise "to = today" cuts off at midnight and hides today.
  if (params.from)       q.set('from', `${params.from}T00:00:00`)
  if (params.to)         q.set('to', `${params.to}T23:59:59`)
  q.set('page', String(params.page))
  q.set('size', String(params.size))
  q.set('sort', 'createdAt,desc')

  const { data } = await api.get<ApiResponse<SpringPage<AuditLogDto>>>(
    `/audit-logs?${q.toString()}`
  )

  return {
    content: data.data.content,
    page:    data.data.page,
  }
}
