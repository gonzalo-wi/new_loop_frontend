import { Fragment, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { fetchAuditLogs } from '../services/audits.service'
import { fetchUsers } from '@/features/users/services/users.service'
import type { AuditLog } from '../types'
import {
  ENTITY_LABELS,
  ENTITY_OPTIONS,
  ACTION_OPTIONS,
  SOURCE_LABELS,
  SOURCE_OPTIONS,
  humanizeAction,
  getActionStyle,
  humanizeRole,
} from '../constants'
import { AuditValueDiff } from './AuditValueDiff'
import { actorName, describeEvent, eventDetail, showsReasonSeparately } from '../activity'
import { ActionBar, SearchInput, DatePicker, selectClassName, Panel } from '@/shared/components/ui'
import { formatDateTime, truncate } from '@/shared/lib/utils'
import { useDebounce } from '@/shared/hooks/useDebounce'

const PAGE_SIZE = 50

// ── Expanded detail ───────────────────────────────────────────────────────────

function LogDetail({ log, resolveId }: { log: AuditLog; resolveId: (key: string, id: string) => string | undefined }) {
  return (
    <tr className="bg-zinc-50">
      <td />
      <td colSpan={6} className="px-4 py-4">
        <div className="space-y-3">
          {/* Meta */}
          <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
            <span>
              <span className="font-medium text-zinc-700">
                {ENTITY_LABELS[log.entityName] ?? log.entityName}:
              </span>{' '}
              <span className="font-mono">{log.entityId ?? '—'}</span>
            </span>
            {log.userId && (
              <span>
                <span className="font-medium text-zinc-700">Usuario ID:</span>{' '}
                <span className="font-mono">{log.userId}</span>
              </span>
            )}
            {log.ipAddress && (
              <span>
                <span className="font-medium text-zinc-700">IP:</span>{' '}
                <span className="font-mono">{log.ipAddress}</span>
              </span>
            )}
          </div>

          {/* Reason */}
          {showsReasonSeparately(log) && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600">
                Motivo declarado
              </p>
              <p className="text-xs text-amber-900">{log.reason}</p>
            </div>
          )}

          <AuditValueDiff oldValue={log.oldValue} newValue={log.newValue} resolveId={resolveId} />
        </div>
      </td>
    </tr>
  )
}

// ── Tab ───────────────────────────────────────────────────────────────────────

export function AuditEventsTab() {
  const [entityName, setEntityName] = useState('')
  const [action, setAction]         = useState('')
  const [userId, setUserId]         = useState('')
  const [source, setSource]         = useState('')
  const [from, setFrom]             = useState('')
  const [to, setTo]                 = useState('')
  const [search, setSearch]         = useState('')
  const [page, setPage]             = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const debouncedSearch = useDebounce(search)

  function setFilter<T>(setter: (v: T) => void) {
    return (v: T) => {
      setPage(0)
      setter(v)
    }
  }

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['audits', { entityName, action, userId, source, from, to, page }],
    queryFn: () =>
      fetchAuditLogs({ entityName, action, userId, source, from, to, page, size: PAGE_SIZE }),
    refetchInterval: 30_000,
  })

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    staleTime: 60_000,
  })
  const userMap = new Map(users.map((u) => [u.id, u]))
  const nameById = (id: string) => userMap.get(id)?.name
  const sortedUsers = [...users].sort((a, b) => a.name.localeCompare(b.name))

  const logs = data?.content ?? []
  const meta = data?.page

  const needle   = debouncedSearch.toLowerCase()
  const filtered = needle
    ? logs.filter((l) =>
        [
          describeEvent(l, actorName(l, nameById)),
          eventDetail(l),
          humanizeAction(l.action),
          l.entityId,
          l.reason,
        ].some((text) => (text ?? '').toLowerCase().includes(needle))
      )
    : logs

  const hasValues = (l: AuditLog) => l.oldValue !== null || l.newValue !== null || l.ipAddress !== null

  return (
    <div>
      <Panel className="mx-6">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-zinc-100 px-4 py-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-500">Entidad</span>
            <select
              value={entityName}
              onChange={(e) => setFilter(setEntityName)(e.target.value)}
              className={`${selectClassName} h-8 w-44 text-xs`}
            >
              {ENTITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-500">Acción</span>
            <select
              value={action}
              onChange={(e) => setFilter(setAction)(e.target.value)}
              className={`${selectClassName} h-8 w-52 text-xs`}
            >
              {ACTION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-500">Usuario</span>
            <select
              value={userId}
              onChange={(e) => setFilter(setUserId)(e.target.value)}
              className={`${selectClassName} h-8 w-44 text-xs`}
            >
              <option value="">Todos los usuarios</option>
              {sortedUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-500">Origen</span>
            <select
              value={source}
              onChange={(e) => setFilter(setSource)(e.target.value)}
              className={`${selectClassName} h-8 w-36 text-xs`}
            >
              {SOURCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="h-8 w-px self-end bg-zinc-100" />

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-500">Desde</span>
            <DatePicker value={from} onChange={setFilter(setFrom)} placeholder="Fecha inicio" className="w-40" />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-500">Hasta</span>
            <DatePicker value={to} onChange={setFilter(setTo)} placeholder="Fecha fin" className="w-40" />
          </div>

          {(entityName || action || userId || source || from || to) && (
            <button
              onClick={() => {
                setFilter(setEntityName)('')
                setAction('')
                setUserId('')
                setSource('')
                setFrom('')
                setTo('')
              }}
              className="self-end h-8 rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-500 hover:border-zinc-300 hover:text-zinc-800"
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
            placeholder="Buscar en esta página..."
            className="w-64"
          />
          <span className="text-xs text-zinc-400">
            {filtered.length !== logs.length
              ? `${filtered.length} de ${logs.length} en esta página`
              : `${logs.length} en esta página`}
          </span>
        </ActionBar>

        {/* Table */}
        <div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="w-8" />
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 w-36">
                  Fecha / Hora
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Qué pasó
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 w-52">
                  Acción
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 w-36">
                  Usuario
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Motivo
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 w-20">
                  Origen
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-zinc-400">
                    Cargando registros...
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <p className="text-sm text-zinc-500">No se pudieron cargar los registros.</p>
                    <button
                      onClick={() => refetch()}
                      className="mt-2 text-xs text-zinc-400 underline hover:text-zinc-700"
                    >
                      Reintentar
                    </button>
                  </td>
                </tr>
              )}
              {!isLoading && !isError && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-zinc-400">
                    Sin registros para los filtros seleccionados.
                  </td>
                </tr>
              )}
              {filtered.map((log) => {
                const isExpanded = expandedId === log.id
                const canExpand  = hasValues(log)
                const actor      = actorName(log, nameById)
                const detail     = eventDetail(log)

                return (
                  <Fragment key={log.id}>
                    <tr
                      onClick={() => canExpand && setExpandedId(isExpanded ? null : log.id)}
                      className={`border-b border-zinc-100 transition-colors ${
                        canExpand ? 'cursor-pointer hover:bg-zinc-50' : ''
                      } ${isExpanded ? 'bg-zinc-50' : 'bg-white'}`}
                    >
                      <td className="w-8 pl-3">
                        {canExpand ? (
                          <span className="text-zinc-300">
                            {isExpanded
                              ? <ChevronDown size={13} />
                              : <ChevronRight size={13} />
                            }
                          </span>
                        ) : null}
                      </td>

                      <td className="px-4 py-3">
                        <span className="text-xs tabular-nums text-zinc-500">
                          {formatDateTime(log.createdAt)}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-sm text-zinc-800">{describeEvent(log, actor)}</p>
                        {detail && <p className="text-xs text-zinc-500">{detail}</p>}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide border ${getActionStyle(log.action)}`}
                        >
                          {humanizeAction(log.action)}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {log.userId ? (
                          <>
                            <p className="text-xs font-medium text-zinc-700">{actor}</p>
                            <p className="text-[10px] text-zinc-400">{humanizeRole(log.userRole)}</p>
                          </>
                        ) : (
                          <span className="text-xs text-zinc-400">{log.username ?? 'Sistema'}</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {showsReasonSeparately(log) && log.reason ? (
                          <span
                            className="text-xs text-amber-700"
                            title={log.reason}
                          >
                            {truncate(log.reason, 48)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-300">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span className="text-xs text-zinc-500">
                          {SOURCE_LABELS[log.source] ?? log.source}
                        </span>
                      </td>
                    </tr>

                    {isExpanded && (
                      <LogDetail log={log} resolveId={(_, id) => nameById(id)} />
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
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
            <span className="text-xs text-zinc-500">
              Página {meta.number + 1} de {meta.totalPages}
              <span className="ml-2 text-zinc-400">({meta.totalElements} registros)</span>
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
    </div>
  )
}
