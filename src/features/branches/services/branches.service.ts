import { api } from '@/shared/lib/api'
import type { Branch, BranchFormData } from '../types'

// ── Backend DTOs ──────────────────────────────────────────────────────────────

type BranchDto = {
  id: string
  name: string
  code: string
  address: string
  locality: string     // API uses "locality", frontend uses "city"
  province: string
  cuit: string
  vatCondition: string
  active: boolean      // API uses boolean, frontend uses OperationalStatus
  createdAt: string
  updatedAt: string
}

type SpringPage<T> = {
  content: T[]
  page: { size: number; number: number; totalElements: number; totalPages: number }
}

type ApiResponse<T> = { data: T; message: string }

// ── Adapters ──────────────────────────────────────────────────────────────────

function fromDto(dto: BranchDto): Branch {
  return {
    id:           dto.id,
    code:         dto.code,
    name:         dto.name,
    address:      dto.address ?? '',
    city:         dto.locality ?? '',
    province:     dto.province ?? '',
    cuit:         dto.cuit ?? '',
    vatCondition: dto.vatCondition ?? '',
    status:       dto.active ? 'active' : 'inactive',
    createdAt:    dto.createdAt,
    updatedAt:    dto.updatedAt,
  }
}

function toCreateDto(data: BranchFormData) {
  return {
    name:         data.name,
    code:         data.code,
    address:      data.address,
    locality:     data.city,
    province:     data.province,
    cuit:         data.cuit,
    vatCondition: data.vatCondition,
  }
}

function toUpdateDto(data: BranchFormData) {
  return toCreateDto(data)
}

function extractMessage(err: unknown): string {
  const e = err as { response?: { data?: { message?: string } } }
  return e?.response?.data?.message ?? 'Error inesperado'
}

// ── Service functions ─────────────────────────────────────────────────────────

export async function fetchBranches(): Promise<Branch[]> {
  const { data } = await api.get<ApiResponse<SpringPage<BranchDto>>>(
    '/branches?size=200&sort=name,asc'
  )
  return data.data.content.map(fromDto)
}

export async function fetchBranchById(id: string): Promise<Branch> {
  const { data } = await api.get<ApiResponse<BranchDto>>(`/branches/${id}`)
  return fromDto(data.data)
}

export async function createBranch(formData: BranchFormData): Promise<Branch> {
  try {
    const { data } = await api.post<ApiResponse<BranchDto>>('/branches', toCreateDto(formData))
    return fromDto(data.data)
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}

export async function updateBranch(id: string, formData: BranchFormData): Promise<Branch> {
  try {
    const { data } = await api.patch<ApiResponse<BranchDto>>(
      `/branches/${id}`,
      toUpdateDto(formData)
    )
    return fromDto(data.data)
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}

// Deactivates the branch (PATCH /branches/{id}/deactivate).
// Named "deleteBranch" to keep BranchesPage unchanged.
export async function deleteBranch(id: string): Promise<void> {
  await api.patch(`/branches/${id}/deactivate`)
}

export async function activateBranch(id: string): Promise<void> {
  await api.patch(`/branches/${id}/activate`)
}
