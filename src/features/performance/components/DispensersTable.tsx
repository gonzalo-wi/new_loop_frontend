import { useMemo } from 'react'
import { DataTable } from '@/shared/components/ui'
import type { TableColumn } from '@/shared/types'
import { formatCount, formatMinutes } from '../lib/format'
import type { SortValue } from '../lib/sortRows'
import { hasDispenserActivity, userLabel } from '../lib/summary'
import { useSortedRows } from '../hooks/useSortedRows'
import type { UserPerformance } from '../types'

type Props = {
  users: UserPerformance[]
  selectedUserId: string | null
  onSelect: (user: UserPerformance) => void
}

type Column = TableColumn<UserPerformance> & { value: (u: UserPerformance) => SortValue }

const num = (value: number) => <span className="tabular-nums">{formatCount(value)}</span>

const COLUMNS: Column[] = [
  { key: 'user', header: 'Controlador', sortable: true, value: userLabel,
    render: (u) => <span className="font-medium text-zinc-900">{userLabel(u)}</span> },
  { key: 'loads', header: 'Cargas', align: 'right', sortable: true,
    value: (u) => u.dispensers.loads, render: (u) => num(u.dispensers.loads) },
  { key: 'unloads', header: 'Descargas', align: 'right', sortable: true,
    value: (u) => u.dispensers.unloads, render: (u) => num(u.dispensers.unloads) },
  { key: 'serials', header: 'Series', align: 'right', sortable: true,
    value: (u) => u.dispensers.serials, render: (u) => num(u.dispensers.serials) },
  { key: 'avgLoad', header: 'Duración media', align: 'right', sortable: true,
    value: (u) => u.dispensers.avgLoadMinutes,
    render: (u) => (
      <span className="tabular-nums" title={`Mediana: ${formatMinutes(u.dispensers.medianLoadMinutes)}`}>
        {formatMinutes(u.dispensers.avgLoadMinutes)}
      </span>
    ) },
  { key: 'slow', header: 'Lentas', align: 'right', sortable: true,
    value: (u) => u.dispensers.slowLoads,
    render: (u) => (
      <span className={u.dispensers.slowLoads > 0 ? 'font-semibold tabular-nums text-amber-700' : 'tabular-nums'}
            title="Cargas de más de 30 minutos">
        {formatCount(u.dispensers.slowLoads)}
      </span>
    ) },
  { key: 'avgGap', header: 'Entre camiones', align: 'right', sortable: true,
    value: (u) => u.dispensers.avgGapMinutes,
    render: (u) => (
      <span className="tabular-nums" title={`Mediana: ${formatMinutes(u.dispensers.medianGapMinutes)} · sin contar pausas`}>
        {formatMinutes(u.dispensers.avgGapMinutes)}
      </span>
    ) },
  { key: 'pauses', header: 'Pausas', align: 'right', sortable: true,
    value: (u) => u.dispensers.pauses,
    render: (u) => (
      <span className="tabular-nums" title="Huecos de una hora o más entre camiones">{formatCount(u.dispensers.pauses)}</span>
    ) },
  { key: 'cancellations', header: 'Anuladas', align: 'right', sortable: true,
    value: (u) => u.dispensers.cancellations, render: (u) => num(u.dispensers.cancellations) },
  { key: 'excluded', header: 'Excluidas', align: 'right', sortable: true,
    value: (u) => u.dispensers.excludedUnregistered + u.dispensers.excludedUnavailableInOdoo,
    render: (u) => (
      <span className="tabular-nums"
            title={`${u.dispensers.excludedUnregistered} no registradas en jMobile · ${u.dispensers.excludedUnavailableInOdoo} no disponibles en Odoo`}>
        {formatCount(u.dispensers.excludedUnregistered + u.dispensers.excludedUnavailableInOdoo)}
      </span>
    ) },
  { key: 'integration', header: 'Error integración', align: 'right', sortable: true,
    value: (u) => u.dispensers.movementsWithIntegrationErrors, render: (u) => num(u.dispensers.movementsWithIntegrationErrors) },
]

const VALUE_BY_KEY = new Map(COLUMNS.map((c) => [c.key, c.value]))
const valueOf = (u: UserPerformance, key: string): SortValue => VALUE_BY_KEY.get(key)?.(u) ?? null

export function DispensersTable({ users, selectedUserId, onSelect }: Props) {
  const active = useMemo(() => users.filter((u) => hasDispenserActivity(u.dispensers)), [users])
  const { rows, sort, onSortChange } = useSortedRows(active, valueOf, { key: 'loads', direction: 'desc' })

  return (
    <DataTable
      columns={COLUMNS}
      data={rows}
      sort={sort}
      onSortChange={onSortChange}
      getRowKey={(u) => u.userId ?? 'sin-usuario'}
      onRowClick={(u) => u.userId && onSelect(u)}
      rowClassName={(u) => (u.userId !== null && u.userId === selectedUserId ? 'bg-blue-50/60' : undefined)}
      emptyTitle="Sin movimientos de dispensers en el período"
      emptyDescription="Nadie registró cargas ni descargas en estas fechas."
    />
  )
}
