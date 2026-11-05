import { isAxiosError } from 'axios'
import { api } from '@/shared/lib/api'
import type { RouteStatistics, RouteStatisticsFilters } from '../types'

type ApiResponse<T> = { data: T; message: string }

const FORBIDDEN = 403
const BAD_REQUEST = 400

// The backend answers in English; same access rules as the performance page.
const NO_BRANCH_HINT = 'no branch'
const NO_BRANCH_MESSAGE = 'Tu usuario no tiene una sucursal asignada. Pedile a un administrador que te asigne una.'
const FORBIDDEN_MESSAGE = 'Solo administradores y supervisores pueden ver las estadísticas de repartos.'
const INVALID_RANGE_MESSAGE = 'El rango de fechas no es válido (máximo 92 días).'

/** A failure the page can explain to the user; anything else shows the generic error. */
export class RouteStatisticsRequestError extends Error {}

function toRequestError(error: unknown): unknown {
  if (!isAxiosError<{ message?: string }>(error)) return error
  const status = error.response?.status
  const backendMessage = String(error.response?.data?.message ?? '')
  if (status === FORBIDDEN) {
    return new RouteStatisticsRequestError(backendMessage.includes(NO_BRANCH_HINT) ? NO_BRANCH_MESSAGE : FORBIDDEN_MESSAGE)
  }
  if (status === BAD_REQUEST) return new RouteStatisticsRequestError(INVALID_RANGE_MESSAGE)
  return error
}

export async function fetchRouteStatistics(filters: RouteStatisticsFilters): Promise<RouteStatistics> {
  try {
    const res = await api.get<ApiResponse<RouteStatistics>>('/performance/routes', {
      params: { from: filters.from, to: filters.to, branchId: filters.branchId || undefined },
    })
    return res.data.data
  } catch (error) {
    throw toRequestError(error)
  }
}
