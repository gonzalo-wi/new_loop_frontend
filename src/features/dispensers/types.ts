export type DispenserMovementType   = 'LOAD' | 'UNLOAD'
export type DispenserMovementStatus = 'REGISTERED' | 'SENT_TO_AGUAS' | 'AGUAS_ERROR' | 'CANCELLED'

export type AguasOption = {
  id: number
  descripcion: string
}

export type AguasCatalog = {
  vuelta_camion: AguasOption[]
  salida_camion: AguasOption[]
}

export type DispenserMovement = {
  id: string
  type: DispenserMovementType
  routeCode: string
  technician: string
  locationId: number
  stateId: number
  movementDate: string
  status: DispenserMovementStatus
  serials: string[]
  aguasMovementId: string | null
  registeredBy: string
  registeredByUsername: string
  createdAt: string
  updatedAt: string
}

export type DispenserMovementPage = {
  content: DispenserMovement[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export type DispenserMovementFormData = {
  type: DispenserMovementType
  routeCode: string
  technician: string
  locationId?: number
  stateId?: number
  movementDate: string
  serials: string[]
}

export type DispenserMovementParams = {
  type?: DispenserMovementType | ''
  routeCode?: string
  status?: DispenserMovementStatus | ''
  from?: string
  to?: string
  page: number
  size: number
}
