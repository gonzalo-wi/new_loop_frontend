import type { DashboardMetrics, OperationalAlert } from '../types'
import { MOCK_METRICS, MOCK_ALERTS, MOCK_RECENT_MOVEMENTS } from '../mocks/dashboard.mock'
import type { Movement } from '@/features/movements/types'

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  await new Promise((r) => setTimeout(r, 300))
  return { ...MOCK_METRICS }
}

export async function fetchOperationalAlerts(): Promise<OperationalAlert[]> {
  await new Promise((r) => setTimeout(r, 200))
  return [...MOCK_ALERTS]
}

export async function fetchRecentMovements(): Promise<Movement[]> {
  await new Promise((r) => setTimeout(r, 350))
  return [...MOCK_RECENT_MOVEMENTS]
}
