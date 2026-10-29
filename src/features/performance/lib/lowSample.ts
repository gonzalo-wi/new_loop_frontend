import type { ControlMetrics } from '../types'
import { submittedControls } from './summary'

// Below this many submitted controls one mistake moves the error rate too much to compare users.
export const LOW_SAMPLE_MIN = 10

/** A user with some controls but too few for a reliable error rate (with none there is no rate at all). */
export function isLowSample(c: ControlMetrics): boolean {
  const submitted = submittedControls(c)
  return submitted > 0 && submitted < LOW_SAMPLE_MIN
}
