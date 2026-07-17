import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { fetchOrders } from '../services/orders.service'
import { fetchDeliveries } from '@/features/deliveries/services/deliveries.service'
import type { OrderStatus } from '../types'
import {
  PageHeader,
  ActionBar,
  SearchInput,
  DatePicker,
  selectClassName,
  Combobox,
} from '@/shared/components/ui'
import { formatDateTime } from '@/shared/lib/utils'
import { useDebounce } from '@/shared/hooks/useDebounce'

const PAGE_SIZE = 20

const STATUS_CONFIG: Record<OrderStatus, { label: string; cls: string }> = {
  PENDING:     { label: 'Pendiente',    cls: 'text-amber-700 bg-amber-50 border-amber-200' },
  IN_PROGRESS: { label: 'En proceso',   cls: 'text-blue-700 bg-blue-50 border-blue-200' },
  COMPLETED:   { label: 'Completado',   cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
}

const STATUS_OPTIONS = [
  { value: '',            label: 'Todos los estados' },
  { value: 'PENDING',     label: 'Pendiente' },
  { value: 'IN_PROGRESS', label: 'En proceso' },
  { value: 'COMPLETED',   label: 'Completado' },
]

const TODAY = new Date().toISOString().split('T')[0]

export function OrdersPage() {
  const [routeId, setRouteId]     = useState('')
  const [status, setStatus]       = useState<OrderStatus | ''>('')
  const [from, setFrom]           = useState(TODAY)
  const [to, setTo]               = useState(TODAY)
  const [search, setSearch]       = useState('')
  const [page, setPage]           = useState(0)
  const [expandedId, setExpanded] = useState<string | null>(null)

  const debouncedSearch = useDebounce(search)

  function resetPage<T>(setter: (v: T) => void) {
    return (v: T) => { setPage(0); setter(v) }
  }

  const { data: deliveries = [] } = useQuery({
    queryKey: ['deliveries'],
    queryFn:  fetchDeliveries,
  })

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['orders', { routeId, status, from, to, page }],
    queryFn:  () => fetchOrders({ routeId, status, from, to, page, size: PAGE_SIZE }),
    refetchInterval: 30_000,
  })

  const orders = data?.content ?? []
  const meta   = data

  const filtered = debouncedSearch
    ? orders.filter((o) =>
        o.routeCode.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        o.orderDate.includes(debouncedSearch) ||
        o.items.some((i) =>
          i.productName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          i.productCode.toLowerCase().includes(debouncedSearch.toLowerCase())
        )
      )
    : orders

  const hasFilters = !!(routeId || status || from || to)

  function clearFilters() {
    resetPage(setRouteId)('')
    resetPage(setStatus as (v: string) => void)('')
    setFrom('')
    setTo('')
  }

  return (
    <div>
      <PageHeader
        title="Pedidos"
        description="Pedidos realizados por los repartidores. Solo lectura."
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 border-b border-zinc-200 bg-white px-6 py-3">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Reparto</span>
          <Combobox
            value={routeId}
            onChange={resetPage(setRouteId)}
            placeholder="Todos los repartos"
            searchPlaceholder="Buscar reparto..."
            className="w-52"
            options={deliveries.map((d) => ({
              value:    d.id,
              label:    d.code,
              sublabel: d.driver ?? undefined,
            }))}
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Estado</span>
          <select
            value={status}
            onChange={(e) => resetPage(setStatus as (v: string) => void)(e.target.value)}
            className={`${selectClassName} h-8 w-40 text-xs`}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="h-8 w-px self-end bg-zinc-100" />

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Desde</span>
          <DatePicker value={from} onChange={resetPage(setFrom)} placeholder="Fecha inicio" className="w-40" />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Hasta</span>
          <DatePicker value={to} onChange={resetPage(setTo)} placeholder="Fecha fin" className="w-40" />
        </div>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="self-end h-8 rounded-sm border border-zinc-200 bg-white px-3 text-xs text-zinc-500 hover:border-zinc-300 hover:text-zinc-800"
          >
            Limpiar filtros
          </button>
        )}

        <span className="ml-auto self-end pb-0.5 text-xs text-zinc-400">
          {meta ? `${meta.totalElements} pedido${meta.totalElements !== 1 ? 's' : ''}` : ''}
        </span>
      </div>

      <ActionBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por reparto, fecha o producto..."
          className="w-72"
        />
        <span className="text-xs text-zinc-400">
          {filtered.length !== orders.length
            ? `${filtered.length} de ${orders.length} en esta página`
            : `${orders.length} en esta página`}
        </span>
      </ActionBar>

      {/* Table */}
      <div className="border-b border-zinc-200">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <th className="w-8 px-4 py-2.5" />
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 w-28">Fecha</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 w-28">Reparto</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 w-32">Estado</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 w-16 text-right">Items</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 w-36">Registrado</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-400">Cargando...</td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center">
                  <p className="text-sm text-zinc-500">No se pudieron cargar los pedidos.</p>
                  <button onClick={() => refetch()} className="mt-2 text-xs text-zinc-400 underline hover:text-zinc-700">Reintentar</button>
                </td>
              </tr>
            )}
            {!isLoading && !isError && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-zinc-500">
                  No hay pedidos para los filtros seleccionados.
                </td>
              </tr>
            )}
            {filtered.map((order) => {
              const isExpanded  = expandedId === order.id
              const statusCfg   = STATUS_CONFIG[order.status]

              return (
                <>
                  <tr
                    key={order.id}
                    className="cursor-pointer border-b border-zinc-100 bg-white hover:bg-zinc-50"
                    onClick={() => setExpanded(isExpanded ? null : order.id)}
                  >
                    <td className="px-4 py-3 text-zinc-400">
                      {isExpanded
                        ? <ChevronDown size={13} />
                        : <ChevronRight size={13} />}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium tabular-nums text-zinc-700">{order.orderDate}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-medium text-zinc-600">{order.routeCode}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${statusCfg.cls}`}>
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs tabular-nums text-zinc-500">{order.items.length}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-zinc-400">{formatDateTime(order.createdAt)}</span>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr key={`${order.id}-detail`} className="bg-zinc-50">
                      <td />
                      <td colSpan={5} className="px-4 py-4">
                        {order.observations && (
                          <p className="mb-3 text-xs text-zinc-500">
                            <span className="font-medium text-zinc-700">Observaciones:</span>{' '}
                            {order.observations}
                          </p>
                        )}
                        <table className="w-full max-w-xl text-left">
                          <thead>
                            <tr className="border-b border-zinc-200">
                              <th className="pb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Producto</th>
                              <th className="pb-1.5 text-right text-[10px] font-semibold uppercase tracking-wide text-zinc-400 w-20">Unidades</th>
                              <th className="pb-1.5 text-right text-[10px] font-semibold uppercase tracking-wide text-zinc-400 w-20">Bultos</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.map((item) => (
                              <tr key={item.id} className="border-b border-zinc-100">
                                <td className="py-2">
                                  <p className="text-sm font-medium text-zinc-900">{item.productName}</p>
                                  <p className="font-mono text-[10px] text-zinc-400">{item.productCode}</p>
                                </td>
                                <td className="py-2 text-right font-mono text-sm text-zinc-700">
                                  {item.allowsUnit ? item.unitQuantity : <span className="text-zinc-300">—</span>}
                                </td>
                                <td className="py-2 text-right font-mono text-sm text-zinc-700">
                                  {item.allowsBulk
                                    ? (
                                      <span>
                                        {item.bulkQuantity}
                                        {item.unitsPerBulk && (
                                          <span className="ml-1 text-[10px] text-zinc-400">
                                            ×{item.unitsPerBulk}u
                                          </span>
                                        )}
                                      </span>
                                    )
                                    : <span className="text-zinc-300">—</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-3">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="h-8 rounded-sm border border-zinc-200 bg-white px-4 text-xs text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Anterior
          </button>
          <span className="text-xs text-zinc-500">
            Página {meta.number + 1} de {meta.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(meta.totalPages - 1, p + 1))}
            disabled={page >= meta.totalPages - 1}
            className="h-8 rounded-sm border border-zinc-200 bg-white px-4 text-xs text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  )
}
