import { useRef } from 'react'
import { format, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, UserRound, X } from 'lucide-react'
import { ErrorState, LoadingState } from '@/shared/components/ui'
import { useEscapeKey } from '@/shared/hooks/useEscapeKey'
import { useFocusTrap } from '@/shared/hooks/useFocusTrap'
import { cn } from '@/shared/lib/utils'
import { requestErrorMessage, useUserTrend } from '../hooks/usePerformance'
import { rangeDays } from '../lib/dateRange'
import { formatCount, formatMinutes, formatPercent } from '../lib/format'
import { isLowSample } from '../lib/lowSample'
import { movements, submittedControls, userLabel } from '../lib/summary'
import { groupByWeek, WEEKLY_AFTER_DAYS } from '../lib/weekly'
import type { PerformanceFilters, UserPerformance } from '../types'
import { DailyBarsChart, type BarSeries, type DailyBarsPoint } from './DailyBarsChart'
import { LowSampleTag } from './LowSampleTag'
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

const TITLE_ID = 'user-detail-title'

type Props = {
  user: UserPerformance
  filters: PerformanceFilters
  onClose: () => void
  // Neighbours in the table it was opened from (FR-42); null at either end.
  onPrevious: (() => void) | null
  onNext: (() => void) | null
}

function Stat({ label, value, alert = false, tag }: { label: string; value: string; alert?: boolean; tag?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-200 px-4 py-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={cn('mt-1 flex items-center gap-1.5 text-lg font-semibold tabular-nums', alert ? 'text-red-700' : 'text-zinc-900')}>
        {value}
        {tag}
      </p>
    </div>
  )
}

function NavButton({ label, onClick, children }: { label: string; onClick: (() => void) | null; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick ?? undefined}
      disabled={!onClick}
      aria-label={label}
      title={label}
      className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  )
}

function dayLabel(isoDay: string): string {
  return format(parseISO(isoDay), 'dd/MM/yyyy')
}

export function UserDetailModal({ user, filters, onClose, onPrevious, onNext }: Props) {
  const { data: trend, isLoading, isError, error, refetch } = useUserTrend(user.userId, filters)
  const dialogRef = useRef<HTMLDivElement>(null)
  useEscapeKey(onClose)
  useFocusTrap(dialogRef)

  const { controls, dispensers } = user
  const weekly = rangeDays(filters) > WEEKLY_AFTER_DAYS
  const byPeriod = (points: DailyBarsPoint[]) => (weekly ? groupByWeek(points) : points)
  const chartTitle = weekly ? 'por semana' : 'por día'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-zinc-900/30" onClick={onClose} />
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
        className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg focus:outline-none"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-900 text-white">
              <UserRound size={16} />
            </div>
            <div>
              <h2 id={TITLE_ID} className="text-sm font-semibold text-zinc-900">{userLabel(user)}</h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Del {dayLabel(filters.from)} al {dayLabel(filters.to)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <NavButton label="Controlador anterior" onClick={onPrevious}><ChevronLeft size={16} /></NavButton>
            <NavButton label="Controlador siguiente" onClick={onNext}><ChevronRight size={16} /></NavButton>
            <span className="mx-1 h-5 w-px bg-zinc-200" aria-hidden />
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar detalle"
              className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Stat label="Controles enviados" value={formatCount(submittedControls(controls))} />
            <Stat label="Mal hechos" value={formatCount(controls.faultyControls)} alert={controls.faultyControls > 0} />
            <Stat label="% de error" value={formatPercent(controls.errorPercent)}
                  tag={isLowSample(controls) ? <LowSampleTag /> : undefined} />
            <Stat label="Rechazos del chofer" value={formatCount(controls.rejectionRounds)} />
            <Stat label="Movimientos de dispensers" value={formatCount(movements(dispensers))} />
            <Stat label="Duración media de carga" value={formatMinutes(dispensers.avgLoadMinutes)} />
          </div>

          {controls.faultyControls > 0 && (
            <p className="mt-3 text-xs text-zinc-500">
              Mal hechos por causa: {formatCount(controls.rejectedControls)} rechazados por el chofer ·{' '}
              {formatCount(controls.editedControls)} editados después de enviar ·{' '}
              {formatCount(controls.correctedControls)} corregidos por un supervisor.
              Un control puede tener más de una causa.
            </p>
          )}

          {isLoading ? (
            <LoadingState message="Cargando evolución…" />
          ) : isError || !trend ? (
            <ErrorState message={requestErrorMessage(error)} onRetry={() => refetch()} />
          ) : (
            <div className="mt-6 grid gap-6 xl:grid-cols-3">
              <div className="space-y-6 xl:col-span-2">
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Controles {chartTitle}</h3>
                  <DailyBarsChart
                    ariaLabel={`Controles enviados y mal hechos ${chartTitle}`}
                    series={CONTROL_SERIES}
                    period={weekly ? 'week' : 'day'}
                    data={byPeriod(trend.days.map((d) => ({
                      date: d.date,
                      values: { submitted: submittedControls(d.controls), faulty: d.controls.faultyControls },
                    })))}
                  />
                </section>
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Dispensers {chartTitle}</h3>
                  <DailyBarsChart
                    ariaLabel={`Cargas y descargas de dispensers ${chartTitle}`}
                    series={DISPENSER_SERIES}
                    period={weekly ? 'week' : 'day'}
                    data={byPeriod(trend.days.map((d) => ({
                      date: d.date,
                      values: { loads: d.dispensers.loads, unloads: d.dispensers.unloads },
                    })))}
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
        </div>
      </div>
    </div>
  )
}
