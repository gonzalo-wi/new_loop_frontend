import type { SerialDeliveryStatus, SerialHistoryEntry } from './types'

// Pure presentation helpers for the "Trazabilidad de dispensers" tab.

type Badge = { label: string; cls: string }

const UNKNOWN_CLS = 'text-zinc-600 bg-zinc-50 border-zinc-200'

const DELIVERY_BADGES: Record<SerialDeliveryStatus, Badge> = {
  SENT:      { label: 'Enviado',          cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  PENDING:   { label: 'Pendiente',        cls: 'text-blue-700 bg-blue-50 border-blue-200' },
  ERROR:     { label: 'Con error',        cls: 'text-red-700 bg-red-50 border-red-200' },
  EXCLUDED:  { label: 'Excluido',         cls: 'text-amber-700 bg-amber-50 border-amber-200' },
  SKIPPED:   { label: 'Odoo lo dejó afuera', cls: 'text-amber-700 bg-amber-50 border-amber-200' },
  CANCELLED: { label: 'Anulado',          cls: 'text-zinc-500 bg-zinc-50 border-zinc-200' },
}

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  LOAD:   'Carga',
  UNLOAD: 'Descarga',
}

const EXCLUSION_REASONS: Record<string, string> = {
  UNREGISTERED_IN_JMOBILE: 'No registrado en jMobile: no va a Aguas; en Odoo entra como no normalizado.',
  UNAVAILABLE_IN_ODOO:     'No estaba disponible en expedición de Odoo al cargarlo: no se envió a ningún lado.',
}

export function deliveryBadge(status: SerialDeliveryStatus): Badge {
  return DELIVERY_BADGES[status] ?? { label: status, cls: UNKNOWN_CLS }
}

export function movementTypeLabel(entry: SerialHistoryEntry): string {
  return MOVEMENT_TYPE_LABELS[entry.type] ?? entry.type
}

/** Why the serial did not go out as usual, if there is something to explain. */
export function entryNote(entry: SerialHistoryEntry): string | null {
  if (entry.movementStatus === 'CANCELLED') return 'El movimiento se anuló.'
  if (entry.excluded && entry.exclusionReason) {
    return EXCLUSION_REASONS[entry.exclusionReason] ?? entry.exclusionReason
  }
  if (entry.odoo === 'SKIPPED') {
    return 'Aguas lo recibió, pero Odoo lo dejó afuera del despacho porque no estaba en expedición.'
  }
  return null
}

/**
 * Where the dispenser should be now, according to the latest movement that was not cancelled: a load puts it on
 * the route, an unload brings it back to the plant.
 */
export function lastKnownLocation(entries: SerialHistoryEntry[]): string | null {
  const latest = entries.find((e) => e.movementStatus !== 'CANCELLED')
  if (!latest) return null
  return latest.type === 'LOAD' ? `En el reparto ${latest.routeCode}` : 'En planta (descargado)'
}

/** Moves where the serial reached neither destination correctly: the ones someone should look at. */
export function countProblems(entries: SerialHistoryEntry[]): number {
  return entries.filter((e) => e.aguas === 'ERROR' || e.odoo === 'ERROR' || e.odoo === 'SKIPPED').length
}
