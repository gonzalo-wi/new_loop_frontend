export type ID = string

export type Nullable<T> = T | null

export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type ApiResponse<T> = {
  data: T
  message?: string
}

export type ApiError = {
  message: string
  code?: string
  details?: Record<string, string[]>
}

export type SelectOption = {
  value: string
  label: string
}

export type SortDirection = 'asc' | 'desc'

export type SortConfig = {
  key: string
  direction: SortDirection
}

export type TableColumn<T> = {
  key: string
  header: string
  render: (row: T) => import('react').ReactNode
  width?: string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
}

// Operational status palette — every status maps to one of these
export type OperationalStatus =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'rejected'
  | 'delayed'
  | 'cancelled'
  | 'approved'
  | 'archived'
  | 'warning'

export type UserRole =
  | 'admin'
  | 'controller'
  | 'delivery_driver'
  | 'picker'
  | 'loader'
  | 'supervisor'
