import { DataTable } from '@/shared/components/ui'
import type { TableColumn } from '@/shared/types'
import { cn } from '@/shared/lib/utils'
import type { DispenserUserStats } from '../types'

function pct(rate: number) {
  return `${Math.round(rate * 100)}%`
}

// Below this many movements a rate is noise (1 of 1 = 100%), so it isn't highlighted.
const MIN_SAMPLE = 10

type RateProps = { rate: number; sample: number; warnAt: number; dangerAt: number }

function RateCell({ rate, sample, warnAt, dangerAt }: RateProps) {
  const flag = sample >= MIN_SAMPLE
  return (
    <span
      title={flag ? undefined : `Pocos movimientos (${sample}) para evaluar la tasa`}
      className={cn(
        'whitespace-nowrap tabular-nums',
        flag && rate >= dangerAt ? 'font-semibold text-red-700'
          : flag && rate >= warnAt ? 'font-medium text-amber-700'
          : 'text-zinc-500'
      )}
    >
      {rate === 0 ? '—' : pct(rate)}
    </span>
  )
}

type Props = { rows: DispenserUserStats[] }

export function UserProductivityTable({ rows }: Props) {
  const maxMovements = Math.max(1, ...rows.map((r) => r.movements))

  const columns: TableColumn<DispenserUserStats>[] = [
    {
      key: 'user',
      header: 'Usuario',
      render: (r) => (
        <span className={cn('font-medium', r.user === 'Sin usuario' ? 'italic text-zinc-400' : 'text-zinc-900')}>
          {r.user}
        </span>
      ),
    },
    {
      key: 'movements',
      header: 'Movim.',
      width: '180px',
      render: (r) => (
        <div className="flex items-center gap-3">
          <span className="w-8 text-right font-semibold tabular-nums text-zinc-900">{r.movements}</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
            <div className="h-full rounded-full bg-blue-600" style={{ width: `${(r.movements / maxMovements) * 100}%` }} />
          </div>
        </div>
      ),
    },
    { key: 'install', header: 'Cargas', align: 'right', render: (r) => <span className="tabular-nums">{r.installMovements}</span> },
    { key: 'withdraw', header: 'Descargas', align: 'right', render: (r) => <span className="tabular-nums">{r.withdrawalMovements}</span> },
    { key: 'dispensers', header: 'Dispensers', align: 'right', render: (r) => <span className="tabular-nums">{r.dispensers}</span> },
    {
      key: 'pace',
      header: 'Ritmo',
      align: 'right',
      render: (r) =>
        r.medianGapMinutes === null ? (
          <span className="text-zinc-400">—</span>
        ) : (
          <span className="whitespace-nowrap tabular-nums text-zinc-700">
            {r.medianGapMinutes < 1 ? '<1' : Math.round(r.medianGapMinutes)} min
          </span>
        ),
    },
    { key: 'skipped', header: 'Omitidos', align: 'right', render: (r) => <RateCell rate={r.skippedRate} sample={r.movements} warnAt={0.1} dangerAt={0.25} /> },
    { key: 'errors', header: 'Errores', align: 'right', render: (r) => <RateCell rate={r.errorRate} sample={r.movements} warnAt={0.05} dangerAt={0.15} /> },
    { key: 'excluded', header: 'Excluidos', align: 'right', render: (r) => <RateCell rate={r.excludedRate} sample={r.movements} warnAt={0.15} dangerAt={0.3} /> },
  ]

  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowKey={(r) => r.user}
      emptyTitle="Sin movimientos"
      emptyDescription="No hay movimientos registrados en el período."
    />
  )
}
