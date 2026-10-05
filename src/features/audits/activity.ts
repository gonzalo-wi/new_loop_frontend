import type { AuditLog } from './types'

// Pure helpers for the "Actividad" tab: turns an audit event into a sentence a non-technical user can read.

const VERBS: Record<string, string> = {
  CREATE:     'creó',
  UPDATE:     'modificó',
  DEACTIVATE: 'desactivó',
  ACTIVATE:   'activó',
  CANCEL:     'anuló',
  APPROVE:    'aprobó',
  CORRECT:    'corrigió',
  START:      'tomó',
  COMPLETE:   'completó',
  PUBLISH:    'publicó',
}

const ENTITY_NOUNS: Record<string, string> = {
  Branch:           'la sucursal',
  Product:          'el producto',
  User:             'al usuario',
  StockControl:     'el control de stock',
  Order:            'el pedido',
  Route:            'el reparto',
  OrderableProduct: 'el producto pedible',
  DispenserMovement: 'el movimiento de dispensers',
  AppVersion:       'una versión de la app',
}

// Actions written by the integrations themselves: phrased without an actor.
const SYSTEM_SENTENCES: Record<string, string> = {
  SEND_TO_AGUAS:                'Se envió el control de stock a Aguas',
  AGUAS_ERROR:                  'Falló el envío del control de stock a Aguas',
  SEND_DISPENSER_TO_AGUAS:      'Se envió el movimiento de dispensers a Aguas',
  DISPENSER_AGUAS_ERROR:        'Falló el envío del movimiento de dispensers a Aguas',
  SEND_DISPENSER_TO_ODOO:       'Se envió el movimiento de dispensers a Odoo',
  SEND_NO_NORMALIZADOS_TO_ODOO: 'Se enviaron a Odoo los dispensers no normalizados',
  ODOO_ERROR:                   'Falló el envío del movimiento de dispensers a Odoo',
}

const LOGIN_FAILURE_REASONS: Record<string, string> = {
  BAD_CREDENTIALS:       'contraseña incorrecta',
  UNKNOWN_USER:          'usuario inexistente',
  USER_DISABLED:         'usuario desactivado',
  AUTHENTICATION_FAILED: 'no se pudo autenticar',
}

const MOVEMENT_TYPES: Record<string, string> = {
  LOAD:   'una carga de dispensers',
  UNLOAD: 'una descarga de dispensers',
}

// Fields that identify the record in the user's terms, in order of preference.
const DETAIL_KEYS = ['routeCode', 'code', 'name', 'username'] as const

function parseObject(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null
  try {
    const value: unknown = JSON.parse(raw)
    return value !== null && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

function stringField(obj: Record<string, unknown> | null, key: string): string | null {
  const value = obj?.[key]
  return typeof value === 'string' || typeof value === 'number' ? String(value) : null
}

/** "Rto 12", "Sucursal Centro"…: what the record is called, if the logged values say it. */
export function eventDetail(log: AuditLog): string | null {
  const values = parseObject(log.newValue) ?? parseObject(log.oldValue)
  for (const key of DETAIL_KEYS) {
    const value = stringField(values, key)
    if (value) return value
  }
  return null
}

/** Who did it, as shown in the table: the user's name, else the stored username, else the system. */
export function actorName(log: AuditLog, nameById: (id: string) => string | undefined): string {
  if (log.userId) return nameById(log.userId) ?? log.username ?? 'Usuario eliminado'
  return log.username ?? 'Sistema'
}

/** One sentence describing the event, e.g. "Juan Pérez anuló el movimiento de dispensers". */
export function describeEvent(log: AuditLog, actor: string): string {
  if (log.action === 'LOGIN') return `${actor} ingresó al sistema`
  if (log.action === 'LOGIN_FAILED') {
    const reason = log.reason ? LOGIN_FAILURE_REASONS[log.reason] ?? log.reason : null
    const who    = log.username ? ` con el usuario «${log.username}»` : ''
    return `Intento de ingreso fallido${who}${reason ? ` (${reason})` : ''}`
  }
  if (log.action === 'RETRY_INTEGRATION') return `${actor} reintentó un envío a Aguas/Odoo`
  if (log.action === 'CREATE_DISPENSER_MOVEMENT') {
    const type = stringField(parseObject(log.newValue), 'type')
    return `${actor} registró ${(type && MOVEMENT_TYPES[type]) ?? 'un movimiento de dispensers'}`
  }

  const systemSentence = SYSTEM_SENTENCES[log.action]
  if (systemSentence) return systemSentence

  const verb = VERBS[log.action.split('_')[0]]
  const noun = ENTITY_NOUNS[log.entityName]
  if (verb && noun) return `${actor} ${verb} ${noun}`
  return actor
}

/** Login events carry the reason as a code that the sentence already explains. */
export function showsReasonSeparately(log: AuditLog): boolean {
  return log.action !== 'LOGIN_FAILED' && log.reason !== null
}
