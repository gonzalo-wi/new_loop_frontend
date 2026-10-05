import { useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, MapPin, Search } from 'lucide-react'
import { DataTable, Panel } from '@/shared/components/ui'
import { formatDate, formatDateTime } from '@/shared/lib/utils'
import type { TableColumn } from '@/shared/types'
import { fetchSerialHistory } from '../services/serial-history.service'
import { countProblems, deliveryBadge, entryNote, lastKnownLocation, movementTypeLabel } from '../serial-history'
import type { SerialDeliveryStatus, SerialHistoryEntry } from '../types'

function DeliveryBadge({ status, detail }: { status: SerialDeliveryStatus; detail?: string | null }) {
  const badge = deliveryBadge(status)
  return (
    <div className="flex flex-col items-start gap-0.5">
      <span
        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badge.cls}`}
      >
        {badge.label}
      </span>
      {detail && <span className="text-[10px] text-zinc-500">{detail}</span>}
    </div>
  )
}

const columns: TableColumn<SerialHistoryEntry>[] = [
  {
    key: 'date',
    header: 'Fecha',
    render: (e) => (
      <div className="flex flex-col">
        <span className="text-sm tabular-nums text-zinc-800">{formatDate(e.movementDate)}</span>
        <span className="text-[10px] tabular-nums text-zinc-400">registrado {formatDateTime(e.createdAt)}</span>
      </div>
    ),
  },
  {
    key: 'movement',
    header: 'Movimiento',
    render: (e) => (
      <div className="flex flex-col">
        <span className="text-sm font-medium text-zinc-800">
          {movementTypeLabel(e)} · {e.routeCode}
        </span>
        <span className="text-xs text-zinc-500">Técnico: {e.technician}</span>
      </div>
    ),
  },
  {
    key: 'registeredBy',
    header: 'Registró',
    render: (e) => <span className="text-xs text-zinc-600">{e.registeredByUsername ?? '—'}</span>,
  },
  {
    key: 'aguas',
    header: 'Aguas',
    render: (e) => <DeliveryBadge status={e.aguas} />,
  },
  {
    key: 'odoo',
    header: 'Odoo',
    render: (e) => <DeliveryBadge status={e.odoo} detail={e.odooPickingName} />,
  },
  {
    key: 'note',
    header: 'Detalle',
    render: (e) => {
      const note = entryNote(e)
      return note ? <span className="block max-w-xs text-xs text-zinc-600">{note}</span> : null
    },
  },
]

export function SerialHistoryTab() {
  const [input, setInput]   = useState('')
  const [serial, setSerial] = useState('')

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['serial-history', serial],
    queryFn:  () => fetchSerialHistory(serial),
    enabled:  serial !== '',
  })

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    setSerial(input.trim())
  }

  const entries  = data?.entries ?? []
  const location = lastKnownLocation(entries)
  const problems = countProblems(entries)

  return (
    <div>
      <form onSubmit={onSubmit} className="mx-6 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-500">Número de serie del dispenser</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ej: 123456"
            className="h-9 w-72 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-800 shadow-card focus:border-blue-400 focus:outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={input.trim() === ''}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-blue-600 px-3.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Search size={14} />
          Buscar
        </button>
      </form>

      {serial === '' ? (
        <p className="mx-6 mt-5 text-sm text-zinc-500">
          Buscá una serie para ver en qué cargas y descargas apareció y si llegó a Aguas y a Odoo en cada una.
        </p>
      ) : (
        <>
          {data && entries.length > 0 && (
            <div className="mx-6 mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-zinc-700">
              {location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} className="text-zinc-400" />
                  Última ubicación conocida: <strong className="font-medium">{location}</strong>
                </span>
              )}
              <span>
                {entries.length} movimiento{entries.length !== 1 ? 's' : ''}
              </span>
              {problems > 0 && (
                <span className="inline-flex items-center gap-1.5 text-amber-700">
                  <AlertTriangle size={14} />
                  {problems} con problemas de envío
                </span>
              )}
            </div>
          )}

          {data?.truncated && (
            <p className="mx-6 mt-3 text-xs text-amber-700">
              Se muestran los 100 movimientos más recientes; hay más anteriores.
            </p>
          )}

          <Panel className="mx-6 mt-4">
            <DataTable
              columns={columns}
              data={entries}
              isLoading={isLoading}
              isError={isError}
              onRetry={() => refetch()}
              getRowKey={(e) => e.movementId}
              emptyTitle={`No hay movimientos con la serie ${serial}`}
              emptyDescription="Revisá que el número esté bien escrito. Solo aparecen series escaneadas en cargas o descargas."
            />
          </Panel>
        </>
      )}
    </div>
  )
}
