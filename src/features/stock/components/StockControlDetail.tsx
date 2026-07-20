import { X, Truck } from 'lucide-react'
import type { StockControl, StockControlType } from '../types'
import { formatDateTime } from '@/shared/lib/utils'
import { RemitoActions } from './RemitoActions'

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  CONTROLLED:              { label: 'Controlado',       cls: 'text-blue-700 bg-blue-50 border-blue-200' },
  PENDING_DRIVER_APPROVAL: { label: 'Pendiente chofer', cls: 'text-amber-700 bg-amber-50 border-amber-200' },
  ACCEPTED_BY_DRIVER:      { label: 'Aprobado',         cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  REJECTED_BY_DRIVER:      { label: 'Rechazado',        cls: 'text-red-700 bg-red-50 border-red-200' },
  WITH_DIFFERENCES:        { label: 'Con diferencias',  cls: 'text-orange-700 bg-orange-50 border-orange-200' },
  SENT_TO_AGUAS:           { label: 'Enviado a Aguas',  cls: 'text-green-700 bg-green-50 border-green-200' },
  AGUAS_ERROR:             { label: 'Error Aguas',      cls: 'text-red-700 bg-red-50 border-red-200' },
  CANCELLED:               { label: 'Cancelado',        cls: 'text-zinc-500 bg-zinc-100 border-zinc-200' },
}

export const TYPE_LABELS: Record<StockControlType, string> = {
  EXIT:  'Salida',
  ENTRY: 'Entrada',
}

type Props = {
  control: StockControl
  onClose: () => void
}

export function StockControlDetail({ control, onClose }: Props) {
  const statusCfg = STATUS_CONFIG[control.status] ?? { label: control.status, cls: 'text-zinc-600 bg-zinc-100 border-zinc-200' }
  const isEntry   = control.type === 'ENTRY'

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-2xl flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                  {TYPE_LABELS[control.type]}
                </span>
                <span
                  className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${statusCfg.cls}`}
                >
                  {statusCfg.label}
                </span>
              </div>
              <h2 className="mt-0.5 text-sm font-semibold text-zinc-900">
                {control.routeCode} · {control.branchName} · {control.controlDate}
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
            <X size={16} />
          </button>
        </div>

        {/* Remito toolbar — exits only */}
        {!isEntry && (
          <div className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50 px-6 py-2.5">
            <RemitoActions controlId={control.id} variant="button" />
            <span className="ml-auto text-[11px] text-zinc-400">
              Remito de carga
            </span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 border-b border-zinc-100 px-6 py-4 text-xs">
            <div>
              <p className="text-zinc-400">Sucursal</p>
              <p className="font-medium text-zinc-800">{control.branchName}</p>
            </div>
            <div>
              <p className="text-zinc-400">Reparto</p>
              <p className="font-medium text-zinc-800">{control.routeCode}</p>
            </div>
            <div>
              <p className="text-zinc-400">Fecha de control</p>
              <p className="font-medium text-zinc-800">{control.controlDate}</p>
            </div>
            <div>
              <p className="text-zinc-400">Registrado</p>
              <p className="font-medium text-zinc-800">{formatDateTime(control.createdAt)}</p>
            </div>
            <div>
              <p className="text-zinc-400">Camión ordenado</p>
              <p className="flex items-center gap-1.5 font-medium">
                <Truck size={13} className={control.truckOrdered ? 'text-emerald-600' : 'text-zinc-400'} />
                <span className={control.truckOrdered ? 'text-emerald-700' : 'text-zinc-500'}>
                  {control.truckOrdered ? 'Sí' : 'No'}
                </span>
              </p>
            </div>
            {control.observations && (
              <div className="col-span-2">
                <p className="text-zinc-400">Observaciones</p>
                <p className="font-medium text-zinc-800">{control.observations}</p>
              </div>
            )}
          </div>

          {/* Items table */}
          <div className="px-6 py-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              Productos ({control.items.length})
            </p>
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
                    </>
                  )}
                  {isEntry && (
                    <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-zinc-500 w-20">Diferencia</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {control.items.map((item) => (
                  <tr key={item.id} className="border-b border-zinc-100">
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
                      </>
                    )}
                    {isEntry && (
                      <td className="px-3 py-2.5 text-right font-mono text-sm">
                        {item.differenceQuantity !== null ? (
                          <span className={item.differenceQuantity !== 0 ? 'text-red-600 font-semibold' : 'text-zinc-700'}>
                            {item.differenceQuantity > 0 ? '+' : ''}{item.differenceQuantity}
                          </span>
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
