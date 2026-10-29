import { Download } from 'lucide-react'
import { csvFileName, downloadCsv, toCsv, type CsvColumn } from '../lib/csv'
import type { DateRange } from '../lib/dateRange'

type Props<T> = {
  table: string
  range: DateRange
  rows: T[]
  columns: CsvColumn<T>[]
}

/** Downloads the rows as they are shown, in the same order (FR-44). */
export function ExportCsvButton<T>({ table, range, rows, columns }: Props<T>) {
  return (
    <button
      type="button"
      onClick={() => downloadCsv(toCsv(rows, columns), csvFileName(table, range))}
      className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 shadow-card transition-colors hover:bg-zinc-50 hover:text-zinc-900"
    >
      <Download size={13} />
      Exportar CSV
    </button>
  )
}
