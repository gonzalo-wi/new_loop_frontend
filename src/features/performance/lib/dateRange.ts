import { differenceInCalendarDays, endOfWeek, format, parseISO, startOfWeek } from 'date-fns'

// Same limit as the backend (FR-27a) and the dispenser statistics page.
export const MAX_RANGE_DAYS = 92

const ISO_DAY = 'yyyy-MM-dd'
// Argentina's working week starts on Monday.
const WEEK = { weekStartsOn: 1 } as const

/** Calendar day in local time: toISOString() would roll to tomorrow from 21:00 in Argentina. */
export function toIsoDay(date: Date): string {
  return format(date, ISO_DAY)
}

export function currentWeek(today: Date): { from: string; to: string } {
  return { from: toIsoDay(startOfWeek(today, WEEK)), to: toIsoDay(endOfWeek(today, WEEK)) }
}

/** The message to show for an unusable range, or null when it can be queried. */
export function rangeError(from: string, to: string): string | null {
  if (!from || !to) return 'Elegí un rango de fechas.'
  const days = differenceInCalendarDays(parseISO(to), parseISO(from)) + 1
  if (days < 1) return 'La fecha "Desde" tiene que ser anterior a "Hasta".'
  if (days > MAX_RANGE_DAYS) return `El rango máximo es de ${MAX_RANGE_DAYS} días.`
  return null
}
