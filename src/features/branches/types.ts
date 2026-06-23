import type { ID, OperationalStatus } from '@/shared/types'

export type Branch = {
  id: ID
  code: string
  name: string
  address: string
  city: string
  province: string
  cuit: string
  vatCondition: string
  status: OperationalStatus
  createdAt: string
  updatedAt: string
}

export type BranchFormData = {
  code: string
  name: string
  address: string
  city: string
  province: string
  cuit: string
  vatCondition: string
  status: 'active' | 'inactive'
}
