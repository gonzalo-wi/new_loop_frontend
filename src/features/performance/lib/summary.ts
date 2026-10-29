import type { ControlMetrics, CoverageDay, DispenserMetrics, UserPerformance } from '../types'

const PERCENT = 100
const ONE_DECIMAL = 10

export function submittedControls(c: ControlMetrics): number {
  return c.exitsSubmitted + c.entriesSubmitted
}

export function movements(d: DispenserMetrics): number {
  return d.loads + d.unloads
}

/** A user only appears in a table when they did something of that kind in the range. */
export function hasControlActivity(c: ControlMetrics): boolean {
  return submittedControls(c) + c.edits + c.rejectionRounds + c.corrections > 0
}

export function hasDispenserActivity(d: DispenserMetrics): boolean {
  return movements(d) + d.cancellations > 0
}

export type SummaryTotals = {
  submitted: number
  faulty: number
  errorPercent: number | null
  rejectionRounds: number
  movements: number
  slowLoads: number
  missingEntries: number
}

/** Totals for the whole range and scope: the error rate is recomputed from the counts, not averaged. */
export function summaryTotals(users: UserPerformance[], coverage: CoverageDay[]): SummaryTotals {
  const submitted = users.reduce((sum, u) => sum + submittedControls(u.controls), 0)
  const faulty    = users.reduce((sum, u) => sum + u.controls.faultyControls, 0)
  return {
    submitted,
    faulty,
    errorPercent: submitted === 0 ? null : Math.round((faulty / submitted) * PERCENT * ONE_DECIMAL) / ONE_DECIMAL,
    rejectionRounds: users.reduce((sum, u) => sum + u.controls.rejectionRounds, 0),
    movements: users.reduce((sum, u) => sum + movements(u.dispensers), 0),
    slowLoads: users.reduce((sum, u) => sum + u.dispensers.slowLoads, 0),
    missingEntries: coverage.reduce((sum, day) => sum + day.missingEntries, 0),
  }
}

export type TotalsDelta = {
  submitted: number
  faulty: number
  // In percentage points; null when either period has no error rate.
  errorPoints: number | null
  rejectionRounds: number
  movements: number
  missingEntries: number
}

/** Current minus previous period. A previous period with no activity counts as zeros. */
export function totalsDelta(current: SummaryTotals, previous: SummaryTotals): TotalsDelta {
  return {
    submitted: current.submitted - previous.submitted,
    faulty: current.faulty - previous.faulty,
    errorPoints: current.errorPercent === null || previous.errorPercent === null
      ? null
      : Math.round((current.errorPercent - previous.errorPercent) * ONE_DECIMAL) / ONE_DECIMAL,
    rejectionRounds: current.rejectionRounds - previous.rejectionRounds,
    movements: current.movements - previous.movements,
    missingEntries: current.missingEntries - previous.missingEntries,
  }
}

export function userLabel(user: Pick<UserPerformance, 'username'>): string {
  return user.username ?? 'Sin usuario'
}
