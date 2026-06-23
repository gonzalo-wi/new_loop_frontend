import type { ID, OperationalStatus } from '@/shared/types'

export type MovementType = 'entry' | 'exit' | 'transfer' | 'adjustment'

export type Movement = {
  id: ID
  type: MovementType
  code: string
  productId: ID
  productName: string
  productCode: string
  fromBranchId?: ID
  fromBranchName?: string
  toBranchId?: ID
  toBranchName?: string
  quantityFull: number
  quantityEmpty: number
  quantityReplacement: number
  status: OperationalStatus
  notes?: string
  operatorId: ID
  operatorName: string
  createdAt: string
  updatedAt: string
}
