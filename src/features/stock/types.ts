import type { ID } from '@/shared/types'

// ── Stock Controls ────────────────────────────────────────────────────────────

export type StockControlType   = 'EXIT' | 'ENTRY'
export type StockControlStatus =
  | 'CONTROLLED'
  | 'PENDING_DRIVER_APPROVAL'
  | 'ACCEPTED_BY_DRIVER'
  | 'REJECTED_BY_DRIVER'
  | 'WITH_DIFFERENCES'
  | 'SENT_TO_AGUAS'
  | 'AGUAS_ERROR'
  | 'CANCELLED'

export type StockControlItem = {
  id: string
  productId: string
  productCode: string
  productName: string
  productUnit: string
  totalQuantity: number
  fullQuantity: number
  exchangeQuantity: number
  differenceQuantity: number | null
  observations?: string
}

export type StockControl = {
  id: string
  type: StockControlType
  status: StockControlStatus
  branchId: string
  branchName: string
  routeId: string
  routeCode: string
  controllerId: string | null
  controlDate: string
  observations?: string
  truckOrdered: boolean
  items: StockControlItem[]
  createdAt: string
  updatedAt: string
}

export type StockControlPage = {
  content: StockControl[]
  page: { size: number; number: number; totalElements: number; totalPages: number }
}

export type StockControlItemFormData = {
  productId: string
  totalQuantity: number
  fullQuantity: number
  exchangeQuantity: number
  observations?: string
}

export type StockControlFormData = {
  type: StockControlType
  branchId: string
  routeId: string
  controllerId?: string
  controlDate?: string
  observations?: string
  truckOrdered?: boolean
  items: StockControlItemFormData[]
}

export type StockControlUpdateData = {
  controllerId?: string
  controlDate?: string
  observations?: string
  truckOrdered?: boolean
  items?: StockControlItemFormData[]
}

export type StockControlParams = {
  type?: StockControlType
  routeId?: string
  controllerId?: string
  from?: string
  to?: string
  page: number
  size: number
}

export type PendingArrivalRoute = {
  routeId: string
  routeCode: string
  branchId: string
  branchName: string
  exitControlId: string
  controlDate: string
}

export type PendingArrivals = {
  date: string
  totalExpected: number
  arrived: number
  pending: number
  pendingRoutes: PendingArrivalRoute[]
}

// ── Stock Levels (existing) ───────────────────────────────────────────────────

export type StockEntry = {
  id: ID
  productId: ID
  productName: string
  productCode: string
  productType: 'returnable' | 'disposable'
  branchId: ID
  branchName: string
  branchCode: string
  quantityFull: number
  quantityEmpty: number
  quantityReplacement: number
  lastMovementAt: string
  updatedAt: string
}
