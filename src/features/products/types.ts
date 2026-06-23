import type { ID, OperationalStatus } from '@/shared/types'

export type ProductType = 'returnable' | 'disposable'

export type Product = {
  id: ID
  code: string
  name: string
  description?: string
  displayOrder: number
  packQuantity?: number
  type: ProductType
  unit?: string
  status: OperationalStatus
  createdAt: string
  updatedAt: string
}

export type ProductFormData = {
  code: string
  name: string
  description?: string
  displayOrder: number
  packQuantity?: number
  type: ProductType
  unit?: string
}
