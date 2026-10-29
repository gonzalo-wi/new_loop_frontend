import type { DateRange } from './dateRange'

export type CsvValue = number | string | null

export type CsvColumn<T> = { header: string; exportValue: (row: T) => CsvValue }

// Excel in Spanish (Argentina) splits on ";" and reads "," as the decimal mark; the byte order mark
// makes it read the file as UTF-8, so accents survive (FR-44).
const BOM = '﻿'
const SEPARATOR = ';'
const LINE = '\r\n'
const NEEDS_QUOTES = /[;"\r\n]/
// A cell starting with one of these is run as a formula by Excel.
const FORMULA_START = /^[=+\-@]/
const REVOKE_AFTER_MS = 10_000

function cell(value: CsvValue): string {
  if (value === null) return ''
  if (typeof value === 'number') return String(value).replace('.', ',')
  const text = FORMULA_START.test(value) ? `'${value}` : value
  return NEEDS_QUOTES.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const lines = [
    columns.map((c) => cell(c.header)),
    ...rows.map((row) => columns.map((c) => cell(c.exportValue(row)))),
  ]
  return BOM + lines.map((line) => line.join(SEPARATOR)).join(LINE) + LINE
}

export function csvFileName(table: string, range: DateRange): string {
  return `desempeno-${table}-${range.from}-a-${range.to}.csv`
}

/** Hands the text to the browser as a file download. */
export function downloadCsv(text: string, fileName: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  // Revoking right away can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_AFTER_MS)
}
