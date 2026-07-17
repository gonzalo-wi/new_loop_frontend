import { api } from '@/shared/lib/api'
import type {
  StockControl,
  StockControlPage,
  StockControlParams,
  StockControlFormData,
  StockControlUpdateData,
  PendingArrivals,
} from '../types'

type ApiResponse<T> = { data: T; message: string }

type SpringPage<T> = {
  content: T[]
  page: { size: number; number: number; totalElements: number; totalPages: number }
}

function extractMessage(err: unknown): string {
  const e = err as { response?: { data?: { message?: string } } }
  return e?.response?.data?.message ?? 'Error inesperado'
}

export async function fetchStockControls(params: StockControlParams): Promise<StockControlPage> {
  const q = new URLSearchParams()
  if (params.type)         q.set('type', params.type)
  if (params.routeId)      q.set('routeId', params.routeId)
  if (params.controllerId) q.set('controllerId', params.controllerId)
  if (params.from)         q.set('from', params.from)
  if (params.to)           q.set('to', params.to)
  q.set('page', String(params.page))
  q.set('size', String(params.size))
  q.set('sort', 'createdAt,desc')

  const { data } = await api.get<ApiResponse<SpringPage<StockControl>>>(
    `/stock-controls?${q.toString()}`
  )
  return { content: data.data.content, page: data.data.page }
}

export async function fetchStockControlById(id: string): Promise<StockControl> {
  const { data } = await api.get<ApiResponse<StockControl>>(`/stock-controls/${id}`)
  return data.data
}

export async function createStockControl(formData: StockControlFormData): Promise<StockControl> {
  try {
    const { data } = await api.post<ApiResponse<StockControl>>('/stock-controls', {
      type:         formData.type,
      branchId:     formData.branchId,
      routeId:      formData.routeId,
      controllerId: formData.controllerId  || undefined,
      controlDate:  formData.controlDate   || undefined,
      observations: formData.observations  || undefined,
      truckOrdered: formData.truckOrdered,
      items: formData.items.map((item) => ({
        productId:        item.productId,
        totalQuantity:    item.totalQuantity,
        fullQuantity:     item.fullQuantity,
        exchangeQuantity: item.exchangeQuantity,
        observations:     item.observations || undefined,
      })),
    })
    return data.data
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}

export async function fetchPendingArrivals(
  params?: { date?: string; branchId?: string }
): Promise<PendingArrivals> {
  const q = new URLSearchParams()
  if (params?.date)     q.set('date', params.date)
  if (params?.branchId) q.set('branchId', params.branchId)
  const qs = q.toString()
  const { data } = await api.get<ApiResponse<PendingArrivals>>(
    `/stock-controls/pending-arrivals${qs ? `?${qs}` : ''}`
  )
  return data.data
}

export async function updateStockControl(
  id: string,
  payload: StockControlUpdateData
): Promise<StockControl> {
  try {
    const { data } = await api.patch<ApiResponse<StockControl>>(`/stock-controls/${id}`, {
      controllerId: payload.controllerId || undefined,
      controlDate:  payload.controlDate  || undefined,
      observations: payload.observations || undefined,
      truckOrdered: payload.truckOrdered,
      items: payload.items?.map((item) => ({
        productId:        item.productId,
        totalQuantity:    item.totalQuantity,
        fullQuantity:     item.fullQuantity,
        exchangeQuantity: item.exchangeQuantity,
        observations:     item.observations || undefined,
      })),
    })
    return data.data
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}
