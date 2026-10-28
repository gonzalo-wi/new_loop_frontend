import { isAxiosError } from 'axios'
import { api } from '@/shared/lib/api'
import type { ID } from '@/shared/types'
import type { PerformanceFilters, PerformanceSummary, UserTrend } from '../types'

type ApiResponse<T> = { data: T; message: string }

const FORBIDDEN = 403
const BAD_REQUEST = 400

// The backend answers in English; these are the cases an admin or supervisor can actually hit.
const NO_BRANCH_HINT = 'no branch'
const NO_BRANCH_MESSAGE = 'Tu usuario no tiene una sucursal asignada. Pedile a un administrador que te asigne una.'
const FORBIDDEN_MESSAGE = 'Solo administradores y supervisores pueden ver el desempeño.'
const INVALID_RANGE_MESSAGE = 'El rango de fechas no es válido (máximo 92 días).'

/** A failure the page can explain to the user; anything else shows the generic error. */
export class PerformanceRequestError extends Error {}

function params(filters: PerformanceFilters) {
  return { from: filters.from, to: filters.to, branchId: filters.branchId || undefined }
}

function toRequestError(error: unknown): unknown {
  if (!isAxiosError<{ message?: string }>(error)) return error
  const status = error.response?.status
  const backendMessage = String(error.response?.data?.message ?? '')
  if (status === FORBIDDEN) {
    return new PerformanceRequestError(backendMessage.includes(NO_BRANCH_HINT) ? NO_BRANCH_MESSAGE : FORBIDDEN_MESSAGE)
  }
  if (status === BAD_REQUEST) return new PerformanceRequestError(INVALID_RANGE_MESSAGE)
  return error
}

export async function fetchPerformanceSummary(filters: PerformanceFilters): Promise<PerformanceSummary> {
  try {
    const res = await api.get<ApiResponse<PerformanceSummary>>('/performance/summary', { params: params(filters) })
    return res.data.data
  } catch (error) {
    throw toRequestError(error)
  }
}

export async function fetchUserTrend(userId: ID, filters: PerformanceFilters): Promise<UserTrend> {
  try {
    const res = await api.get<ApiResponse<UserTrend>>(`/performance/users/${userId}`, { params: params(filters) })
    return res.data.data
  } catch (error) {
    throw toRequestError(error)
  }
}
