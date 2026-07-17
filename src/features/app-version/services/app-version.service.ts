import { api } from '@/shared/lib/api'
import type { AppVersion, AppVersionFormData } from '../types'

type ApiResponse<T> = { data: T; message: string }

function extractMessage(err: unknown): string {
  const e = err as { response?: { data?: { message?: string } } }
  return e?.response?.data?.message ?? 'No se pudo publicar la versión.'
}

export async function fetchAppVersion(): Promise<AppVersion | null> {
  try {
    const { data } = await api.get<ApiResponse<AppVersion>>('/app/version')
    return data.data
  } catch (err) {
    // No version published yet is a normal empty state, not an error.
    if ((err as { response?: { status?: number } })?.response?.status === 404) return null
    throw err
  }
}

export async function publishAppVersion(
  formData: AppVersionFormData,
  onProgress?: (percent: number) => void
): Promise<AppVersion> {
  const body = new FormData()
  body.append('version', formData.version)
  body.append('mandatory', String(formData.mandatory))
  if (formData.notes) body.append('notes', formData.notes)
  body.append('file', formData.file)

  try {
    const { data } = await api.post<ApiResponse<AppVersion>>('/app/version', body, {
      // Let axios set multipart/form-data + boundary from the FormData body.
      headers: { 'Content-Type': 'multipart/form-data' },
      // APKs are tens of MB — the client's default 15s timeout would abort them.
      timeout: 0,
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100))
      },
    })
    return data.data
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}
