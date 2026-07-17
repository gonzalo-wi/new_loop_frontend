import type { OperationalStatus } from '@/shared/types'

export type OrderableProduct = {
  id: string
  code: string
  name: string
  description?: string
  allowsUnit: boolean
  allowsBulk: boolean
  unitsPerBulk?: number
  status: OperationalStatus
  createdAt: string
  updatedAt: string
}

export type OrderableProductFormData = {
  code: string
  name: string
  description?: string
  allowsUnit: boolean
  allowsBulk: boolean
  unitsPerBulk?: number
}
