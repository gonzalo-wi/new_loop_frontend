import { api } from '@/shared/lib/api'
import type { Delivery, DeliveryFormData } from '../types'

// ── Backend DTOs ──────────────────────────────────────────────────────────────

type RouteDto = {
  id: string
  code: string
  branchId: string
  branchName: string
  branchCode: string
  driverId?: string
  driver?: string
  truckPlate?: string
  active: boolean
  observations?: string
  createdAt: string
  updatedAt: string
}

type SpringPage<T> = {
  content: T[]
  page: { size: number; number: number; totalElements: number; totalPages: number }
}

type ApiResponse<T> = { data: T; message: string }

// ── Adapters ──────────────────────────────────────────────────────────────────

function fromDto(dto: RouteDto): Delivery {
  return {
    id:           dto.id,
    code:         dto.code,
    branchId:     dto.branchId,
    branchName:   dto.branchName,
    branchCode:   dto.branchCode,
    driverId:     dto.driverId,
    driver:       dto.driver,
    truckPlate:   dto.truckPlate,
    status:       dto.active ? 'active' : 'inactive',
    observations: dto.observations,
    createdAt:    dto.createdAt,
    updatedAt:    dto.updatedAt,
  }
}

function toCreateDto(data: DeliveryFormData) {
  return {
    code:         data.code,
    branchId:     data.branchId,
    driverId:     data.driverId     || undefined,
    driver:       data.driver       || undefined,
    truckPlate:   data.truckPlate   || undefined,
    observations: data.observations || undefined,
  }
}

function toUpdateDto(data: DeliveryFormData) {
  return {
    code:         data.code,
    branchId:     data.branchId,
    driverId:     data.driverId     || undefined,
    driver:       data.driver       || undefined,
    truckPlate:   data.truckPlate   || undefined,
    observations: data.observations || undefined,
  }
}

function extractMessage(err: unknown): string {
  const e = err as { response?: { data?: { message?: string } } }
  return e?.response?.data?.message ?? 'Error inesperado'
}

// ── Service functions ─────────────────────────────────────────────────────────

const PAGE_SIZE = 200

// Trae TODOS los repartos recorriendo las páginas del backend. La página necesita el set
// completo: las métricas, los filtros y la búsqueda se resuelven en el cliente, así el buscador
// encuentra un reparto aunque haya cientos. El backend ya devuelve orden natural (Rto 1, Rto 2
// ... Rto 10), por eso no mandamos `sort`.
export async function fetchDeliveries(): Promise<Delivery[]> {
  const first = await api.get<ApiResponse<SpringPage<RouteDto>>>(`/routes?size=${PAGE_SIZE}&page=0`)
  const { content, page } = first.data.data
  const all = [...content]
  for (let p = 1; p < page.totalPages; p++) {
    const next = await api.get<ApiResponse<SpringPage<RouteDto>>>(`/routes?size=${PAGE_SIZE}&page=${p}`)
    all.push(...next.data.data.content)
  }
  return all.map(fromDto)
}

export async function createDelivery(formData: DeliveryFormData): Promise<Delivery> {
  try {
    const { data } = await api.post<ApiResponse<RouteDto>>('/routes', toCreateDto(formData))
    return fromDto(data.data)
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}

export async function updateDelivery(id: string, formData: DeliveryFormData): Promise<Delivery> {
  try {
    const { data } = await api.patch<ApiResponse<RouteDto>>(
      `/routes/${id}`,
      toUpdateDto(formData)
    )
    return fromDto(data.data)
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}

export async function deactivateDelivery(id: string): Promise<void> {
  await api.patch(`/routes/${id}/deactivate`)
}

export async function activateDelivery(id: string): Promise<void> {
  await api.patch(`/routes/${id}/activate`)
}
