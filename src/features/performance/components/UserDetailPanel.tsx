import { X, UserRound } from 'lucide-react'
import { ErrorState, LoadingState, Panel } from '@/shared/components/ui'
import { requestErrorMessage, useUserTrend } from '../hooks/usePerformance'
import { submittedControls } from '../lib/summary'
import type { PerformanceFilters, UserPerformance } from '../types'
import { DailyBarsChart, type BarSeries } from './DailyBarsChart'
import { ReasonList } from './ReasonList'

// Same validated pair as the dispenser statistics; red only for what went wrong.
const SUBMITTED_COLOR = '#2563eb'
const FAULTY_COLOR    = '#dc2626'
const LOAD_COLOR      = '#2563eb'
const UNLOAD_COLOR    = '#0d9488'

const CONTROL_SERIES: BarSeries[] = [
  { key: 'submitted', label: 'Controles enviados', color: SUBMITTED_COLOR },
  { key: 'faulty', label: 'Mal hechos', color: FAULTY_COLOR },
]

const DISPENSER_SERIES: BarSeries[] = [
  { key: 'loads', label: 'Cargas', color: LOAD_COLOR },
  { key: 'unloads', label: 'Descargas', color: UNLOAD_COLOR },
]

type Props = {
  user: UserPerformance
  filters: PerformanceFilters
  onClose: () => void
}

export function UserDetailPanel({ user, filters, onClose }: Props) {
  const { data: trend, isLoading, isError, error, refetch } = useUserTrend(user.userId, filters)

  return (
    <Panel
      title={user.username ?? 'Sin usuario'}
      description="Evolución día por día en el período elegido"
      icon={UserRound}
      actions={
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar detalle"
          className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
        >
          <X size={16} />
        </button>
      }
    >
      {isLoading ? (
        <LoadingState message="Cargando evolución…" />
      ) : isError || !trend ? (
        <ErrorState message={requestErrorMessage(error)} onRetry={() => refetch()} />
      ) : (
        <div className="grid gap-6 px-5 py-4 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Controles</h3>
              <DailyBarsChart
                ariaLabel="Controles enviados y mal hechos por día"
                series={CONTROL_SERIES}
                data={trend.days.map((d) => ({
                  date: d.date,
                  values: { submitted: submittedControls(d.controls), faulty: d.controls.faultyControls },
                }))}
              />
            </section>
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Dispensers</h3>
              <DailyBarsChart
                ariaLabel="Cargas y descargas de dispensers por día"
                series={DISPENSER_SERIES}
                data={trend.days.map((d) => ({
                  date: d.date,
                  values: { loads: d.dispensers.loads, unloads: d.dispensers.unloads },
                }))}
              />
            </section>
          </div>
          <section className="rounded-lg border border-zinc-200">
            <h3 className="border-b border-zinc-200 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Motivos de sus rechazos y correcciones
            </h3>
            <ReasonList reasons={trend.reasons} emptyText="Ningún control suyo fue rechazado ni corregido." />
          </section>
        </div>
      )}
    </Panel>
  )
}
