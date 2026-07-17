import { api } from '@/shared/lib/api'
import type { Order, OrderPage, OrderParams } from '../types'

type ApiResponse<T> = { data: T; message: string }

type FlatPage<T> = {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export async function fetchOrders(params: OrderParams): Promise<OrderPage> {
  const q = new URLSearchParams()
  if (params.routeId) q.set('routeId', params.routeId)
  if (params.status)  q.set('status', params.status)
  if (params.from)    q.set('from', params.from)
  if (params.to)      q.set('to', params.to)
  q.set('page', String(params.page))
  q.set('size', String(params.size))
  q.set('sort', 'createdAt,desc')

  const { data } = await api.get<ApiResponse<FlatPage<Order>>>(`/orders?${q.toString()}`)
  return data.data
}

export async function fetchOrderById(id: string): Promise<Order> {
  const { data } = await api.get<ApiResponse<Order>>(`/orders/${id}`)
  return data.data
}
