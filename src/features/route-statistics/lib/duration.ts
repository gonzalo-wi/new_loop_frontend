const EMPTY = '—'
const SECONDS_PER_MINUTE = 60
const MINUTES_PER_HOUR = 60
const PERCENT = 100

/** "2 h 15 min", "45 min", "3 h"; "—" when there is no data. */
export function formatDuration(seconds: number | null): string {
  if (seconds === null) return EMPTY
  const totalMinutes = Math.round(seconds / SECONDS_PER_MINUTE)
  const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR)
  const minutes = totalMinutes % MINUTES_PER_HOUR
  if (hours === 0) return `${minutes} min`
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`
}

/** A 0..1 rate as "33 %"; "—" when there is no data. */
export function formatRate(rate: number | null): string {
  return rate === null ? EMPTY : `${Math.round(rate * PERCENT)} %`
}

/** "14:05" from the backend's "14:05:00". */
export function formatClock(time: string): string {
  return time.slice(0, 5)
}
