import { api } from '@/shared/lib/api'
import type { OrderableProduct, OrderableProductFormData } from '../types'

type ApiResponse<T> = { data: T; message: string }

type FlatPage<T> = {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

type ProductDto = {
  id: string
  code: string
  name: string
  description?: string
  allowsUnit: boolean
  allowsBulk: boolean
  unitsPerBulk?: number
  active: boolean
  createdAt: string
  updatedAt: string
}

function fromDto(dto: ProductDto): OrderableProduct {
  return {
    id:           dto.id,
    code:         dto.code,
    name:         dto.name,
    description:  dto.description,
    allowsUnit:   dto.allowsUnit,
    allowsBulk:   dto.allowsBulk,
    unitsPerBulk: dto.unitsPerBulk,
    status:       dto.active ? 'active' : 'inactive',
    createdAt:    dto.createdAt,
    updatedAt:    dto.updatedAt,
  }
}

function extractMessage(err: unknown): string {
  const e = err as { response?: { data?: { message?: string } } }
  return e?.response?.data?.message ?? 'Error inesperado'
}

export async function fetchOrderableProducts(): Promise<OrderableProduct[]> {
  const { data } = await api.get<ApiResponse<FlatPage<ProductDto>>>(
    '/orderable-products?size=200&sort=name,asc'
  )
  return data.data.content.map(fromDto)
}

export async function createOrderableProduct(
  formData: OrderableProductFormData
): Promise<OrderableProduct> {
  try {
    const { data } = await api.post<ApiResponse<ProductDto>>('/orderable-products', {
      code:         formData.code,
      name:         formData.name,
      description:  formData.description || undefined,
      allowsUnit:   formData.allowsUnit,
      allowsBulk:   formData.allowsBulk,
      unitsPerBulk: formData.allowsBulk ? formData.unitsPerBulk : undefined,
    })
    return fromDto(data.data)
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}

export async function updateOrderableProduct(
  id: string,
  formData: Partial<OrderableProductFormData>
): Promise<OrderableProduct> {
  try {
    const { data } = await api.patch<ApiResponse<ProductDto>>(`/orderable-products/${id}`, {
      name:         formData.name,
      description:  formData.description || undefined,
      allowsUnit:   formData.allowsUnit,
      allowsBulk:   formData.allowsBulk,
      unitsPerBulk: formData.allowsBulk ? formData.unitsPerBulk : undefined,
    })
    return fromDto(data.data)
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}

export async function deactivateOrderableProduct(id: string): Promise<void> {
  await api.patch(`/orderable-products/${id}/deactivate`)
}

export async function activateOrderableProduct(id: string): Promise<void> {
  await api.patch(`/orderable-products/${id}/activate`)
}
