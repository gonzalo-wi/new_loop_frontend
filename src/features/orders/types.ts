export type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'

export type OrderItem = {
  id: string
  productId: string
  productCode: string
  productName: string
  allowsUnit: boolean
  allowsBulk: boolean
  unitsPerBulk?: number
  unitQuantity: number
  bulkQuantity: number
}

export type Order = {
  id: string
  routeId: string
  routeCode: string
  status: OrderStatus
  orderDate: string
  observations?: string
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

export type OrderPage = {
  content: Order[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export type OrderParams = {
  routeId?: string
  status?: OrderStatus | ''
  from?: string
  to?: string
  page: number
  size: number
}
