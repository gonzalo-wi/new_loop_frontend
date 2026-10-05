import { formatDate } from '@/shared/lib/utils'
import type { IntegrationIssue, IntegrationIssueKind } from './types'

// Pure presentation helpers for the "Integraciones" tab: backend codes → Spanish text and colors.

type Badge = { label: string; cls: string; hint: string }

const UNKNOWN_CLS = 'text-zinc-600 bg-zinc-50 border-zinc-200'

const KIND_BADGES: Record<IntegrationIssueKind, Badge> = {
  RETRIES_EXHAUSTED: {
    label: 'Reintentos agotados',
    cls:   'text-red-700 bg-red-50 border-red-200',
    hint:  'Falló y ya no se reintenta solo: hay que reintentar a mano o revisar el dato.',
  },
  STUCK: {
    label: 'Trabado',
    cls:   'text-amber-700 bg-amber-50 border-amber-200',
    hint:  'Se empezó a enviar y nunca hubo respuesta.',
  },
  NEVER_SENT: {
    label: 'Nunca enviado',
    cls:   'text-amber-700 bg-amber-50 border-amber-200',
    hint:  'Quedó listo para enviar pero no hay ningún intento registrado.',
  },
  RETRYING: {
    label: 'Reintentando',
    cls:   'text-blue-700 bg-blue-50 border-blue-200',
    hint:  'Falló, pero el sistema lo sigue reintentando solo.',
  },
}

const INTEGRATION_LABELS: Record<string, string> = {
  AGUAS: 'Aguas',
  ODOO:  'Odoo',
}

// Operation codes come from the backend integration services.
const OPERATION_LABELS: Record<string, string> = {
  OUT:                   'Envío de salida',
  IN:                    'Envío de entrada',
  EQUIPMENT_OUT:         'Carga de equipos',
  EQUIPMENT_IN:          'Descarga de equipos',
  EQUIPMENT_DELETE:      'Anulación del movimiento',
  DISPATCH_CREATE:       'Salida al reparto',
  REPAIR_CREATE:         'Ingreso a reparación',
  NO_NORMALIZADO_CREATE: 'Equipos no normalizados',
}

const ENTITY_KIND_LABELS: Record<string, string> = {
  EXIT:   'Control de salida',
  ENTRY:  'Control de entrada',
  LOAD:   'Carga de dispensers',
  UNLOAD: 'Descarga de dispensers',
}

export function kindBadge(kind: IntegrationIssueKind): Badge {
  return KIND_BADGES[kind] ?? { label: kind, cls: UNKNOWN_CLS, hint: '' }
}

export function integrationLabel(issue: IntegrationIssue): string {
  return INTEGRATION_LABELS[issue.integration] ?? issue.integration
}

export function operationLabel(issue: IntegrationIssue): string {
  if (!issue.operation) return 'Envío'
  return OPERATION_LABELS[issue.operation] ?? issue.operation
}

/** "Control de salida · Rto 12 · 05/10/2026" — what the record is, in the user's terms. */
export function describeRecord(issue: IntegrationIssue): string {
  const kind = issue.entityKind ? ENTITY_KIND_LABELS[issue.entityKind] ?? issue.entityKind : issue.entityName
  return [kind, issue.routeCode, issue.entityDate ? formatDate(issue.entityDate) : null]
    .filter(Boolean)
    .join(' · ')
}

export function attemptsLabel(issue: IntegrationIssue): string {
  if (!issue.logId) return '—'
  return `${issue.retryCount} / ${issue.maxRetries}`
}

// A failed Aguas cancellation can't be retried from here: the movement has to be cancelled again.
const AGUAS_DELETE_OPERATION = 'EQUIPMENT_DELETE'

/**
 * Only issues with a recorded attempt can be retried ("never sent" ones have nothing to repeat), and not a
 * failed cancellation — see retryHint.
 */
export function canRetry(issue: IntegrationIssue): boolean {
  return issue.logId !== null && issue.operation !== AGUAS_DELETE_OPERATION
}

/** What to do instead when there is no retry button. */
export function retryHint(issue: IntegrationIssue): string | null {
  if (issue.operation === AGUAS_DELETE_OPERATION) return 'Volvé a anular el movimiento desde Dispensers'
  if (!issue.logId) return 'Sin intento registrado: revisar el registro'
  return null
}
