import { api } from '@/shared/lib/api'
import type { SerialHistory } from '../types'

type ApiResponse<T> = { data: T; message: string }

// Backend shape matches the frontend type directly (same as audit logs).
type SerialHistoryDto = SerialHistory

export async function fetchSerialHistory(serial: string): Promise<SerialHistory> {
  const { data } = await api.get<ApiResponse<SerialHistoryDto>>(
    `/dispenser-movements/serials/${encodeURIComponent(serial)}/history`
  )
  return data.data
}
