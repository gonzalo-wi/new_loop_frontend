import type { ID } from '@/shared/types'

// Mirrors GET /performance/* (backend docs/PERFORMANCE.md). Durations are in minutes and rates in
// percent (one decimal); averages, medians and rates are null when there is no data, counts are 0.

export type ControlMetrics = {
  exitsSubmitted: number
  entriesSubmitted: number
  edits: number
  resubmissions: number
  rejectionRounds: number
  firstPassAcceptancePercent: number | null
  avgDriverResponseMinutes: number | null
  corrections: number
  faultyControls: number
  errorPercent: number | null
  controlsWithIntegrationErrors: number
}

export type DispenserMetrics = {
  loads: number
  unloads: number
  serials: number
  excludedUnregistered: number
  excludedUnavailableInOdoo: number
  avgLoadMinutes: number | null
  medianLoadMinutes: number | null
  slowLoads: number
  avgGapMinutes: number | null
  medianGapMinutes: number | null
  pauses: number
  cancellations: number
  movementsWithIntegrationErrors: number
}

export type UserPerformance = {
  // null groups activity whose user is unknown (old records), labelled "Sin usuario".
  userId: ID | null
  username: string | null
  controls: ControlMetrics
  dispensers: DispenserMetrics
}

export type CoverageDay = {
  branchId: ID
  branchName: string
  controlDate: string
  expectedEntries: number
  missingEntries: number
  missingRoutes: string[]
}

export type ReasonKind = 'REJECTION' | 'CORRECTION'

export type ReasonCount = {
  kind: ReasonKind
  reason: string
  userId: ID | null
  username: string | null
  count: number
}

export type PerformanceSummary = {
  from: string
  to: string
  users: UserPerformance[]
  coverage: CoverageDay[]
  topReasons: ReasonCount[]
}

export type DailyPerformance = {
  date: string
  controls: ControlMetrics
  dispensers: DispenserMetrics
}

export type UserTrend = {
  userId: ID
  username: string | null
  from: string
  to: string
  days: DailyPerformance[]
  reasons: ReasonCount[]
}

export type PerformanceFilters = {
  from: string
  to: string
  // Only admins may pick a branch; the backend forces a supervisor's own branch.
  branchId?: ID
}
