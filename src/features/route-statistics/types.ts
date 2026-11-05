import type { ID } from '@/shared/types'

/** Mirrors the backend's RouteStatisticsResponse (spec 006). Seconds; null means "no data". */
export type RouteStatistics = {
  from: string
  to: string
  stay: StaySummary
  stayByBranch: BranchStay[]
  stayByRoute: RouteStay[]
  arrivalsByHour: HourArrivals[]
  arrivalsByDay: DailyArrivals[]
  exitsByDay: DailyExits[]
  morningExitsByRoute: RouteCount[]
  rejectionsByRoute: RouteRejections[]
}

export type StaySummary = {
  avgSeconds: number | null
  medianSeconds: number | null
  stays: number
  /** Arrivals whose exit was not made that day. */
  withoutStay: number
  /** Exit created before the arrival. */
  inconsistent: number
}

export type BranchStay = { branchId: ID; branchName: string; avgSeconds: number | null; stays: number }

export type RouteStay = { routeId: ID; routeCode: string; branchName: string; avgSeconds: number | null; stays: number }

export type ArrivalRoute = { routeCode: string; branchName: string; /** HH:mm:ss */ arrivedAt: string }

/** `routes` is only filled when the range is a single day. */
export type HourArrivals = { hour: number; count: number; routes: ArrivalRoute[] }

export type BranchCount = { branchId: ID; branchName: string; count: number }

export type DailyArrivals = { date: string; total: number; branches: BranchCount[] }

export type RouteRef = { routeCode: string; branchName: string }

export type DailyExits = { date: string; morning: number; dayBefore: number; morningRoutes: RouteRef[] }

export type RouteCount = { routeId: ID; routeCode: string; branchName: string; count: number }

export type ReasonCount = { reason: string; count: number }

export type RouteRejections = {
  routeId: ID | null
  /** Null for old rejections that kept no route. */
  routeCode: string | null
  branchName: string | null
  rejections: number
  rejectedControls: number
  arrivals: number
  /** Rejected controls / arrivals, 0..1. */
  rate: number | null
  reasons: ReasonCount[]
}

export type RouteStatisticsFilters = { from: string; to: string; branchId?: string }
