import { api } from '@/shared/lib/api'
import type {
  DispenserMovement,
  DispenserMovementPage,
  DispenserMovementParams,
  DispenserMovementFormData,
  AguasCatalog,
} from '../types'

type ApiResponse<T> = { data: T; message: string }

type FlatPage<T> = {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

function extractMessage(err: unknown): string {
  const e = err as { response?: { data?: { message?: string } } }
  return e?.response?.data?.message ?? 'Error inesperado'
}

// ── Aguas catalogs ────────────────────────────────────────────────────────────

export async function fetchAguasLocations(): Promise<AguasCatalog> {
  const { data } = await api.get<ApiResponse<{ success: boolean; data: AguasCatalog }>>(
    '/dispenser-movements/aguas/locations'
  )
  return data.data.data
}

export async function fetchAguasStates(): Promise<AguasCatalog> {
  const { data } = await api.get<ApiResponse<{ success: boolean; data: AguasCatalog }>>(
    '/dispenser-movements/aguas/states'
  )
  return data.data.data
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function fetchDispenserMovements(
  params: DispenserMovementParams
): Promise<DispenserMovementPage> {
  const q = new URLSearchParams()
  if (params.type)      q.set('type',      params.type)
  if (params.routeCode) q.set('routeCode', params.routeCode)
  if (params.status)    q.set('status',    params.status)
  if (params.from)      q.set('from',      params.from)
  if (params.to)        q.set('to',        params.to)
  q.set('page', String(params.page))
  q.set('size', String(params.size))
  q.set('sort', 'createdAt,desc')

  const { data } = await api.get<ApiResponse<FlatPage<DispenserMovement>>>(
    `/dispenser-movements?${q.toString()}`
  )
  return data.data
}

export async function createDispenserMovement(
  formData: DispenserMovementFormData
): Promise<DispenserMovement> {
  try {
    const { data } = await api.post<ApiResponse<DispenserMovement>>('/dispenser-movements', {
      type:         formData.type,
      routeCode:    formData.routeCode,
      technician:   formData.technician,
      locationId:   formData.locationId,
      stateId:      formData.stateId,
      movementDate: formData.movementDate,
      serials:      formData.serials,
    })
    return data.data
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}

export async function updateDispenserMovement(
  id: string,
  formData: DispenserMovementFormData
): Promise<DispenserMovement> {
  try {
    const { data } = await api.put<ApiResponse<DispenserMovement>>(`/dispenser-movements/${id}`, {
      type:         formData.type,
      routeCode:    formData.routeCode,
      technician:   formData.technician,
      locationId:   formData.locationId,
      stateId:      formData.stateId,
      movementDate: formData.movementDate,
      serials:      formData.serials,
    })
    return data.data
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}

export async function cancelDispenserMovement(id: string): Promise<DispenserMovement> {
  try {
    const { data } = await api.delete<ApiResponse<DispenserMovement>>(
      `/dispenser-movements/${id}`
    )
    return data.data
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}
