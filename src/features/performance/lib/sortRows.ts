import type { TableSort } from '@/shared/types'

export type SortValue = number | string | null

/**
 * Sorts by the value a column extracts. Empty values (no data, e.g. no average) always go last,
 * whatever the direction: a missing figure is neither the best nor the worst.
 */
export function sortRows<T>(rows: T[], sort: TableSort | null, valueOf: (row: T, key: string) => SortValue): T[] {
  if (!sort) return rows
  const factor = sort.direction === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const va = valueOf(a, sort.key)
    const vb = valueOf(b, sort.key)
    if (va === null && vb === null) return 0
    if (va === null) return 1
    if (vb === null) return -1
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * factor
    return String(va).localeCompare(String(vb), 'es') * factor
  })
}

/** Clicking the sorted column flips it; another column starts descending (biggest first). */
export function nextSort(current: TableSort | null, key: string): TableSort {
  if (current?.key === key) return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
  return { key, direction: 'desc' }
}
