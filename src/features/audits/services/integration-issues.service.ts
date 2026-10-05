import { api } from '@/shared/lib/api'
import type { IntegrationIssues } from '../types'

type ApiResponse<T> = { data: T; message: string }

// Backend shape matches the frontend type directly (same as audit logs).
type IntegrationIssuesDto = IntegrationIssues

// 409 on retry means the backend had nothing to do (the backend message is in English).
const NOTHING_TO_RETRY_MESSAGE =
  'No había nada para reintentar: el envío ya se hizo, el registro se anuló o no le quedan equipos para enviar. Actualizá la lista.'

function extractMessage(err: unknown): string {
  const e = err as { response?: { status?: number; data?: { message?: string } } }
  if (e?.response?.status === 409) return NOTHING_TO_RETRY_MESSAGE
  return e?.response?.data?.message ?? 'No se pudo reintentar el envío.'
}

export async function fetchIntegrationIssues(): Promise<IntegrationIssues> {
  const { data } = await api.get<ApiResponse<IntegrationIssuesDto>>('/integration-logs/issues')
  return data.data
}

export async function retryIntegration(logId: string): Promise<void> {
  try {
    await api.post(`/integration-logs/${logId}/retry`)
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}
