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
  companyName?: string   // razón social — encabezado del remito PDF
  phone?: string         // teléfono de contacto — encabezado del remito PDF
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
  companyName?: string
  phone?: string
  status: 'active' | 'inactive'
}
