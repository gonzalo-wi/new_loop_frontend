import { api } from '@/shared/lib/api'
import type { FleetLocation } from '../types'

type ApiResponse<T> = { data: T; message: string }

// Distinguishes the provider being down (502) from a plate that isn't in the
// fleet (404), so the UI can show the right message and decide whether a retry
// makes sense.
export type FleetErrorKind = 'notfound' | 'gateway' | 'unknown'

export class FleetLocationError extends Error {
  kind: FleetErrorKind
  constructor(kind: FleetErrorKind, message: string) {
    super(message)
    this.name = 'FleetLocationError'
    this.kind = kind
  }
}

export async function fetchFleetLocation(licensePlate: string): Promise<FleetLocation> {
  try {
    const { data } = await api.get<ApiResponse<FleetLocation>>(
      `/fleet/location/${encodeURIComponent(licensePlate)}`
    )
    return data.data
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status === 404) {
      throw new FleetLocationError(
        'notfound',
        'No se encontró el camión en el sistema de flota. Revisá que la patente esté bien cargada.'
      )
    }
    if (status === 502) {
      throw new FleetLocationError(
        'gateway',
        'No se pudo conectar con el sistema de flota. Probá de nuevo en unos segundos.'
      )
    }
    throw new FleetLocationError('unknown', 'No se pudo obtener la ubicación del camión.')
  }
}
