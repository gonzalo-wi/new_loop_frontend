import { useMemo, useState } from 'react'
import type { TableSort } from '@/shared/types'
import { nextSort, sortRows, type SortValue } from '../lib/sortRows'

/** Sort state for a table whose columns know how to extract their sortable value. */
export function useSortedRows<T>(rows: T[], valueOf: (row: T, key: string) => SortValue, initial: TableSort | null) {
  const [sort, setSort] = useState<TableSort | null>(initial)
  const sorted = useMemo(() => sortRows(rows, sort, valueOf), [rows, sort, valueOf])
  return { rows: sorted, sort, onSortChange: (key: string) => setSort((current) => nextSort(current, key)) }
}
