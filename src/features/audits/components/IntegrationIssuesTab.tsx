import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, Clock, Loader2, RefreshCw, XCircle } from 'lucide-react'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { DataTable, MetricBlock, Panel } from '@/shared/components/ui'
import { timeAgo } from '@/shared/lib/utils'
import type { TableColumn } from '@/shared/types'
import { fetchIntegrationIssues, retryIntegration } from '../services/integration-issues.service'
import {
  attemptsLabel,
  canRetry,
  describeRecord,
  integrationLabel,
  kindBadge,
  operationLabel,
  retryHint,
} from '../integration-issues'
import type { IntegrationIssue } from '../types'

const QUERY_KEY = ['integration-issues']

function issueKey(issue: IntegrationIssue): string {
  return issue.logId ?? `${issue.entityName}-${issue.entityId}`
}

export function IntegrationIssuesTab() {
  const queryClient = useQueryClient()
  const isAdmin     = useAuthStore((s) => s.user?.role === 'admin')
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn:  fetchIntegrationIssues,
    refetchInterval: 60_000,
  })

  const retry = useMutation({
    mutationFn: retryIntegration,
    onMutate:   () => setNotice(null),
    onSuccess:  () => {
      setNotice({ kind: 'success', text: 'Se reintentó el envío. Si vuelve a fallar, la fila muestra el nuevo error.' })
      return queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
    onError:    (err) =>
      setNotice({ kind: 'error', text: err instanceof Error ? err.message : 'No se pudo reintentar el envío.' }),
  })

  const issues  = data?.issues ?? []
  const summary = data?.summary

  const columns: TableColumn<IntegrationIssue>[] = [
    {
      key: 'kind',
      header: 'Estado',
      render: (r) => {
        const badge = kindBadge(r.kind)
        return (
          <span
            title={badge.hint}
            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badge.cls}`}
          >
            {badge.label}
          </span>
        )
      },
    },
    {
      key: 'record',
      header: 'Registro',
      render: (r) => <span className="text-sm font-medium text-zinc-800">{describeRecord(r)}</span>,
    },
    {
      key: 'destination',
      header: 'Destino',
      render: (r) => (
        <div className="flex flex-col">
          <span className="text-sm text-zinc-800">{integrationLabel(r)}</span>
          <span className="text-xs text-zinc-500">{operationLabel(r)}</span>
        </div>
      ),
    },
    {
      key: 'since',
      header: 'Desde',
      render: (r) => <span className="whitespace-nowrap text-xs tabular-nums text-zinc-600">{timeAgo(r.since)}</span>,
    },
    {
      key: 'attempts',
      header: 'Intentos',
      align: 'right',
      render: (r) => <span className="text-xs tabular-nums text-zinc-600">{attemptsLabel(r)}</span>,
    },
    {
      key: 'error',
      header: 'Último error',
      render: (r) => (
        <span title={r.lastError ?? undefined} className="block max-w-xs truncate text-xs text-zinc-500">
          {r.lastError ?? '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      // The hint is for everyone; only the retry button is admin-only.
      render: (r) => {
        if (!canRetry(r) || !r.logId) {
          const hint = retryHint(r)
          return hint ? <span className="text-xs text-zinc-500">{hint}</span> : null
        }
        if (!isAdmin) return null
        const logId     = r.logId
        const isPending = retry.isPending && retry.variables === logId
        return (
          <button
            type="button"
            onClick={() => retry.mutate(logId)}
            disabled={retry.isPending}
            className="inline-flex h-7 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            {isPending ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            Reintentar
          </button>
        )
      },
    },
  ]

  return (
    <div>
      <div className="grid grid-cols-4 gap-4 px-6">
        <MetricBlock
          label="Reintentos agotados"
          value={summary?.retriesExhausted ?? '—'}
          icon={XCircle}
          accent={summary?.retriesExhausted ? 'red' : 'default'}
          note="requieren acción manual"
        />
        <MetricBlock
          label="Trabados"
          value={summary?.stuck ?? '—'}
          icon={Clock}
          accent={summary?.stuck ? 'amber' : 'default'}
          note="se empezaron a enviar y no respondieron"
        />
        <MetricBlock
          label="Nunca enviados"
          value={summary?.neverSent ?? '—'}
          icon={AlertTriangle}
          accent={summary?.neverSent ? 'amber' : 'default'}
          note="listos pero sin ningún intento"
        />
        <MetricBlock
          label="Reintentando"
          value={summary?.retrying ?? '—'}
          icon={RefreshCw}
          accent={summary?.retrying ? 'blue' : 'default'}
          note="el sistema los reintenta solo"
        />
      </div>

      {data?.truncated && (
        <p className="mx-6 mt-4 flex items-center gap-1.5 text-xs text-amber-700">
          <AlertTriangle size={12} />
          Hay más pendientes de los que se muestran: los contadores y la lista son parciales.
        </p>
      )}

      {notice && (
        <p
          role={notice.kind === 'error' ? 'alert' : 'status'}
          className={
            notice.kind === 'error'
              ? 'mx-6 mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'
              : 'mx-6 mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700'
          }
        >
          {notice.text}
        </p>
      )}

      <Panel className="mx-6 mt-5">
        <DataTable
          columns={columns}
          data={issues}
          // "Todo llegó" must only show for a real empty answer, never while there is no data yet.
          isLoading={isLoading || (!data && !isError)}
          isError={isError}
          onRetry={() => refetch()}
          getRowKey={issueKey}
          emptyTitle="Todo llegó a Aguas y Odoo"
          emptyDescription="No hay controles ni movimientos de dispensers pendientes de envío."
        />
      </Panel>

      {issues.length > 0 && !isAdmin && (
        <p className="mx-6 mt-3 flex items-center gap-1.5 text-xs text-zinc-500">
          <CheckCircle2 size={12} />
          Solo un administrador puede reintentar envíos.
        </p>
      )}
    </div>
  )
}
