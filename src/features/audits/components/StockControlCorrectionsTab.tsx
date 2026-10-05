import { useMemo, useState } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { ChevronRight, ChevronDown, AlertTriangle } from 'lucide-react'
import { fetchAuditLogs } from '../services/audits.service'
import { fetchStockControlById } from '@/features/stock/services/stock-controls.service'
import { fetchUsers } from '@/features/users/services/users.service'
import type { StockControl } from '@/features/stock/types'
import type { AuditLog } from '../types'
import { STOCK_CONTROL_TYPE_LABELS as TYPE_LABELS } from '@/features/stock/constants'
import { humanizeRole } from '../constants'
import { AuditValueDiff } from './AuditValueDiff'
import { MetricBlock, DatePicker, Panel } from '@/shared/components/ui'
import { formatDateTime, formatDuration, truncate } from '@/shared/lib/utils'

const today = new Date()
const DEFAULT_FROM = new Date(today.getTime() - 30 * 24 * 3_600_000).toISOString().split('T')[0]
const DEFAULT_TO   = today.toISOString().split('T')[0]

export function StockControlCorrectionsTab() {
  const [from, setFrom]             = useState(DEFAULT_FROM)
  const [to, setTo]                 = useState(DEFAULT_TO)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['audits', 'stock-control-corrections', { from, to }],
    queryFn: () => fetchAuditLogs({ entityName: 'StockControl', from, to, page: 0, size: 200 }),
  })

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    staleTime: 60_000,
  })
  const userMap = new Map(users.map((u) => [u.id, u]))

  // Corrections are stock-control events with a mandatory reason — every other
  // write to StockControl (create, plain update) leaves reason null.
  const corrections = useMemo(
    // Corrections always point at a control; the guard only narrows the type.
    () => (data?.content ?? []).filter(
      (l): l is AuditLog & { entityId: string } => !!l.reason && l.entityId !== null
    ),
    [data]
  )
  const truncated = (data?.page.totalElements ?? 0) > (data?.content.length ?? 0)

  const controlIds = useMemo(
    () => Array.from(new Set(corrections.map((c) => c.entityId))),
    [corrections]
  )

  const controlQueries = useQueries({
    queries: controlIds.map((id) => ({
      queryKey: ['stock-control', id],
      queryFn: () => fetchStockControlById(id),
      staleTime: 5 * 60_000,
    })),
  })

  const controlMap = new Map<string, StockControl>()
  controlIds.forEach((id, i) => {
    const c = controlQueries[i]?.data
    if (c) controlMap.set(id, c)
  })

  const deltas = corrections
    .map((log) => {
      const control = controlMap.get(log.entityId)
      if (!control) return null
      return new Date(log.createdAt).getTime() - new Date(control.createdAt).getTime()
    })
    .filter((d): d is number => d !== null)

  const avgDeltaMs = deltas.length > 0 ? deltas.reduce((a, b) => a + b, 0) / deltas.length : null

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 px-6 pb-5">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-500">Desde</span>
          <DatePicker value={from} onChange={setFrom} placeholder="Fecha inicio" className="w-40" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-500">Hasta</span>
          <DatePicker value={to} onChange={setTo} placeholder="Fecha fin" className="w-40" />
        </div>
        {truncated && (
          <span className="ml-auto flex items-center gap-1.5 self-end pb-0.5 text-xs text-amber-600">
            <AlertTriangle size={12} />
            Hay más eventos en el rango de los que se muestran — acotá las fechas.
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 px-6">
        <MetricBlock
          label="Correcciones registradas"
          accent={corrections.length > 0 ? 'amber' : 'default'}
          value={corrections.length}
        />
        <MetricBlock
          label="Controles corregidos"
          value={controlIds.length}
          note="controles distintos con al menos una corrección"
        />
        <MetricBlock
          label="Tiempo promedio hasta corrección"
          value={avgDeltaMs !== null ? formatDuration(avgDeltaMs) : '—'}
          note="desde que se creó el control"
        />
      </div>

      <Panel className="mx-6 mt-5">
        <div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="w-8" />
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 w-36">
                  Fecha corrección
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Control
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 w-36">
                  Corregido por
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Motivo
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 w-36">
                  Tiempo desde creación
                </th>
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
                    <p className="text-sm text-zinc-500">No se pudieron cargar las correcciones.</p>
                    <button onClick={() => refetch()} className="mt-2 text-xs text-zinc-400 underline hover:text-zinc-700">
                      Reintentar
                    </button>
                  </td>
                </tr>
              )}
              {!isLoading && !isError && corrections.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-zinc-400">
                    Sin correcciones registradas en el rango seleccionado.
                  </td>
                </tr>
              )}
              {corrections.map((log) => {
                const control     = controlMap.get(log.entityId)
                const isExpanded  = expandedId === log.id
                const user        = log.userId ? userMap.get(log.userId) : undefined
                const deltaMs     = control
                  ? new Date(log.createdAt).getTime() - new Date(control.createdAt).getTime()
                  : null
                const canExpand   = log.oldValue !== null || log.newValue !== null

                return (
                  <>
                    <tr
                      key={log.id}
                      onClick={() => canExpand && setExpandedId(isExpanded ? null : log.id)}
                      className={`border-b border-zinc-100 transition-colors ${
                        canExpand ? 'cursor-pointer hover:bg-zinc-50' : ''
                      } ${isExpanded ? 'bg-zinc-50' : 'bg-white'}`}
                    >
                      <td className="w-8 pl-3">
                        {canExpand ? (
                          <span className="text-zinc-300">
                            {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs tabular-nums text-zinc-500">
                          {formatDateTime(log.createdAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {control ? (
                          <>
                            <p className="text-sm font-medium text-zinc-800">
                              {control.routeCode} · {control.branchName}
                            </p>
                            <p className="text-[10px] text-zinc-400">
                              {TYPE_LABELS[control.type]} · {control.controlDate}
                            </p>
                          </>
                        ) : (
                          <span className="font-mono text-[10px] text-zinc-400">
                            {log.entityId.slice(0, 8)}…
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {log.userId ? (
                          <>
                            <p className="text-xs font-medium text-zinc-700">
                              {user?.name ?? log.userId.slice(0, 8)}
                            </p>
                            <p className="text-[10px] text-zinc-400">{humanizeRole(log.userRole)}</p>
                          </>
                        ) : (
                          <span className="text-xs text-zinc-400">Sistema</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-amber-700" title={log.reason ?? ''}>
                          {truncate(log.reason ?? '', 60)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium tabular-nums text-zinc-700">
                          {deltaMs !== null ? formatDuration(deltaMs) : '—'}
                        </span>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr key={`${log.id}-detail`} className="bg-zinc-50">
                        <td />
                        <td colSpan={5} className="px-4 py-4">
                          <AuditValueDiff
                            oldValue={log.oldValue}
                            newValue={log.newValue}
                            resolveId={(_, id) => userMap.get(id)?.name}
                          />
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}
