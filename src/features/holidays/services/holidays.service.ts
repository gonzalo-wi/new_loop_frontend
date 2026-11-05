import { api } from '@/shared/lib/api'
import type { Holiday, HolidayFormData } from '../types'

type ApiResponse<T> = { data: T; message: string }

function extractMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { status?: number } }
  if (e?.response?.status === 409) return 'Esa fecha ya está cargada como feriado.'
  if (e?.response?.status === 403) return 'Solo un administrador puede cambiar los feriados.'
  return fallback
}

/** Holidays from the first day of the current month onwards (the backend's default). */
export async function fetchHolidays(): Promise<Holiday[]> {
  const { data } = await api.get<ApiResponse<Holiday[]>>('/holidays')
  return data.data
}

export async function createHoliday(form: HolidayFormData): Promise<Holiday> {
  try {
    const { data } = await api.post<ApiResponse<Holiday>>('/holidays', {
      date: form.date,
      description: form.description.trim() || undefined,
    })
    return data.data
  } catch (err) {
    throw new Error(extractMessage(err, 'No se pudo agregar el feriado.'))
  }
}

export async function deleteHoliday(id: string): Promise<void> {
  try {
    await api.delete(`/holidays/${id}`)
  } catch (err) {
    throw new Error(extractMessage(err, 'No se pudo borrar el feriado.'))
  }
}
