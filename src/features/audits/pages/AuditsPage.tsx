import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { fetchAuditLogs } from '../services/audits.service'
import type { AuditLog } from '../types'
import { PageHeader, ActionBar, SearchInput, DatePicker, selectClassName } from '@/shared/components/ui'
import { formatDateTime } from '@/shared/lib/utils'
import { useDebounce } from '@/shared/hooks/useDebounce'

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50

const ACTION_LABELS: Record<string, string> = {
  CREATE_BRANCH:      'Crear sucursal',
  UPDATE_BRANCH:      'Actualizar sucursal',
  DEACTIVATE_BRANCH:  'Desactivar sucursal',
  ACTIVATE_BRANCH:    'Activar sucursal',
  CREATE_PRODUCT:     'Crear producto',
  UPDATE_PRODUCT:     'Actualizar producto',
  DEACTIVATE_PRODUCT: 'Desactivar producto',
  ACTIVATE_PRODUCT:   'Activar producto',
  CREATE_USER:        'Crear usuario',
  UPDATE_USER:        'Actualizar usuario',
  DEACTIVATE_USER:    'Desactivar usuario',
  ACTIVATE_USER:      'Activar usuario',
}

const ENTITY_OPTIONS = [
  { value: '',        label: 'Todas las entidades' },
  { value: 'Branch',  label: 'Sucursales' },
  { value: 'Product', label: 'Productos' },
  { value: 'User',    label: 'Usuarios' },
]

const ACTION_OPTIONS = [
  { value: '', label: 'Todas las acciones' },
  ...Object.entries(ACTION_LABELS).map(([value, label]) => ({ value, label })),
]

const ENTITY_LABELS: Record<string, string> = {
  Branch:  'Sucursal',
  Product: 'Producto',
  User:    'Usuario',
}

const SOURCE_LABELS: Record<string, string> = {
  ADMIN_WEB:  'Web',
  MOBILE_APP: 'Mobile',
  SYSTEM:     'Sistema',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getActionStyle(action: string) {
  if (action.startsWith('CREATE_'))     return 'text-emerald-700 bg-emerald-50 border border-emerald-200'
  if (action.startsWith('UPDATE_'))     return 'text-blue-700 bg-blue-50 border border-blue-200'
  if (action.startsWith('DEACTIVATE_')) return 'text-red-700 bg-red-50 border border-red-200'
  if (action.startsWith('ACTIVATE_'))  return 'text-green-700 bg-green-50 border border-green-200'
  return 'text-zinc-600 bg-zinc-100 border border-zinc-200'
}

function safeParseJson(raw: string | null): string {
  if (!raw) return ''
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
}

function truncateUuid(uuid: string) {
  return uuid.length > 12 ? `${uuid.slice(0, 8)}…` : uuid
}

// ── Expanded detail ───────────────────────────────────────────────────────────

function LogDetail({ log }: { log: AuditLog }) {
  const hasOld = log.oldValue !== null
  const hasNew = log.newValue !== null

  return (
    <tr className="bg-zinc-50">
      <td />
      <td colSpan={5} className="px-4 py-4">
        <div className="space-y-3">
          {/* Meta */}
          <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
            <span>
              <span className="font-medium text-zinc-700">ID entidad:</span>{' '}
              <span className="font-mono">{log.entityId}</span>
            </span>
            {log.userId && (
              <span>
                <span className="font-medium text-zinc-700">Usuario ID:</span>{' '}
                <span className="font-mono">{log.userId}</span>
              </span>
            )}
            {log.userRole && (
              <span>
                <span className="font-medium text-zinc-700">Rol:</span> {log.userRole}
              </span>
            )}
            {log.source && (
              <span>
                <span className="font-medium text-zinc-700">Origen:</span>{' '}
                {SOURCE_LABELS[log.source] ?? log.source}
              </span>
            )}
          </div>

          {/* Values */}
          {(hasOld || hasNew) && (
            <div className={`grid gap-3 ${hasOld && hasNew ? 'grid-cols-2' : 'grid-cols-1 max-w-xl'}`}>
              {hasOld && (
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                    Antes
                  </p>
                  <pre className="overflow-auto rounded-sm border border-zinc-200 bg-white p-3 text-[11px] leading-relaxed text-zinc-600 max-h-48">
                    {safeParseJson(log.oldValue)}
                  </pre>
                </div>
              )}
              {hasNew && (
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                    Después
                  </p>
                  <pre className="overflow-auto rounded-sm border border-zinc-200 bg-white p-3 text-[11px] leading-relaxed text-zinc-600 max-h-48">
                    {safeParseJson(log.newValue)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function AuditsPage() {
  const [entityName, setEntityName] = useState('')
  const [action, setAction]         = useState('')
  const [from, setFrom]             = useState('')
  const [to, setTo]                 = useState('')
  const [search, setSearch]         = useState('')
  const [page, setPage]             = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const debouncedSearch = useDebounce(search)

  // Reset page when filters change
  function setFilter<T>(setter: (v: T) => void) {
    return (v: T) => {
      setPage(0)
      setter(v)
    }
  }

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['audits', { entityName, action, from, to, page }],
    queryFn: () =>
      fetchAuditLogs({ entityName, action, from, to, page, size: PAGE_SIZE }),
    refetchInterval: 30_000,
  })

  const logs = data?.content ?? []
  const meta = data?.page

  // Client-side search over current page
  const filtered = debouncedSearch
    ? logs.filter(
        (l) =>
          l.action.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          l.entityName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          l.entityId.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    : logs

  const hasValues = (l: AuditLog) => l.oldValue !== null || l.newValue !== null

  return (
    <div>
      <PageHeader
        title="Auditoría"
        description="Registro de escritura del sistema. Solo lectura. Se conserva 7 días."
      />

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-zinc-200 bg-white px-6 py-3">
        {/* Entidad */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Entidad</span>
          <select
            value={entityName}
            onChange={(e) => setFilter(setEntityName)(e.target.value)}
            className={`${selectClassName} h-8 w-40 text-xs`}
          >
            {ENTITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Acción */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Acción</span>
          <select
            value={action}
            onChange={(e) => setFilter(setAction)(e.target.value)}
            className={`${selectClassName} h-8 w-44 text-xs`}
          >
            {ACTION_OPTIONS.map((o) => (
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
            onChange={setFilter(setFrom)}
            placeholder="Fecha inicio"
            className="w-40"
          />
        </div>

        {/* Hasta */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Hasta</span>
          <DatePicker
            value={to}
            onChange={setFilter(setTo)}
            placeholder="Fecha fin"
            className="w-40"
          />
        </div>

        {/* Limpiar */}
        {(entityName || action || from || to) && (
          <button
            onClick={() => {
              setFilter(setEntityName)('')
              setAction('')
              setFrom('')
              setTo('')
            }}
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
      <div className="border-b border-zinc-200">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <th className="w-8" />
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 w-36">
                Fecha / Hora
              </th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 w-48">
                Acción
              </th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                Entidad
              </th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 w-28">
                Usuario
              </th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 w-20">
                Origen
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-400">
                  Cargando registros...
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center">
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
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-400">
                  Sin registros para los filtros seleccionados.
                </td>
              </tr>
            )}
            {filtered.map((log) => {
              const isExpanded = expandedId === log.id
              const canExpand  = hasValues(log)

              return (
                <>
                  <tr
                    key={log.id}
                    onClick={() => canExpand && setExpandedId(isExpanded ? null : log.id)}
                    className={`border-b border-zinc-100 transition-colors ${
                      canExpand ? 'cursor-pointer hover:bg-zinc-50' : ''
                    } ${isExpanded ? 'bg-zinc-50' : 'bg-white'}`}
                  >
                    {/* Expand toggle */}
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

                    {/* Timestamp */}
                    <td className="px-4 py-3">
                      <span className="text-xs tabular-nums text-zinc-500">
                        {formatDateTime(log.createdAt)}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide border ${getActionStyle(log.action)}`}
                      >
                        {ACTION_LABELS[log.action] ?? log.action}
                      </span>
                    </td>

                    {/* Entity */}
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-zinc-700">
                        {ENTITY_LABELS[log.entityName] ?? log.entityName}
                      </p>
                      <p className="font-mono text-[10px] text-zinc-400">
                        {truncateUuid(log.entityId)}
                      </p>
                    </td>

                    {/* User */}
                    <td className="px-4 py-3">
                      {log.userRole ? (
                        <span className="text-xs text-zinc-600">{log.userRole}</span>
                      ) : (
                        <span className="text-[10px] text-zinc-300">—</span>
                      )}
                    </td>

                    {/* Source */}
                    <td className="px-4 py-3">
                      <span className="text-xs text-zinc-500">
                        {SOURCE_LABELS[log.source] ?? log.source}
                      </span>
                    </td>
                  </tr>

                  {isExpanded && <LogDetail key={`${log.id}-detail`} log={log} />}
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
    </div>
  )
}
