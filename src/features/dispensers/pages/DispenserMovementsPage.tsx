import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react'
import {
  fetchDispenserMovements,
  cancelDispenserMovement,
} from '../services/dispensers.service'
import type { DispenserMovement, DispenserMovementType, DispenserMovementStatus } from '../types'
import { DispenserMovementFormModal } from '../components/DispenserMovementFormModal'
import {
  PageHeader,
  ActionBar,
  ActionButton,
  SearchInput,
  DatePicker,
  ConfirmDialog,
  selectClassName,
} from '@/shared/components/ui'
import { formatDateTime } from '@/shared/lib/utils'
import { useDebounce } from '@/shared/hooks/useDebounce'

const TODAY = new Date().toISOString().split('T')[0]
const PAGE_SIZE = 20

const STATUS_CONFIG: Record<DispenserMovementStatus, { label: string; cls: string }> = {
  REGISTERED:      { label: 'Registrado',     cls: 'text-zinc-700 bg-zinc-50 border-zinc-200' },
  SENT_TO_AGUAS:   { label: 'Enviado Aguas',  cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  AGUAS_ERROR:     { label: 'Error Aguas',    cls: 'text-red-700 bg-red-50 border-red-200' },
  CANCELLED:       { label: 'Cancelado',      cls: 'text-zinc-400 bg-zinc-50 border-zinc-200' },
}

const TYPE_CONFIG: Record<DispenserMovementType, { label: string; cls: string }> = {
  LOAD:   { label: 'Carga',    cls: 'text-blue-700 bg-blue-50 border-blue-200' },
  UNLOAD: { label: 'Descarga', cls: 'text-amber-700 bg-amber-50 border-amber-200' },
}

const TYPE_OPTIONS = [
  { value: '',       label: 'Todos los tipos' },
  { value: 'LOAD',   label: 'Carga' },
  { value: 'UNLOAD', label: 'Descarga' },
]

const STATUS_OPTIONS = [
  { value: '',              label: 'Todos los estados' },
  { value: 'REGISTERED',   label: 'Registrado' },
  { value: 'SENT_TO_AGUAS', label: 'Enviado Aguas' },
  { value: 'AGUAS_ERROR',  label: 'Error Aguas' },
  { value: 'CANCELLED',    label: 'Cancelado' },
]

export function DispenserMovementsPage() {
  const queryClient = useQueryClient()

  const [typeFilter,   setTypeFilter]   = useState<DispenserMovementType | ''>('')
  const [statusFilter, setStatusFilter] = useState<DispenserMovementStatus | ''>('')
  const [from,         setFrom]         = useState(TODAY)
  const [to,           setTo]           = useState(TODAY)
  const [search,       setSearch]       = useState('')
  const [page,         setPage]         = useState(0)
  const [expandedId,   setExpanded]     = useState<string | null>(null)

  const [modalOpen,      setModalOpen]      = useState(false)
  const [editTarget,     setEditTarget]     = useState<DispenserMovement | null>(null)
  const [cancelTarget,   setCancelTarget]   = useState<DispenserMovement | null>(null)

  const debouncedSearch = useDebounce(search)

  function resetPage<T>(setter: (v: T) => void) {
    return (v: T) => { setPage(0); setter(v) }
  }

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dispenser-movements', { typeFilter, statusFilter, from, to, page }],
    queryFn:  () => fetchDispenserMovements({
      type:      typeFilter  || undefined,
      status:    statusFilter || undefined,
      from:      from || undefined,
      to:        to   || undefined,
      page,
      size: PAGE_SIZE,
    }),
    refetchInterval: 15_000,
  })

  const { mutate: cancel, isPending: cancelling } = useMutation({
    mutationFn: (id: string) => cancelDispenserMovement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispenser-movements'] })
      setCancelTarget(null)
    },
  })

  const movements = data?.content ?? []
  const meta      = data

  const filtered = debouncedSearch
    ? movements.filter((m) =>
        m.routeCode.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        m.technician.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        m.serials.some((s) => s.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
        (m.registeredByUsername ?? '').toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    : movements

  const hasFilters = !!(typeFilter || statusFilter || from || to)

  function clearFilters() {
    setTypeFilter('')
    setStatusFilter('')
    setFrom('')
    setTo('')
    setPage(0)
  }

  function openCreate() {
    setEditTarget(null)
    setModalOpen(true)
  }

  function openEdit(m: DispenserMovement) {
    setEditTarget(m)
    setModalOpen(true)
  }

  return (
    <div>
      <PageHeader
        title="Dispensers"
        description="Movimientos de carga y descarga de dispensers en camiones."
        actions={
          <ActionButton onClick={openCreate}>
            <Plus size={14} />
            Nuevo movimiento
          </ActionButton>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 border-b border-zinc-200 bg-white px-6 py-3">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Tipo</span>
          <select
            value={typeFilter}
            onChange={(e) => resetPage(setTypeFilter as (v: string) => void)(e.target.value)}
            className={`${selectClassName} h-8 w-36 text-xs`}
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Estado</span>
          <select
            value={statusFilter}
            onChange={(e) => resetPage(setStatusFilter as (v: string) => void)(e.target.value)}
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

        <button
          onClick={() => refetch()}
          className="self-end ml-1 flex h-8 items-center gap-1.5 rounded-sm border border-zinc-200 bg-white px-2.5 text-xs text-zinc-400 hover:text-zinc-700"
          title="Actualizar"
        >
          <RefreshCw size={12} />
        </button>

        <span className="ml-auto self-end pb-0.5 text-xs text-zinc-400">
          {meta ? `${meta.totalElements} movimiento${meta.totalElements !== 1 ? 's' : ''}` : ''}
        </span>
      </div>

      <ActionBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por reparto, técnico o serial..."
          className="w-72"
        />
        <span className="text-xs text-zinc-400">Actualiza cada 15 s</span>
      </ActionBar>

      {/* Table */}
      <div className="border-b border-zinc-200">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <th className="w-8 px-4 py-2.5" />
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 w-24">Tipo</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 w-28">Reparto</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 w-36">Técnico</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 w-28">Fecha</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 w-32">Estado</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 w-12 text-right">Seriales</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 w-36">Registrado</th>
              <th className="px-4 py-2.5 w-28" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-sm text-zinc-400">Cargando...</td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center">
                  <p className="text-sm text-zinc-500">No se pudieron cargar los movimientos.</p>
                  <button onClick={() => refetch()} className="mt-2 text-xs text-zinc-400 underline hover:text-zinc-700">Reintentar</button>
                </td>
              </tr>
            )}
            {!isLoading && !isError && filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-sm text-zinc-500">
                  No hay movimientos para los filtros seleccionados.
                </td>
              </tr>
            )}
            {filtered.map((m) => {
              const isExpanded = expandedId === m.id
              const typeCfg    = TYPE_CONFIG[m.type]
              const statusCfg  = STATUS_CONFIG[m.status]
              const isCancelled = m.status === 'CANCELLED'

              return (
                <>
                  <tr
                    key={m.id}
                    className={[
                      'border-b border-zinc-100 transition-colors',
                      isCancelled ? 'opacity-50' : 'cursor-pointer bg-white hover:bg-zinc-50',
                    ].join(' ')}
                    onClick={() => !isCancelled && setExpanded(isExpanded ? null : m.id)}
                  >
                    <td className="px-4 py-3 text-zinc-400">
                      {!isCancelled && (
                        isExpanded
                          ? <ChevronDown size={13} />
                          : <ChevronRight size={13} />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${typeCfg.cls}`}>
                        {typeCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-medium text-zinc-700">{m.routeCode}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-zinc-700">{m.technician}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs tabular-nums text-zinc-600">{m.movementDate}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${statusCfg.cls}`}>
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs tabular-nums text-zinc-500">{m.serials.length}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-zinc-400">{formatDateTime(m.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      {!isCancelled && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(m)}
                            className="text-xs text-zinc-400 underline hover:text-zinc-700"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => setCancelTarget(m)}
                            className="text-xs text-zinc-400 underline hover:text-red-600"
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr key={`${m.id}-serials`} className="bg-zinc-50">
                      <td />
                      <td colSpan={8} className="px-4 py-3">
                        <div className="flex flex-col gap-1.5">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                            Seriales ({m.serials.length})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {m.serials.map((s) => (
                              <span
                                key={s}
                                className="rounded-sm border border-zinc-200 bg-white px-2 py-0.5 font-mono text-[11px] text-zinc-700"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                          {m.aguasMovementId && (
                            <p className="mt-1 text-[11px] text-zinc-400">
                              ID Aguas: <span className="font-mono text-zinc-600">{m.aguasMovementId}</span>
                            </p>
                          )}
                          {m.registeredByUsername && (
                            <p className="text-[11px] text-zinc-400">
                              Registrado por: <span className="text-zinc-600">{m.registeredByUsername}</span>
                            </p>
                          )}
                        </div>
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

      {/* Form modal */}
      {modalOpen && (
        <DispenserMovementFormModal
          movement={editTarget}
          onClose={() => setModalOpen(false)}
          onSuccess={() => setModalOpen(false)}
        />
      )}

      {/* Cancel confirm */}
      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Cancelar movimiento"
        description={cancelTarget ? `¿Confirmar cancelación del movimiento de ${TYPE_CONFIG[cancelTarget.type].label.toLowerCase()} del reparto ${cancelTarget.routeCode}? Esta acción también cancela el registro en Aguas.` : ''}
        confirmLabel="Sí, cancelar"
        variant="danger"
        isLoading={cancelling}
        onConfirm={() => cancelTarget && cancel(cancelTarget.id)}
      />
    </div>
  )
}
