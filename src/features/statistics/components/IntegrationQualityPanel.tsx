import { useState } from 'react'
import { CheckCircle2, AlertTriangle, XCircle, Ban, UserX } from 'lucide-react'
import { DataTable, Panel } from '@/shared/components/ui'
import type { TableColumn } from '@/shared/types'
import { cn, formatDateTime } from '@/shared/lib/utils'
import type { DispenserIssue, DispenserIssueKind, DispenserQuality } from '../types'

const ISSUE_LABEL: Record<DispenserIssueKind, { label: string; cls: string }> = {
  skipped:     { label: 'Omitido · no registrado', cls: 'border-amber-200 bg-amber-50 text-amber-700' },
  aguas_error: { label: 'Error Aguas',            cls: 'border-red-200 bg-red-50 text-red-700' },
  odoo_error:  { label: 'Error Odoo',             cls: 'border-red-200 bg-red-50 text-red-700' },
  excluded:    { label: 'Seriales excluidos',     cls: 'border-amber-200 bg-amber-50 text-amber-700' },
}

// Fallback for an issue kind the backend adds before the panel knows it: show it neutral instead of crashing.
const UNKNOWN_ISSUE_CLS = 'border-zinc-200 bg-zinc-50 text-zinc-600'

function issueLabel(kind: DispenserIssueKind) {
  return ISSUE_LABEL[kind] ?? { label: kind, cls: UNKNOWN_ISSUE_CLS }
}

const PAGE = 25

function share(n: number, total: number) {
  return total ? `${((n / total) * 100).toFixed(n / total < 0.1 ? 1 : 0)}%` : '—'
}

type TileProps = {
  icon: React.ElementType
  label: string
  value: number
  total: number
  tone: 'good' | 'warn' | 'bad' | 'neutral'
}

function QualityTile({ icon: Icon, label, value, total, tone }: TileProps) {
  const active = value > 0
  return (
    <div className="flex items-start gap-3 p-4">
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
          !active ? 'bg-zinc-100 text-zinc-400'
            : tone === 'good' ? 'bg-emerald-50 text-emerald-600'
            : tone === 'warn' ? 'bg-amber-50 text-amber-600'
            : tone === 'bad' ? 'bg-red-50 text-red-600'
            : 'bg-zinc-100 text-zinc-500'
        )}
      >
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[13px] text-zinc-500">{label}</p>
        <p className="mt-0.5 text-xl font-semibold text-zinc-900">
          {value}
          <span className="ml-1.5 text-sm font-normal text-zinc-400">{share(value, total)}</span>
        </p>
      </div>
    </div>
  )
}

type Props = { quality: DispenserQuality }

export function IntegrationQualityPanel({ quality }: Props) {
  const [visible, setVisible] = useState(PAGE)
  const total = quality.activeMovements

  const columns: TableColumn<DispenserIssue>[] = [
    { key: 'date', header: 'Registrado', width: '150px', render: (r) => <span className="text-xs tabular-nums text-zinc-500">{formatDateTime(r.createdAt)}</span> },
    { key: 'type', header: 'Tipo', width: '100px', render: (r) => <span className="text-zinc-700">{r.type === 'LOAD' ? 'Carga' : 'Descarga'}</span> },
    { key: 'route', header: 'Reparto', width: '90px', render: (r) => <span className="font-mono text-xs font-medium text-zinc-700">{r.routeCode}</span> },
    { key: 'technician', header: 'Técnico', render: (r) => <span className="text-zinc-700">{r.technician}</span> },
    { key: 'user', header: 'Usuario', render: (r) => <span className={r.user === 'Sin usuario' ? 'italic text-zinc-400' : 'text-zinc-700'}>{r.user}</span> },
    {
      key: 'issues',
      header: 'Problema',
      render: (r) => (
        <div className="flex flex-wrap gap-1.5">
          {r.kinds.map((k) => (
            <span key={k} className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', issueLabel(k).cls)}>
              {issueLabel(k).label}
              {k === 'excluded' && <span className="ml-1 tabular-nums">({r.excludedCount})</span>}
            </span>
          ))}
        </div>
      ),
    },
  ]

  return (
    <Panel
      title="Calidad de integración"
      description="Movimientos que no llegaron bien a Aguas u Odoo y requieren corrección"
      icon={AlertTriangle}
    >
      <div className="grid grid-cols-2 divide-x divide-y divide-zinc-100 border-b border-zinc-100 lg:grid-cols-5 lg:divide-y-0">
        <QualityTile icon={CheckCircle2} label="Enviados a Aguas" value={quality.sentToAguas} total={total} tone="good" />
        <QualityTile icon={Ban} label="Omitidos · no registrado" value={quality.skippedUnregistered} total={total} tone="warn" />
        <QualityTile icon={XCircle} label="Errores Aguas / Odoo" value={quality.aguasErrors + quality.odooErrors} total={total} tone="bad" />
        <QualityTile icon={AlertTriangle} label="Con seriales excluidos" value={quality.withExcludedSerials} total={total} tone="warn" />
        <QualityTile icon={UserX} label="Sin usuario registrado" value={quality.withoutUser} total={total} tone="neutral" />
      </div>

      <DataTable
        columns={columns}
        data={quality.issues.slice(0, visible)}
        getRowKey={(r) => r.id}
        emptyTitle="Sin problemas"
        emptyDescription="Todos los movimientos del período se integraron correctamente."
      />

      {quality.issues.length > PAGE && (
        <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3 text-xs text-zinc-500">
          <span>
            Mostrando {Math.min(visible, quality.issues.length)} de {quality.issues.length} movimientos con problemas
          </span>
          {visible < quality.issues.length && (
            <button
              onClick={() => setVisible((v) => v + PAGE)}
              className="h-8 rounded-md border border-zinc-200 bg-white px-3.5 text-xs font-medium text-zinc-700 shadow-card hover:bg-zinc-50"
            >
              Ver más
            </button>
          )}
        </div>
      )}
    </Panel>
  )
}
