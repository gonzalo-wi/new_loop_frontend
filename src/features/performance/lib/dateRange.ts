import { addDays, differenceInCalendarDays, endOfWeek, format, isValid, parse, parseISO, startOfWeek } from 'date-fns'

// Same limit as the backend (FR-27a) and the dispenser statistics page.
export const MAX_RANGE_DAYS = 92

const ISO_DAY = 'yyyy-MM-dd'
// Argentina's working week starts on Monday.
const WEEK = { weekStartsOn: 1 } as const

/** Calendar day in local time: toISOString() would roll to tomorrow from 21:00 in Argentina. */
export function toIsoDay(date: Date): string {
  return format(date, ISO_DAY)
}

export type DateRange = { from: string; to: string }

export function currentWeek(today: Date): DateRange {
  return { from: toIsoDay(startOfWeek(today, WEEK)), to: toIsoDay(endOfWeek(today, WEEK)) }
}

/** A real calendar day written as yyyy-MM-dd (parseISO alone accepts "2026-1-5" or "2026-02-30"). */
export function isIsoDay(value: string): boolean {
  const date = parse(value, ISO_DAY, new Date())
  return isValid(date) && toIsoDay(date) === value
}

export function rangeDays(range: DateRange): number {
  return differenceInCalendarDays(parseISO(range.to), parseISO(range.from)) + 1
}

/** The same number of days, ending the day before the range starts. */
export function previousPeriod(range: DateRange): DateRange {
  const to = addDays(parseISO(range.from), -1)
  return { from: toIsoDay(addDays(to, 1 - rangeDays(range))), to: toIsoDay(to) }
}

/**
 * After the user picks one end, moves the other one if needed so the range stays queryable: an
 * invalid range in the address would be thrown away (FR-40), losing what they just picked.
 */
export function fitRange(range: DateRange, picked: 'from' | 'to'): DateRange {
  const days = rangeDays(range)
  if (days >= 1 && days <= MAX_RANGE_DAYS) return range
  const span = days < 1 ? 0 : MAX_RANGE_DAYS - 1
  return picked === 'from'
    ? { from: range.from, to: toIsoDay(addDays(parseISO(range.from), span)) }
    : { from: toIsoDay(addDays(parseISO(range.to), -span)), to: range.to }
}

/** Monday of the day's week, as yyyy-MM-dd. */
export function weekStart(isoDay: string): string {
  return toIsoDay(startOfWeek(parseISO(isoDay), WEEK))
}

/** The message to show for an unusable range, or null when it can be queried. */
export function rangeError(from: string, to: string): string | null {
  if (!from || !to) return 'Elegí un rango de fechas.'
  const days = rangeDays({ from, to })
  if (days < 1) return 'La fecha "Desde" tiene que ser anterior a "Hasta".'
  if (days > MAX_RANGE_DAYS) return `El rango máximo es de ${MAX_RANGE_DAYS} días.`
  return null
}
