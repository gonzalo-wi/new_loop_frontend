import { X, Truck, Building2, Route, CalendarClock, Clock, MessageSquare, AlertTriangle, XCircle } from 'lucide-react'
import type { StockControl } from '../types'
import { STOCK_CONTROL_STATUS_CONFIG, STOCK_CONTROL_TYPE_LABELS } from '../constants'
import { formatDate, formatDateTime } from '@/shared/lib/utils'
import { RemitoActions } from './RemitoActions'

type Props = {
  control: StockControl
  onClose: () => void
}

export function StockControlDetail({ control, onClose }: Props) {
  const statusCfg = STOCK_CONTROL_STATUS_CONFIG[control.status] ?? { label: control.status, cls: 'text-zinc-600 bg-zinc-100 border-zinc-200' }
  const isEntry   = control.type === 'ENTRY'
  const isExit    = !isEntry

  const totalUnits = control.items.reduce((sum, i) => sum + i.totalQuantity, 0)
  const differencesCount = control.items.filter((i) => (i.differenceQuantity ?? 0) !== 0).length

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-2xl flex-col bg-white shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-zinc-900 text-white">
              {isEntry ? <Route size={16} /> : <Truck size={16} />}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                  {STOCK_CONTROL_TYPE_LABELS[control.type]}
                </span>
                <span
                  className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${statusCfg.cls}`}
                >
                  {statusCfg.label}
                </span>
              </div>
              <h2 className="mt-0.5 text-sm font-semibold text-zinc-900">
                {control.routeCode} · {control.branchName} · {formatDate(control.controlDate)}
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-700">
            <X size={16} />
          </button>
        </div>

        {/* Remito toolbar — exits only */}
        {isExit && (
          <div className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50 px-6 py-2.5">
            <RemitoActions controlId={control.id} variant="button" />
            <span className="ml-auto text-[11px] text-zinc-400">
              Remito de carga
            </span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3 border-b border-zinc-200 bg-zinc-50 p-4">
            <div className="rounded-md border border-zinc-200 border-l-[3px] border-l-blue-500 bg-white px-3.5 py-2.5">
              <p className="text-xs font-medium text-zinc-500">Productos</p>
              <p className="mt-1 text-lg font-bold tabular-nums leading-none text-zinc-950">{control.items.length}</p>
            </div>
            <div className="rounded-md border border-zinc-200 border-l-[3px] border-l-zinc-300 bg-white px-3.5 py-2.5">
              <p className="text-xs font-medium text-zinc-500">Unidades totales</p>
              <p className="mt-1 text-lg font-bold tabular-nums leading-none text-zinc-950">{totalUnits}</p>
            </div>
            <div className={`rounded-md border border-zinc-200 border-l-[3px] bg-white px-3.5 py-2.5 ${differencesCount > 0 ? 'border-l-red-500' : 'border-l-emerald-500'}`}>
              <p className="text-xs font-medium text-zinc-500">Diferencias</p>
              <p className={`mt-1 text-lg font-bold tabular-nums leading-none ${differencesCount > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                {isEntry ? differencesCount : '—'}
              </p>
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 border-b border-zinc-100 px-6 py-4">
            <div className="flex items-start gap-2.5 rounded-md border border-zinc-100 bg-zinc-50/60 px-3 py-2.5">
              <Building2 size={14} className="mt-0.5 shrink-0 text-zinc-400" />
              <div>
                <p className="text-[10px] uppercase tracking-wide text-zinc-400">Sucursal</p>
                <p className="text-sm font-medium text-zinc-800">{control.branchName}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 rounded-md border border-zinc-100 bg-zinc-50/60 px-3 py-2.5">
              <Route size={14} className="mt-0.5 shrink-0 text-zinc-400" />
              <div>
                <p className="text-[10px] uppercase tracking-wide text-zinc-400">Reparto</p>
                <p className="text-sm font-medium text-zinc-800">{control.routeCode}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 rounded-md border border-zinc-100 bg-zinc-50/60 px-3 py-2.5">
              <CalendarClock size={14} className="mt-0.5 shrink-0 text-zinc-400" />
              <div>
                <p className="text-[10px] uppercase tracking-wide text-zinc-400">Fecha de control</p>
                <p className="text-sm font-medium text-zinc-800">{formatDate(control.controlDate)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 rounded-md border border-zinc-100 bg-zinc-50/60 px-3 py-2.5">
              <Clock size={14} className="mt-0.5 shrink-0 text-zinc-400" />
              <div>
                <p className="text-[10px] uppercase tracking-wide text-zinc-400">Registrado</p>
                <p className="text-sm font-medium text-zinc-800">{formatDateTime(control.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 rounded-md border border-zinc-100 bg-zinc-50/60 px-3 py-2.5">
              <Truck size={14} className={`mt-0.5 shrink-0 ${control.truckOrdered ? 'text-emerald-600' : 'text-zinc-300'}`} />
              <div>
                <p className="text-[10px] uppercase tracking-wide text-zinc-400">Camión ordenado</p>
                <p className={`text-sm font-medium ${control.truckOrdered ? 'text-emerald-700' : 'text-zinc-500'}`}>
                  {control.truckOrdered ? 'Sí' : 'No'}
                </p>
              </div>
            </div>
            {control.status === 'REJECTED_BY_DRIVER' && control.driverRejectionReason && (
              <div className="col-span-2 flex items-start gap-2.5 rounded-md border border-red-200 bg-red-50 px-3 py-2.5">
                <XCircle size={14} className="mt-0.5 shrink-0 text-red-600" />
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-red-500">Rechazado por el repartidor</p>
                  <p className="text-sm font-medium text-red-800">{control.driverRejectionReason}</p>
                </div>
              </div>
            )}
            {control.observations && (
              <div className="col-span-2 flex items-start gap-2.5 rounded-md border border-zinc-100 bg-zinc-50/60 px-3 py-2.5">
                <MessageSquare size={14} className="mt-0.5 shrink-0 text-zinc-400" />
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-zinc-400">Observaciones</p>
                  <p className="text-sm font-medium text-zinc-800">{control.observations}</p>
                </div>
              </div>
            )}
          </div>

          {/* Items table */}
          <div className="px-6 py-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                Productos ({control.items.length})
              </p>
              {isEntry && differencesCount > 0 && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-red-600">
                  <AlertTriangle size={11} />
                  {differencesCount} con diferencia
                </span>
              )}
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Producto</th>
                  <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-zinc-500 w-16">Total</th>
                  {/* Exits only track the total — full/exchange are always 0 there */}
                  {isEntry && (
                    <>
                      <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-zinc-500 w-16">Llenos</th>
                      <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-zinc-500 w-20">Recambios</th>
                      <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-zinc-500 w-20">Diferencia</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {control.items.map((item) => {
                  const hasDiff = isEntry && item.differenceQuantity !== null && item.differenceQuantity !== 0
                  return (
                    <tr key={item.id} className={`border-b border-zinc-100 ${hasDiff ? 'bg-red-50/50' : ''}`}>
                      <td className="px-3 py-2.5">
                        <p className="text-sm font-medium text-zinc-900">{item.productName}</p>
                        <p className="font-mono text-[10px] text-zinc-400">{item.productCode}</p>
                        {item.observations && (
                          <p className="mt-0.5 text-xs text-zinc-400">{item.observations}</p>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-sm text-zinc-700">{item.totalQuantity}</td>
                      {isEntry && (
                        <>
                          <td className="px-3 py-2.5 text-right font-mono text-sm text-zinc-700">{item.fullQuantity}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-sm text-zinc-700">{item.exchangeQuantity}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-sm">
                            {item.differenceQuantity !== null ? (
                              <span className={hasDiff ? 'font-semibold text-red-600' : 'text-zinc-700'}>
                                {item.differenceQuantity > 0 ? '+' : ''}{item.differenceQuantity}
                              </span>
                            ) : (
                              <span className="text-zinc-300">—</span>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
