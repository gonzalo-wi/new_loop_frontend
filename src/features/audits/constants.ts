import { BACKEND_ROLE_MAP, ROLE_LABELS } from '@/shared/constants'

// Entities the backend writes CREATE/UPDATE/DEACTIVATE/etc. audit events for.
// Keep in sync with the domain modules under src/features — every module with
// write endpoints ends up here sooner or later.
export const ENTITY_LABELS: Record<string, string> = {
  Branch:             'Sucursal',
  Product:            'Producto',
  User:               'Usuario',
  StockControl:       'Control de stock',
  Order:              'Pedido',
  Route:              'Reparto',
  OrderableProduct:   'Producto pedible',
  DispenserMovement:  'Movimiento de dispenser',
  IntegrationLog:     'Envío a Aguas/Odoo',
}

export const ENTITY_OPTIONS = [
  { value: '', label: 'Todas las entidades' },
  ...Object.entries(ENTITY_LABELS).map(([value, label]) => ({ value, label })),
]

export const ACTION_LABELS: Record<string, string> = {
  CREATE_BRANCH:      'Crear sucursal',
  UPDATE_BRANCH:      'Actualizar sucursal',
  DEACTIVATE_BRANCH:  'Desactivar sucursal',
  ACTIVATE_BRANCH:    'Activar sucursal',

  CREATE_PRODUCT:     'Crear producto',
  UPDATE_PRODUCT:     'Actualizar producto',
  DEACTIVATE_PRODUCT: 'Desactivar producto',
  ACTIVATE_PRODUCT:   'Activar producto',

  CREATE_USER:        'Crear usuario',
  UPDATE_USER:        'Actualizar usuario',
  DEACTIVATE_USER:    'Desactivar usuario',
  ACTIVATE_USER:      'Activar usuario',

  CREATE_STOCK_CONTROL:  'Crear control de stock',
  UPDATE_STOCK_CONTROL:  'Actualizar control de stock',
  CORRECT_STOCK_CONTROL: 'Corregir control de stock',
  APPROVE_STOCK_CONTROL: 'Aprobar control de stock',

  CREATE_ORDER:   'Crear pedido',
  START_ORDER:    'Tomar pedido',
  COMPLETE_ORDER: 'Completar pedido',

  CREATE_ROUTE:     'Crear reparto',
  UPDATE_ROUTE:     'Actualizar reparto',
  DEACTIVATE_ROUTE: 'Desactivar reparto',
  ACTIVATE_ROUTE:   'Activar reparto',

  CREATE_ORDERABLE_PRODUCT:     'Crear producto pedible',
  UPDATE_ORDERABLE_PRODUCT:     'Actualizar producto pedible',
  DEACTIVATE_ORDERABLE_PRODUCT: 'Desactivar producto pedible',
  ACTIVATE_ORDERABLE_PRODUCT:   'Activar producto pedible',

  CREATE_DISPENSER_MOVEMENT: 'Registrar movimiento de dispenser',
  UPDATE_DISPENSER_MOVEMENT: 'Actualizar movimiento de dispenser',
  CANCEL_DISPENSER_MOVEMENT: 'Cancelar movimiento de dispenser',

  RETRY_INTEGRATION: 'Reintentar envío a Aguas/Odoo',
}

export const ACTION_OPTIONS = [
  { value: '', label: 'Todas las acciones' },
  ...Object.entries(ACTION_LABELS).map(([value, label]) => ({ value, label })),
]

export const SOURCE_LABELS: Record<string, string> = {
  ADMIN_WEB:  'Web',
  MOBILE_APP: 'Mobile',
  SYSTEM:     'Sistema',
}

// Falls back to a readable label for actions not yet in ACTION_LABELS instead
// of showing the raw backend enum string.
export function humanizeAction(action: string): string {
  if (ACTION_LABELS[action]) return ACTION_LABELS[action]
  return action
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ')
}

export function getActionStyle(action: string): string {
  if (action.startsWith('CORRECT_'))
    return 'text-amber-700 bg-amber-50 border border-amber-200'
  if (action.startsWith('CREATE_'))
    return 'text-emerald-700 bg-emerald-50 border border-emerald-200'
  if (action.startsWith('UPDATE_') || action.startsWith('START_'))
    return 'text-blue-700 bg-blue-50 border border-blue-200'
  if (action.startsWith('DEACTIVATE_') || action.startsWith('CANCEL_') || action.startsWith('REJECT_'))
    return 'text-red-700 bg-red-50 border border-red-200'
  if (action.startsWith('ACTIVATE_') || action.startsWith('APPROVE_') || action.startsWith('COMPLETE_'))
    return 'text-emerald-700 bg-emerald-50 border border-emerald-200'
  return 'text-zinc-600 bg-zinc-100 border border-zinc-200'
}

// Parses an audit log's oldValue/newValue JSON string for display; falls back
// to the raw string if it isn't valid JSON.
export function safeParseJson(raw: string | null): string {
  if (!raw) return ''
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
}

// AuditLog.userRole comes straight from the backend enum (e.g. "CONTROLADOR").
export function humanizeRole(role: string | null): string {
  if (!role) return '—'
  const mapped = BACKEND_ROLE_MAP[role]
  return mapped ? ROLE_LABELS[mapped] : role
}
