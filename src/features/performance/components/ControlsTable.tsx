import { useMemo } from 'react'
import { ClipboardCheck } from 'lucide-react'
import { DataTable, Panel } from '@/shared/components/ui'
import type { TableColumn } from '@/shared/types'
import type { CsvColumn } from '../lib/csv'
import type { DateRange } from '../lib/dateRange'
import { formatCount, formatMinutes, formatPercent } from '../lib/format'
import { isLowSample } from '../lib/lowSample'
import type { SortValue } from '../lib/sortRows'
import { hasControlActivity, submittedControls, userLabel } from '../lib/summary'
import { useSortedRows } from '../hooks/useSortedRows'
import type { UserPerformance } from '../types'
import { ExportCsvButton } from './ExportCsvButton'
import { LowSampleTag } from './LowSampleTag'
import { UserCell } from './UserCell'

type Props = {
  users: UserPerformance[]
  range: DateRange
  selectedUserId: string | null
  onSelect: (user: UserPerformance, ordered: UserPerformance[]) => void
}

// The sort value is also what the CSV gets: plain numbers, no units (FR-44).
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
    render: (u) => (
      <span className="inline-flex items-center gap-1.5 tabular-nums">
        {isLowSample(u.controls) && <LowSampleTag />}
        {formatPercent(u.controls.errorPercent)}
      </span>
    ) },
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

const CSV_COLUMNS: CsvColumn<UserPerformance>[] = COLUMNS.map((c) => ({ header: c.header, exportValue: c.value }))

const VALUE_BY_KEY = new Map(COLUMNS.map((c) => [c.key, c.value]))
const valueOf = (u: UserPerformance, key: string): SortValue => VALUE_BY_KEY.get(key)?.(u) ?? null
// By error rate, users with too few controls go after the rest whatever the direction (FR-38).
const tierOf = (u: UserPerformance, key: string) => (key === 'errorPercent' && isLowSample(u.controls) ? 1 : 0)

export function ControlsTable({ users, range, selectedUserId, onSelect }: Props) {
  const active = useMemo(() => users.filter((u) => hasControlActivity(u.controls)), [users])
  const { rows, sort, onSortChange } = useSortedRows(active, valueOf, { key: 'faulty', direction: 'desc' }, tierOf)

  return (
    <Panel
      title="Controles de stock"
      description="Un control está mal hecho si el chofer lo rechazó, se editó después de enviarlo o un supervisor lo corrigió. Tocá un controlador para ver su detalle."
      icon={ClipboardCheck}
      actions={<ExportCsvButton table="controles" range={range} rows={rows} columns={CSV_COLUMNS} />}
    >
      <DataTable
        columns={COLUMNS}
        data={rows}
        sort={sort}
        onSortChange={onSortChange}
        getRowKey={(u) => u.userId ?? 'sin-usuario'}
        onRowClick={(u) => u.userId && onSelect(u, rows)}
        rowClassName={(u) => (u.userId !== null && u.userId === selectedUserId ? 'bg-blue-50/60' : undefined)}
        emptyTitle="Sin controles en el período"
        emptyDescription="Nadie envió, editó ni corrigió controles de stock en estas fechas."
      />
    </Panel>
  )
}
