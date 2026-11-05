import { CalendarDays } from 'lucide-react'
import { Panel } from '@/shared/components/ui'
import { DailyBarsChart, type BarSeries } from '@/features/performance/components/DailyBarsChart'
import type { DailyArrivals } from '../types'

// One color per branch, in the order the backend lists them (by name).
const BRANCH_COLORS = ['#2563eb', '#0d9488', '#d97706', '#7c3aed', '#db2777', '#4b5563']

type Props = { days: DailyArrivals[] }

/** Routes that came back (entry control) per day, one bar per branch. */
export function ArrivalsByDayChart({ days }: Props) {
  const branches = days[0]?.branches ?? []
  const series: BarSeries[] = branches.map((b, i) => ({
    key: b.branchId,
    label: b.branchName,
    color: BRANCH_COLORS[i % BRANCH_COLORS.length],
  }))
  const data = days.map((d) => ({
    date: d.date,
    values: Object.fromEntries(d.branches.map((b) => [b.branchId, b.count])),
  }))
  const total = days.reduce((sum, d) => sum + d.total, 0)

  return (
    <Panel
      title="Repartos por día"
      description="Repartos que volvieron (tienen control de entrada), por sucursal."
      icon={CalendarDays}
    >
      {total === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-zinc-500">No volvieron repartos en el período.</p>
      ) : (
        <div className="px-5 py-4">
          <DailyBarsChart data={data} series={series} ariaLabel="Repartos que volvieron por día y sucursal" />
        </div>
      )}
    </Panel>
  )
}
