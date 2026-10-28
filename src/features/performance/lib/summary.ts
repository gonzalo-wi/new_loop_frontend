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

export function userLabel(user: Pick<UserPerformance, 'username'>): string {
  return user.username ?? 'Sin usuario'
}
