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
  if (params.from)       q.set('from', params.from)
  if (params.to)         q.set('to', params.to)
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
