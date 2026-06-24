import type { ID, OperationalStatus } from '@/shared/types'

export type Delivery = {
  id: ID
  code: string
  branchId: string
  branchName: string
  branchCode: string
  driver?: string
  truckPlate?: string
  status: OperationalStatus
  observations?: string
  createdAt: string
  updatedAt: string
}

export type DeliveryFormData = {
  code: string
  branchId: string
  driver?: string
  truckPlate?: string
  observations?: string
}
