import { api } from '@/shared/lib/api'
import type { AppVersion, AppVersionFormData } from '../types'

// The endpoint returns the object raw (no { data, message } wrapper) and uses
// its own field names: `latestVersion` for the version, `apkUrl` for the file.
type AppVersionDto = {
  latestVersion?: string | null
  mandatory?: boolean
  notes?: string | null
  apkUrl?: string | null
  fileName?: string | null
  createdAt?: string | null
}

// Tolerate both a raw body and a { data } wrapper, in case some endpoints wrap
// and others don't.
function unwrap(body: unknown): AppVersionDto {
  if (body && typeof body === 'object' && 'data' in body) {
    return (body as { data: AppVersionDto }).data
  }
  return body as AppVersionDto
}

function fromDto(dto: AppVersionDto): AppVersion {
  return {
    version:     dto.latestVersion ?? '',
    mandatory:   !!dto.mandatory,
    notes:       dto.notes ?? undefined,
    downloadUrl: dto.apkUrl ?? undefined,
    fileName:    dto.fileName ?? undefined,
    createdAt:   dto.createdAt ?? undefined,
  }
}

function extractMessage(err: unknown): string {
  const e = err as { response?: { data?: { message?: string } } }
  return e?.response?.data?.message ?? 'No se pudo publicar la versión.'
}

export async function fetchAppVersion(): Promise<AppVersion | null> {
  try {
    const { data } = await api.get('/app/version')
    const dto = unwrap(data)
    // No version published yet → empty state. Never return undefined: React
    // Query treats an undefined queryFn result as an error.
    if (!dto?.latestVersion) return null
    return fromDto(dto)
  } catch (err) {
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
    const { data } = await api.post('/app/version', body, {
      // Let axios set multipart/form-data + boundary from the FormData body.
      headers: { 'Content-Type': 'multipart/form-data' },
      // APKs are tens of MB — the client's default 15s timeout would abort them.
      timeout: 0,
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100))
      },
    })
    const published = fromDto(unwrap(data))
    // Fall back to the submitted version if the response omits it.
    return { ...published, version: published.version || formData.version }
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}
