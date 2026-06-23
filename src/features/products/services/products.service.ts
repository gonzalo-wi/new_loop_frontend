import { api } from '@/shared/lib/api'
import type { Product, ProductFormData, ProductType } from '../types'

// ── Backend DTOs ──────────────────────────────────────────────────────────────

type ProductDto = {
  id: string
  code: string
  name: string
  description?: string
  displayOrder: number
  packQuantity?: number
  type: 'RETORNABLE' | 'DESCARTABLE'
  unit?: string
  active: boolean
  createdAt: string
  updatedAt: string
}

type SpringPage<T> = {
  content: T[]
  page: { size: number; number: number; totalElements: number; totalPages: number }
}

type ApiResponse<T> = { data: T; message: string }

// ── Adapters ──────────────────────────────────────────────────────────────────

const TYPE_FROM_API: Record<ProductDto['type'], ProductType> = {
  RETORNABLE:  'returnable',
  DESCARTABLE: 'disposable',
}

const TYPE_TO_API: Record<ProductType, ProductDto['type']> = {
  returnable: 'RETORNABLE',
  disposable: 'DESCARTABLE',
}

function fromDto(dto: ProductDto): Product {
  return {
    id:           dto.id,
    code:         dto.code,
    name:         dto.name,
    description:  dto.description,
    displayOrder: dto.displayOrder,
    packQuantity: dto.packQuantity,
    type:         TYPE_FROM_API[dto.type],
    unit:         dto.unit,
    status:       dto.active ? 'active' : 'inactive',
    createdAt:    dto.createdAt,
    updatedAt:    dto.updatedAt,
  }
}

function toCreateDto(data: ProductFormData) {
  return {
    code:         data.code,
    name:         data.name,
    description:  data.description,
    displayOrder: data.displayOrder,
    packQuantity: data.packQuantity,
    type:         TYPE_TO_API[data.type],
    unit:         data.unit,
  }
}

function toUpdateDto(data: ProductFormData) {
  const { code: _code, ...rest } = toCreateDto(data)
  return rest
}

function extractMessage(err: unknown): string {
  const e = err as { response?: { data?: { message?: string } } }
  return e?.response?.data?.message ?? 'Error inesperado'
}

// ── Service functions ─────────────────────────────────────────────────────────

export async function fetchProducts(): Promise<Product[]> {
  const { data } = await api.get<ApiResponse<SpringPage<ProductDto>>>(
    '/products?size=200'
  )
  return data.data.content
    .map(fromDto)
    .sort((a, b) => a.displayOrder - b.displayOrder)
}

export async function fetchProductById(id: string): Promise<Product> {
  const { data } = await api.get<ApiResponse<ProductDto>>(`/products/${id}`)
  return fromDto(data.data)
}

export async function createProduct(formData: ProductFormData): Promise<Product> {
  try {
    const { data } = await api.post<ApiResponse<ProductDto>>('/products', toCreateDto(formData))
    return fromDto(data.data)
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}

export async function updateProduct(id: string, formData: ProductFormData): Promise<Product> {
  try {
    const { data } = await api.patch<ApiResponse<ProductDto>>(
      `/products/${id}`,
      toUpdateDto(formData)
    )
    return fromDto(data.data)
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}

export async function deleteProduct(id: string): Promise<void> {
  await api.patch(`/products/${id}/deactivate`)
}

export async function activateProduct(id: string): Promise<void> {
  await api.patch(`/products/${id}/activate`)
}

export async function patchProductOrder(id: string, displayOrder: number): Promise<void> {
  await api.patch(`/products/${id}`, { displayOrder })
}
