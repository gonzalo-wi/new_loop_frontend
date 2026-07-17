import type { ID, OperationalStatus } from '@/shared/types'

export type Delivery = {
  id: ID
  code: string
  branchId: string
  branchName: string
  branchCode: string
  driverId?: string
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
  driverId?: string
  driver?: string
  truckPlate?: string
  observations?: string
}

// Real-time truck position from Powerfleet, keyed by license plate.
export type FleetLocation = {
  licensePlate: string
  lat: number
  lng: number
  address: string
  speed: number
  engineOn: boolean
  stateIcon: string
  driver: string
  gpsDateTime: string
  direction: number
}
