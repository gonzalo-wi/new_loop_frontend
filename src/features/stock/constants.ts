import type { StockControlStatus, StockControlType } from './types'

export const STOCK_CONTROL_STATUS_CONFIG: Record<StockControlStatus, { label: string; cls: string }> = {
  CONTROLLED:              { label: 'Controlado',       cls: 'text-blue-700 bg-blue-50 border-blue-200' },
  PENDING_DRIVER_APPROVAL: { label: 'Pendiente chofer', cls: 'text-amber-700 bg-amber-50 border-amber-200' },
  ACCEPTED_BY_DRIVER:      { label: 'Aprobado',         cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  REJECTED_BY_DRIVER:      { label: 'Rechazado',        cls: 'text-red-700 bg-red-50 border-red-200' },
  WITH_DIFFERENCES:        { label: 'Con diferencias',  cls: 'text-orange-700 bg-orange-50 border-orange-200' },
  SENT_TO_AGUAS:           { label: 'Enviado a Aguas',  cls: 'text-green-700 bg-green-50 border-green-200' },
  AGUAS_ERROR:             { label: 'Error Aguas',      cls: 'text-red-700 bg-red-50 border-red-200' },
  CANCELLED:               { label: 'Cancelado',        cls: 'text-zinc-500 bg-zinc-100 border-zinc-200' },
}

export const STOCK_CONTROL_STATUS_OPTIONS = Object.entries(STOCK_CONTROL_STATUS_CONFIG).map(
  ([value, { label }]) => ({ value, label })
)

export const STOCK_CONTROL_TYPE_LABELS: Record<StockControlType, string> = {
  EXIT:  'Salida',
  ENTRY: 'Entrada',
}
