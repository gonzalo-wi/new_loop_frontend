import type { StockControl } from '../types'

// Same cap as the backend's batch endpoint: a whole day of routes fits.
export const MAX_REMITO_BATCH = 100

/** Mirrors the backend: only exits confirmed with Aguas have a remito. */
export function hasRemito(control: StockControl): boolean {
  return control.type === 'EXIT' && !!control.aguasFormulario && control.aguasNroRemito != null
}

/** Every exit in the list with a remito that nobody printed yet. */
export function notPrintedIds(controls: StockControl[]): string[] {
  return controls.filter((c) => hasRemito(c) && !c.remitoPrinted).map((c) => c.id)
}

/**
 * The selected controls still in the list, in list order. Selections of rows
 * that left the list (filters, refetch) are dropped, so they are never printed.
 */
export function selectedInList(controls: StockControl[], selected: ReadonlySet<string>): StockControl[] {
  return controls.filter((c) => selected.has(c.id) && hasRemito(c))
}

export function alreadyPrintedCount(controls: StockControl[]): number {
  return controls.filter((c) => c.remitoPrinted).length
}
