import type { ID } from '@/shared/types'

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
