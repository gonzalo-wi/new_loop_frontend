import { useMemo } from 'react'
import { DataTable } from '@/shared/components/ui'
import type { TableColumn } from '@/shared/types'
import { formatCount, formatMinutes, formatPercent } from '../lib/format'
import type { SortValue } from '../lib/sortRows'
import { hasControlActivity, submittedControls, userLabel } from '../lib/summary'
import { useSortedRows } from '../hooks/useSortedRows'
import type { UserPerformance } from '../types'
import { UserCell } from './UserCell'

type Props = {
  users: UserPerformance[]
  selectedUserId: string | null
  onSelect: (user: UserPerformance) => void
}

type Column = TableColumn<UserPerformance> & { value: (u: UserPerformance) => SortValue }

const num = (value: number) => <span className="tabular-nums">{formatCount(value)}</span>

const COLUMNS: Column[] = [
  { key: 'user', header: 'Controlador', sortable: true, value: userLabel,
    render: (u) => <UserCell user={u} /> },
  { key: 'submitted', header: 'Enviados', align: 'right', sortable: true,
    value: (u) => submittedControls(u.controls),
    render: (u) => (
      <span className="tabular-nums" title={`${u.controls.exitsSubmitted} salidas · ${u.controls.entriesSubmitted} entradas`}>
        {formatCount(submittedControls(u.controls))}
      </span>
    ) },
  { key: 'faulty', header: 'Mal hechos', align: 'right', sortable: true,
    value: (u) => u.controls.faultyControls,
    render: (u) => (
      <span className={u.controls.faultyControls > 0 ? 'font-semibold tabular-nums text-red-700' : 'tabular-nums'}>
        {formatCount(u.controls.faultyControls)}
      </span>
    ) },
  { key: 'errorPercent', header: '% error', align: 'right', sortable: true,
    value: (u) => u.controls.errorPercent,
    render: (u) => <span className="tabular-nums">{formatPercent(u.controls.errorPercent)}</span> },
  { key: 'rejections', header: 'Rechazos', align: 'right', sortable: true,
    value: (u) => u.controls.rejectionRounds, render: (u) => num(u.controls.rejectionRounds) },
  { key: 'firstPass', header: '1er intento', align: 'right', sortable: true,
    value: (u) => u.controls.firstPassAcceptancePercent,
    render: (u) => <span className="tabular-nums">{formatPercent(u.controls.firstPassAcceptancePercent)}</span> },
  { key: 'response', header: 'Resp. chofer', align: 'right', sortable: true,
    value: (u) => u.controls.avgDriverResponseMinutes,
    render: (u) => <span className="tabular-nums">{formatMinutes(u.controls.avgDriverResponseMinutes)}</span> },
  { key: 'edits', header: 'Ediciones', align: 'right', sortable: true,
    value: (u) => u.controls.edits,
    render: (u) => (
      <span className="tabular-nums" title={`${u.controls.resubmissions} para reenviar un rechazo`}>
        {formatCount(u.controls.edits)}
      </span>
    ) },
  { key: 'corrections', header: 'Correcciones', align: 'right', sortable: true,
    value: (u) => u.controls.corrections, render: (u) => num(u.controls.corrections) },
  { key: 'integration', header: 'Error Aguas', align: 'right', sortable: true,
    value: (u) => u.controls.controlsWithIntegrationErrors, render: (u) => num(u.controls.controlsWithIntegrationErrors) },
]

const VALUE_BY_KEY = new Map(COLUMNS.map((c) => [c.key, c.value]))
const valueOf = (u: UserPerformance, key: string): SortValue => VALUE_BY_KEY.get(key)?.(u) ?? null

export function ControlsTable({ users, selectedUserId, onSelect }: Props) {
  const active = useMemo(() => users.filter((u) => hasControlActivity(u.controls)), [users])
  const { rows, sort, onSortChange } = useSortedRows(active, valueOf, { key: 'faulty', direction: 'desc' })

  return (
    <DataTable
      columns={COLUMNS}
      data={rows}
      sort={sort}
      onSortChange={onSortChange}
      getRowKey={(u) => u.userId ?? 'sin-usuario'}
      onRowClick={(u) => u.userId && onSelect(u)}
      rowClassName={(u) => (u.userId !== null && u.userId === selectedUserId ? 'bg-blue-50/60' : undefined)}
      emptyTitle="Sin controles en el período"
      emptyDescription="Nadie envió, editó ni corrigió controles de stock en estas fechas."
    />
  )
}
