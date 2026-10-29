import type { DailyBarsPoint } from '../components/DailyBarsChart'
import { weekStart } from './dateRange'

// Above this many days a bar per day is too thin to read (FR-43).
export const WEEKLY_AFTER_DAYS = 31

/**
 * One point per Monday-to-Sunday week, summing each series. A point keeps the date of its first day in
 * the data, so partial weeks at the edges of the range start where the range starts.
 */
export function groupByWeek(points: DailyBarsPoint[]): DailyBarsPoint[] {
  const weeks = new Map<string, DailyBarsPoint>()
  for (const point of points) {
    const key = weekStart(point.date)
    const week = weeks.get(key) ?? { date: point.date, values: {} }
    for (const [series, value] of Object.entries(point.values)) {
      week.values[series] = (week.values[series] ?? 0) + value
    }
    weeks.set(key, week)
  }
  return [...weeks.values()]
}
