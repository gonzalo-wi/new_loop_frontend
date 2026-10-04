import type { DispenserMovementType } from '@/features/dispensers/types'

// Business reading: LOAD = installation (dispenser leaves to a customer and stays),
// UNLOAD = withdrawal (customer returned it: cancellation, breakage, no longer wants it).

export type DispenserStatsRange = { from: string; to: string }

export type DispenserVolume = {
  installMovements: number
  withdrawalMovements: number
  installedDispensers: number
  withdrawnDispensers: number
  // installed − withdrawn: growth of the customer installed base in the period
  netDispensers: number
  // withdrawn dispensers per 100 installed
  withdrawalsPer100: number | null
  avgSerialsPerMovement: number | null
  maxSerialsPerMovement: number
}

export type DispenserDailyPoint = {
  date: string // YYYY-MM-DD
  installed: number
  withdrawn: number
  installMovements: number
  withdrawalMovements: number
}

export type DispenserHeatCell = {
  weekday: number // 0 = Monday … 6 = Sunday
  hour: number
  movements: number
}

export type DispenserUserStats = {
  user: string
  movements: number
  installMovements: number
  withdrawalMovements: number
  dispensers: number
  skippedRate: number
  errorRate: number
  excludedRate: number
  // median minutes between consecutive movements of the same user within a shift
  medianGapMinutes: number | null
}

export type DispenserTechnicianStats = {
  technician: string
  routes: number
  installed: number
  withdrawn: number
  movements: number
}

export type DispenserIssueKind = 'skipped' | 'aguas_error' | 'odoo_error' | 'excluded'

export type DispenserIssue = {
  id: string
  createdAt: string
  type: DispenserMovementType
  routeCode: string
  technician: string
  user: string
  kinds: DispenserIssueKind[]
  excludedCount: number
}

export type DispenserQuality = {
  activeMovements: number
  cancelledMovements: number
  sentToAguas: number
  skippedUnregistered: number
  aguasErrors: number
  odooErrors: number
  withExcludedSerials: number
  withoutUser: number
  issues: DispenserIssue[]
}

export type DispenserStats = {
  range: DispenserStatsRange
  volume: DispenserVolume
  daily: DispenserDailyPoint[]
  heatmap: DispenserHeatCell[]
  users: DispenserUserStats[]
  technicians: DispenserTechnicianStats[]
  quality: DispenserQuality
}
