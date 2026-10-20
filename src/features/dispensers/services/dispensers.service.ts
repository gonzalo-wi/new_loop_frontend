import { api } from '@/shared/lib/api'
import type {
  DispenserMovement,
  DispenserMovementPage,
  DispenserMovementParams,
  DispenserMovementFormData,
  AguasCatalog,
} from '../types'
import { LATER_RELOAD_MESSAGE } from '../reload'

type ApiResponse<T> = { data: T; message: string }

// Spring-style page: metadata nested under `page` (see api.md).
type PageDto<T> = {
  content: T[]
  page: { size: number; number: number; totalElements: number; totalPages: number }
}

// The backend has no error codes, so its known 409s are recognised by their text and shown in Spanish.
// Any other 409 (e.g. the Aguas delete failed) keeps the backend message.
const DUPLICATE_UNLOAD_HINT = 'already exists'
const DUPLICATE_UNLOAD_MESSAGE =
  'Ya hay una descarga para este reparto en esa fecha. Editá o cancelá la existente en lugar de cargar otra.'
const LATER_RELOAD_HINT = 'has a later reload'
const ALREADY_LOADED_HINT = 'already went out in an earlier load'
// The backend lists the repeated serials as "[SN-1, SN-2]".
const SERIAL_LIST_PATTERN = /\[([^\]]*)\]/

function alreadyLoadedMessage(message: string): string {
  const serials = SERIAL_LIST_PATTERN.exec(message)?.[1]
  return (
    'Estos dispensers ya salieron en otra carga de este reparto para esa fecha' +
    (serials ? `: ${serials}` : '') +
    '. Una recarga solo puede llevar dispensers nuevos.'
  )
}

function extractMessage(err: unknown): string {
  const e = err as { response?: { status?: number; data?: { message?: string } } }
  const message = e?.response?.data?.message
  if (e?.response?.status === 409 && message) {
    if (message.includes(LATER_RELOAD_HINT))   return LATER_RELOAD_MESSAGE
    if (message.includes(ALREADY_LOADED_HINT)) return alreadyLoadedMessage(message)
    if (message.includes(DUPLICATE_UNLOAD_HINT)) return DUPLICATE_UNLOAD_MESSAGE
  }
  return message ?? 'Error inesperado'
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

  const { data } = await api.get<ApiResponse<PageDto<DispenserMovement>>>(
    `/dispenser-movements?${q.toString()}`
  )
  return { content: data.data.content, ...data.data.page }
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
      baggedSerials: formData.baggedSerials,
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
      baggedSerials: formData.baggedSerials,
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
