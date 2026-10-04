import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Pencil, Eye, Truck, Clock, CheckCircle2, AlertCircle, AlertTriangle,
  ClipboardList, ArrowDownToLine, ArrowUpFromLine,
} from 'lucide-react'
import { fetchStockControls, fetchPendingArrivals } from '../services/stock-controls.service'
import type { StockControl, StockControlType } from '../types'
import { STOCK_CONTROL_STATUS_CONFIG, STOCK_CONTROL_STATUS_OPTIONS } from '../constants'
import {
  PageHeader,
  ActionBar,
  ActionButton,
  SearchInput,
  DatePicker,
  FilterBar,
  DataTable,
  MetricBlock,
  Combobox,
  Panel,
} from '@/shared/components/ui'
import type { TableColumn } from '@/shared/types'
import { formatDate } from '@/shared/lib/utils'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { StockControlFormModal } from './StockControlFormModal'
import { StockControlDetail } from './StockControlDetail'
import { RemitoActions } from './RemitoActions'

const PAGE_SIZE = 20

type Props = {
  type: StockControlType
  title: string
  description: string
  createLabel: string
}

const TODAY = new Date().toISOString().split('T')[0]

export function StockControlsPage({ type, title, description, createLabel }: Props) {
  const queryClient = useQueryClient()

  const [search, setSearch]         = useState('')
  const [statusFilter, setStatus]   = useState('')
  const [from, setFrom]             = useState(TODAY)
  const [to, setTo]                 = useState(TODAY)
  const [page, setPage]             = useState(0)
  const [selectedControl, setSelectedControl] = useState<StockControl | null>(null)
  const [showForm, setShowForm]     = useState(false)
  const [detailControl, setDetailControl] = useState<StockControl | null>(null)
  const [pendingBranchId, setPendingBranchId] = useState('')

  const debouncedSearch = useDebounce(search)

  function resetPage<T>(setter: (v: T) => void) {
    return (v: T) => { setPage(0); setter(v) }
  }

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['stock-controls', type, { statusFilter, from, to, page }],
    queryFn: () => fetchStockControls({ type, from, to, page, size: PAGE_SIZE }),
    refetchInterval: 30_000,
  })

  const { data: pendingArrivals } = useQuery({
    queryKey: ['pending-arrivals'],
    queryFn: () => fetchPendingArrivals(),
    enabled: type === 'ENTRY',
    refetchInterval: 30_000,
  })

  // Branch groups derived from full pending list (client-side grouping)
  const branchGroups = useMemo(() => {
    if (!pendingArrivals) return []
    const map = new Map<string, { branchId: string; branchName: string; count: number }>()
    for (const r of pendingArrivals.pendingRoutes) {
      const existing = map.get(r.branchId)
      if (existing) existing.count++
      else map.set(r.branchId, { branchId: r.branchId, branchName: r.branchName, count: 1 })
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count)
  }, [pendingArrivals])

  const branchOptions = useMemo(
    () => branchGroups.map((b) => ({ value: b.branchId, label: b.branchName })),
    [branchGroups]
  )

  const filteredRoutes = useMemo(() => {
    if (!pendingArrivals || !pendingBranchId) return []
    return pendingArrivals.pendingRoutes.filter((r) => r.branchId === pendingBranchId)
  }, [pendingArrivals, pendingBranchId])

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

  const differencesCount  = filtered.filter((c) => c.status === 'WITH_DIFFERENCES').length
  const truckOrderedCount = filtered.filter((c) => c.truckOrdered).length

  function handleFormSuccess() {
    queryClient.invalidateQueries({ queryKey: ['stock-controls', type] })
    setShowForm(false)
    setSelectedControl(null)
  }

  const TypeIcon = type === 'EXIT' ? ArrowUpFromLine : ArrowDownToLine

  const columns: TableColumn<StockControl>[] = [
    {
      key: 'controlDate',
      header: 'Fecha',
      width: '110px',
      render: (c) => (
        <span className="text-xs font-medium tabular-nums text-zinc-700">{formatDate(c.controlDate)}</span>
      ),
    },
    {
      key: 'routeCode',
      header: 'Reparto',
      width: '110px',
      render: (c) => <span className="font-mono text-xs font-medium text-zinc-600">{c.routeCode}</span>,
    },
    {
      key: 'branchName',
      header: 'Sucursal',
      render: (c) => <span className="text-sm text-zinc-800">{c.branchName}</span>,
    },
    {
      key: 'status',
      header: 'Estado',
      width: '150px',
      render: (c) => {
        const cfg = STOCK_CONTROL_STATUS_CONFIG[c.status] ?? { label: c.status, cls: 'text-zinc-600 bg-zinc-100 border-zinc-200' }
        return (
          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${cfg.cls}`}>
            {cfg.label}
          </span>
        )
      },
    },
    {
      key: 'truckOrdered',
      header: 'Camión',
      width: '70px',
      align: 'center',
      render: (c) => (
        <span title={c.truckOrdered ? 'Camión ordenado' : 'Camión no ordenado'}>
          <Truck size={14} className={c.truckOrdered ? 'mx-auto text-emerald-500' : 'mx-auto text-zinc-300'} />
        </span>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      width: '70px',
      align: 'right',
      render: (c) => <span className="text-xs tabular-nums text-zinc-500">{c.items.length}</span>,
    },
    {
      key: 'createdAt',
      header: 'Registrado',
      width: '110px',
      render: (c) => <span className="text-xs text-zinc-400">{formatDate(c.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      width: '110px',
      align: 'right',
      render: (c) => {
        const canEdit = c.status === 'CONTROLLED'
        return (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setDetailControl(c) }}
              className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              title="Ver detalle"
            >
              <Eye size={13} />
            </button>
            {canEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedControl(c); setShowForm(true) }}
                className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                title="Editar"
              >
                <Pencil size={13} />
              </button>
            )}
            {/* Remitos only exist for exits */}
            {c.type === 'EXIT' && <RemitoActions controlId={c.id} />}
          </div>
        )
      },
    },
  ]

  return (
    <div className="pb-8">
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

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4 px-6">
        <MetricBlock
          label="Registros"
          icon={ClipboardList}
          accent="blue"
          value={meta?.totalElements ?? controls.length}
          note={`${filtered.length} en esta página`}
        />
        <MetricBlock
          label="Con diferencias"
          icon={AlertTriangle}
          accent={differencesCount > 0 ? 'red' : 'default'}
          value={differencesCount}
          note="en esta página"
        />
        {type === 'ENTRY' ? (
          <MetricBlock
            label="Repartos pendientes"
            icon={Clock}
            accent={pendingArrivals ? (pendingArrivals.pending > 0 ? 'amber' : 'green') : 'default'}
            value={pendingArrivals ? pendingArrivals.pending : '—'}
            note={pendingArrivals ? `de ${pendingArrivals.totalExpected} esperados hoy` : 'Cargando...'}
          />
        ) : (
          <MetricBlock
            label="Camión ordenado"
            icon={Truck}
            accent="blue"
            value={truckOrderedCount}
            note="en esta página"
          />
        )}
      </div>

      {/* Pending arrivals panel — ENTRY only */}
      {type === 'ENTRY' && pendingArrivals && pendingArrivals.pendingRoutes.length > 0 && (
        <div className="mx-6 mt-5 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-card">
          <div className="flex flex-wrap items-center gap-4 border-b border-zinc-200 bg-amber-50/40 px-5 py-3">
            <div className="flex items-center gap-2">
              {pendingArrivals.pending === 0 ? (
                <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />
              ) : (
                <Clock size={15} className="shrink-0 text-amber-500" />
              )}
              <span className="text-sm text-zinc-800">
                <span className="font-bold text-zinc-900">{pendingArrivals.pending}</span>
                <span className="text-zinc-500"> de </span>
                <span className="font-semibold text-zinc-700">{pendingArrivals.totalExpected}</span>
                <span className="text-zinc-500"> repartos pendientes de llegada</span>
              </span>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Combobox
                value={pendingBranchId}
                onChange={setPendingBranchId}
                placeholder="Ver por sucursal..."
                searchPlaceholder="Buscar sucursal..."
                className="w-52"
                options={branchOptions}
              />
              {pendingBranchId && (
                <button
                  onClick={() => setPendingBranchId('')}
                  className="text-xs text-zinc-400 hover:text-zinc-700 underline"
                >
                  Ver todas
                </button>
              )}
            </div>
          </div>

          {/* Table — grouped by branch (default) or routes for selected branch */}
          {!pendingBranchId ? (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="px-5 py-2 text-xs font-medium text-zinc-500">Sucursal</th>
                  <th className="px-4 py-2 text-xs font-medium text-zinc-500 w-28 text-right">Pendientes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {branchGroups.map((b) => (
                  <tr
                    key={b.branchId}
                    className="cursor-pointer bg-white transition-colors hover:bg-amber-50/40"
                    onClick={() => setPendingBranchId(b.branchId)}
                    title="Ver repartos de esta sucursal"
                  >
                    <td className="px-5 py-2.5">
                      <span className="flex items-center gap-2">
                        <AlertCircle size={11} className="shrink-0 text-amber-500" />
                        <span className="text-sm text-zinc-800">{b.branchName}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-md bg-amber-100 px-1.5 font-mono text-xs font-bold text-amber-700">
                        {b.count}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="px-5 py-2 text-xs font-medium text-zinc-500 w-32">Reparto</th>
                  <th className="px-4 py-2 text-xs font-medium text-zinc-500">Sucursal</th>
                  <th className="px-4 py-2 text-xs font-medium text-zinc-500 w-32">Fecha control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredRoutes.map((r) => (
                  <tr key={r.routeId} className="bg-white hover:bg-zinc-50">
                    <td className="px-5 py-2.5">
                      <span className="font-mono text-xs font-semibold text-zinc-700">{r.routeCode}</span>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-zinc-600">{r.branchName}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-zinc-400">{r.controlDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Panel className="mx-6 mt-5">
        <ActionBar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por reparto, sucursal o fecha..."
            className="w-72"
          />
          <FilterBar
            filters={[{ key: 'status', label: 'Estado', options: STOCK_CONTROL_STATUS_OPTIONS }]}
            activeFilters={{ status: statusFilter }}
            onChange={(_key, value) => resetPage(setStatus)(value)}
            onClearAll={() => resetPage(setStatus)('')}
          />
          <div className="flex items-center gap-1.5 border-l border-zinc-200 pl-3">
            <DatePicker value={from} onChange={resetPage(setFrom)} placeholder="Desde" className="w-32" />
            <span className="text-xs text-zinc-300">–</span>
            <DatePicker value={to} onChange={resetPage(setTo)} placeholder="Hasta" className="w-32" />
          </div>
          <span className="ml-auto text-xs text-zinc-400">
            {meta ? `${meta.totalElements} registro${meta.totalElements !== 1 ? 's' : ''}` : ''}
          </span>
        </ActionBar>

        {/* Table */}
        <div>
          <DataTable
            columns={columns}
            data={filtered}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
            onRowClick={(c) => setDetailControl(c)}
            getRowKey={(c) => c.id}
            rowClassName={(c) =>
              c.status === 'WITH_DIFFERENCES'
                ? 'border-l-2 border-l-orange-400'
                : c.status === 'REJECTED_BY_DRIVER' || c.status === 'AGUAS_ERROR'
                  ? 'border-l-2 border-l-red-400'
                  : undefined
            }
            emptyTitle="Sin registros"
            emptyDescription={`No hay ${type === 'EXIT' ? 'salidas' : 'entradas'} que coincidan con los filtros.`}
            emptyAction={
              !debouncedSearch && !statusFilter ? (
                <ActionButton
                  variant="primary"
                  size="sm"
                  icon={<Plus size={13} />}
                  onClick={() => { setSelectedControl(null); setShowForm(true) }}
                >
                  {createLabel}
                </ActionButton>
              ) : undefined
            }
          />
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="h-8 rounded-md border border-zinc-200 bg-white px-3.5 text-xs font-medium text-zinc-700 shadow-card hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Anterior
            </button>
            <span className="flex items-center gap-2 text-xs text-zinc-500">
              <TypeIcon size={12} className="text-zinc-300" />
              Página {meta.number + 1} de {meta.totalPages}
              <span className="text-zinc-400">({meta.totalElements} registros)</span>
            </span>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages - 1, p + 1))}
              disabled={page >= meta.totalPages - 1}
              className="h-8 rounded-md border border-zinc-200 bg-white px-3.5 text-xs font-medium text-zinc-700 shadow-card hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente →
            </button>
          </div>
        )}
      </Panel>

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
