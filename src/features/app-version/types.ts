// Published mobile-app build. Only `version`/`mandatory` are guaranteed by the
// POST spec; the rest come from GET /app/version and are treated as optional so
// the UI stays resilient to the exact backend shape.
export type AppVersion = {
  version: string
  mandatory: boolean
  notes?: string
  fileName?: string
  size?: number
  url?: string
  downloadUrl?: string
  createdAt?: string
  updatedAt?: string
}

export type AppVersionFormData = {
  version: string
  mandatory: boolean
  notes?: string
  file: File
}
