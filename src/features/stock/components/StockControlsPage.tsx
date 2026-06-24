import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Eye } from 'lucide-react'
import { fetchStockControls } from '../services/stock-controls.service'
import type { StockControl, StockControlType } from '../types'
import {
  PageHeader,
  ActionBar,
  ActionButton,
  SearchInput,
  DatePicker,
  selectClassName,
} from '@/shared/components/ui'
import { formatDate } from '@/shared/lib/utils'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { StockControlFormModal } from './StockControlFormModal'
import { StockControlDetail } from './StockControlDetail'

const PAGE_SIZE = 20

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

const STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({ value, label }))

type Props = {
  type: StockControlType
  title: string
  description: string
  createLabel: string
}

export function StockControlsPage({ type, title, description, createLabel }: Props) {
  const queryClient = useQueryClient()

  const [search, setSearch]         = useState('')
  const [statusFilter, setStatus]   = useState('')
  const [from, setFrom]             = useState('')
  const [to, setTo]                 = useState('')
  const [page, setPage]             = useState(0)
  const [selectedControl, setSelectedControl] = useState<StockControl | null>(null)
  const [showForm, setShowForm]     = useState(false)
  const [detailControl, setDetailControl] = useState<StockControl | null>(null)

  const debouncedSearch = useDebounce(search)

  function resetPage<T>(setter: (v: T) => void) {
    return (v: T) => { setPage(0); setter(v) }
  }

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['stock-controls', type, { statusFilter, from, to, page }],
    queryFn: () => fetchStockControls({ type, from, to, page, size: PAGE_SIZE }),
    refetchInterval: 30_000,
  })

  const controls = data?.content ?? []
  const meta     = data?.page

  const filtered = debouncedSearch || statusFilter
    ? controls.filter((c) => {
        const matchSearch =
          !debouncedSearch ||
          c.routeCode.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          c.branchName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          c.controlDate.includes(debouncedSearch)
        const matchStatus = !statusFilter || c.status === statusFilter
        return matchSearch && matchStatus
      })
    : controls

  function handleFormSuccess() {
    queryClient.invalidateQueries({ queryKey: ['stock-controls', type] })
    setShowForm(false)
    setSelectedControl(null)
  }

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={
          <ActionButton
            variant="primary"
            icon={<Plus size={14} />}
            onClick={() => { setSelectedControl(null); setShowForm(true) }}
          >
            {createLabel}
          </ActionButton>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 border-b border-zinc-200 bg-white px-6 py-3">
        {/* Estado */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Estado</span>
          <select
            value={statusFilter}
            onChange={(e) => resetPage(setStatus)(e.target.value)}
            className={`${selectClassName} h-8 w-48 text-xs`}
          >
            <option value="">Todos</option>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Separador */}
        <div className="h-8 w-px self-end bg-zinc-100" />

        {/* Desde */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Desde</span>
          <DatePicker
            value={from}
            onChange={resetPage(setFrom)}
            placeholder="Fecha inicio"
            className="w-40"
          />
        </div>

        {/* Hasta */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Hasta</span>
          <DatePicker
            value={to}
            onChange={resetPage(setTo)}
            placeholder="Fecha fin"
            className="w-40"
          />
        </div>

        {/* Limpiar */}
        {(statusFilter || from || to) && (
          <button
            onClick={() => { resetPage(setStatus)(''); setFrom(''); setTo('') }}
            className="self-end h-8 rounded-sm border border-zinc-200 bg-white px-3 text-xs text-zinc-500 hover:border-zinc-300 hover:text-zinc-800"
          >
            Limpiar filtros
          </button>
        )}

        <span className="ml-auto self-end pb-0.5 text-xs text-zinc-400">
          {meta ? `${meta.totalElements} registro${meta.totalElements !== 1 ? 's' : ''}` : ''}
        </span>
      </div>

      <ActionBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por reparto, sucursal o fecha..."
          className="w-72"
        />
        <span className="text-xs text-zinc-400">
          {filtered.length !== controls.length
            ? `${filtered.length} de ${controls.length} en esta página`
            : `${controls.length} en esta página`}
        </span>
      </ActionBar>

      {/* Table */}
      <div className="border-b border-zinc-200">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 w-28">Fecha</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 w-28">Reparto</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Sucursal</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 w-36">Estado</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 w-16 text-right">Items</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 w-28">Registrado</th>
              <th className="px-4 py-2.5 w-20" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-zinc-400">Cargando...</td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center">
                  <p className="text-sm text-zinc-500">No se pudieron cargar los registros.</p>
                  <button onClick={() => refetch()} className="mt-2 text-xs text-zinc-400 underline hover:text-zinc-700">
                    Reintentar
                  </button>
                </td>
              </tr>
            )}
            {!isLoading && !isError && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center">
                  <p className="text-sm text-zinc-500">Sin registros.</p>
                  <button
                    onClick={() => { setSelectedControl(null); setShowForm(true) }}
                    className="mt-2 text-xs text-zinc-400 underline hover:text-zinc-700"
                  >
                    Registrar {type === 'EXIT' ? 'salida' : 'entrada'}
                  </button>
                </td>
              </tr>
            )}
            {filtered.map((c) => {
              const statusCfg = STATUS_CONFIG[c.status] ?? { label: c.status, cls: 'text-zinc-600 bg-zinc-100 border-zinc-200' }
              const canEdit   = c.status === 'CONTROLLED'

              return (
                <tr
                  key={c.id}
                  className="cursor-pointer border-b border-zinc-100 bg-white transition-colors hover:bg-zinc-50"
                  onClick={() => setDetailControl(c)}
                >
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium tabular-nums text-zinc-700">{c.controlDate}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-medium text-zinc-600">{c.routeCode}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-zinc-800">{c.branchName}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${statusCfg.cls}`}
                    >
                      {statusCfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs tabular-nums text-zinc-500">{c.items.length}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-zinc-400">{formatDate(c.createdAt)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); setDetailControl(c) }}
                        className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                        title="Ver detalle"
                      >
                        <Eye size={13} />
                      </button>
                      {canEdit && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedControl(c); setShowForm(true) }}
                          className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                          title="Editar"
                        >
                          <Pencil size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
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
            <span className="ml-2 text-zinc-400">({meta.totalElements} registros)</span>
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

      {/* Form modal */}
      {showForm && (
        <StockControlFormModal
          type={type}
          control={selectedControl}
          onClose={() => { setShowForm(false); setSelectedControl(null) }}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Detail panel */}
      {detailControl && (
        <StockControlDetail
          control={detailControl}
          onClose={() => setDetailControl(null)}
        />
      )}
    </div>
  )
}
