const EMPTY = '—'
const LOCALE = 'es-AR'
const ONE_DECIMAL = { minimumFractionDigits: 0, maximumFractionDigits: 1 }

export function formatCount(value: number): string {
  return value.toLocaleString(LOCALE)
}

export function formatPercent(value: number | null): string {
  return value === null ? EMPTY : `${value.toLocaleString(LOCALE, ONE_DECIMAL)} %`
}

export function formatMinutes(value: number | null): string {
  return value === null ? EMPTY : `${value.toLocaleString(LOCALE, ONE_DECIMAL)} min`
}
