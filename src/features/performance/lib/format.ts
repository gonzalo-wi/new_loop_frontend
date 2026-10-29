const EMPTY = '—'
const LOCALE = 'es-AR'
const ONE_DECIMAL = { minimumFractionDigits: 0, maximumFractionDigits: 1 }

export function formatCount(value: number): string {
  return value.toLocaleString(LOCALE)
}

export function formatPercent(value: number | null): string {
  return value === null ? EMPTY : `${value.toLocaleString(LOCALE, ONE_DECIMAL)} %`
}

/** A change with its sign: "+3", "−1,5", "0". */
export function formatDelta(value: number): string {
  const text = Math.abs(value).toLocaleString(LOCALE, ONE_DECIMAL)
  if (value > 0) return `+${text}`
  return value < 0 ? `−${text}` : text
}

export function formatMinutes(value: number | null): string {
  return value === null ? EMPTY : `${value.toLocaleString(LOCALE, ONE_DECIMAL)} min`
}
