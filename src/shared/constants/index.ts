import type { UserRole } from '@/shared/types'

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/',
  BRANCHES: '/branches',
  BRANCHES_NEW: '/branches/new',
  BRANCHES_EDIT: '/branches/:id/edit',
  PRODUCTS: '/products',
  PRODUCTS_NEW: '/products/new',
  PRODUCTS_EDIT: '/products/:id/edit',
  STOCK: '/stock',
  STOCK_ENTRIES: '/stock/entries',
  STOCK_EXITS: '/stock/exits',
  MOVEMENTS: '/movements',
  DELIVERIES: '/deliveries',
  TRUCKS: '/trucks',
  AUDITS: '/audits',
  USERS: '/users',
  USERS_NEW: '/users/new',
  USERS_EDIT: '/users/:id/edit',
  ORDERABLE_PRODUCTS: '/orderable-products',
  ORDERS: '/orders',
  DISPENSERS: '/dispensers',
} as const

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  controller: 'Controlador',
  delivery_driver: 'Repartidor',
  picker: 'Picker',
  loader: 'Cargador',
  supervisor: 'Supervisor',
}

// Backend uses uppercase role strings; frontend uses lowercase kebab values
export const BACKEND_ROLE_MAP: Record<string, UserRole> = {
  ADMIN:                'admin',
  CONTROLADOR:          'controller',
  REPARTIDOR:           'delivery_driver',
  PICKER:               'picker',
  CARGADOR_DISPENSERS:  'loader',
  SUPERVISOR:           'supervisor',
}

export const FRONTEND_ROLE_MAP: Record<UserRole, string> = {
  admin:           'ADMIN',
  controller:      'CONTROLADOR',
  delivery_driver: 'REPARTIDOR',
  picker:          'PICKER',
  loader:          'CARGADOR_DISPENSERS',
  supervisor:      'SUPERVISOR',
}

export const PAGE_SIZES = [20, 50, 100] as const
export const DEFAULT_PAGE_SIZE = 20

export const DATE_FORMAT = 'dd/MM/yyyy'
export const DATETIME_FORMAT = 'dd/MM/yyyy HH:mm'

export const VAT_CONDITIONS = [
  { value: 'responsable_inscripto', label: 'Responsable Inscripto' },
  { value: 'monotributista', label: 'Monotributista' },
  { value: 'exento', label: 'Exento' },
  { value: 'consumidor_final', label: 'Consumidor Final' },
] as const

export const PRODUCT_TYPES = [
  { value: 'returnable', label: 'Retornable' },
  { value: 'disposable', label: 'Descartable' },
] as const
