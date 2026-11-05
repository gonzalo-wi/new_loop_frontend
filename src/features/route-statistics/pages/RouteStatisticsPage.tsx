import { useEffect } from 'react'
import { Clock3, MessageSquareWarning, Sunrise, Truck } from 'lucide-react'
import { Combobox, DatePicker, ErrorState, LoadingState, MetricBlock, PageHeader, Panel } from '@/shared/components/ui'
import { cn } from '@/shared/lib/utils'
import { useBranchOptions, usePerformanceFilters } from '@/features/performance/hooks/usePerformance'
import { currentWeek } from '@/features/performance/lib/dateRange'
import { formatCount } from '@/features/performance/lib/format'
import { routeStatisticsErrorMessage, useRouteStatistics } from '../hooks/useRouteStatistics'
import { formatDuration } from '../lib/duration'
import { StayPanel } from '../components/StayPanel'
import { ArrivalsByHourChart } from '../components/ArrivalsByHourChart'
import { ArrivalsByDayChart } from '../components/ArrivalsByDayChart'
import { MorningExitsPanel } from '../components/MorningExitsPanel'
import { RouteRejectionsTable } from '../components/RouteRejectionsTable'

const ALL_BRANCHES = ''

export function RouteStatisticsPage() {
  // Same filters as the performance page: range and branch live in the address.
  const f = usePerformanceFilters()
  const branches = useBranchOptions(f.isAdmin)
  const { data, isLoading, isError, error, refetch, isFetching } = useRouteStatistics(f.filters, !f.error)

  // A branch in the address that does not exist is dropped.
  const { branchId, setBranchId } = f
  useEffect(() => {
    if (branches.data && branchId && !branches.data.some((b) => b.id === branchId)) setBranchId(ALL_BRANCHES)
  }, [branches.data, branchId, setBranchId])

  const week = currentWeek(new Date())
  const isThisWeek = f.filters.from === week.from && f.filters.to === week.to
  const singleDay = f.filters.from === f.filters.to
  const branchOptions = [
    { value: ALL_BRANCHES, label: 'Todas las sucursales' },
    ...(branches.data ?? []).map((b) => ({ value: b.id, label: b.name, sublabel: b.code })),
  ]

  const arrivals = data?.arrivalsByDay.reduce((sum, d) => sum + d.total, 0) ?? 0
  const morning = data?.exitsByDay.reduce((sum, d) => sum + d.morning, 0) ?? 0
  const exits = data?.exitsByDay.reduce((sum, d) => sum + d.morning + d.dayBefore, 0) ?? 0
  const rejections = data?.rejectionsByRoute.reduce((sum, r) => sum + r.rejections, 0) ?? 0
  const stayNote = data
    ? [
        `${formatCount(data.stay.stays)} repartos medidos`,
        data.stay.withoutStay > 0 && `${formatCount(data.stay.withoutStay)} sin salida ese día`,
        data.stay.inconsistent > 0 && `${formatCount(data.stay.inconsistent)} con salida antes de la entrada`,
      ].filter(Boolean).join(' · ')
    : undefined

  return (
    <div className="pb-8">
      <PageHeader
        meta="Estadísticas"
        title="Repartos"
        description="Cuánto tarda cada camión adentro de la planta, a qué hora entran, cuántos vuelven por día y quién rechaza los controles."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={f.resetToThisWeek}
              className={cn(
                'rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium shadow-card transition-colors',
                isThisWeek ? 'text-blue-700' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
              )}
            >
              Esta semana
            </button>
            <DatePicker value={f.filters.from} onChange={f.setFrom} placeholder="Desde" className="w-40" />
            <span className="text-zinc-400">→</span>
            <DatePicker value={f.filters.to} onChange={f.setTo} placeholder="Hasta" className="w-40" />
            {f.isAdmin && (
              <Combobox
                options={branchOptions}
                value={f.branchId}
                onChange={f.setBranchId}
                placeholder="Todas las sucursales"
                searchPlaceholder="Buscar sucursal…"
                className="w-56"
              />
            )}
          </div>
        }
      />

      <div className="space-y-5 px-6">
        {f.error ? (
          <Panel>
            <p className="px-5 py-10 text-center text-sm text-amber-700">{f.error}</p>
          </Panel>
        ) : isLoading ? (
          <Panel>
            <LoadingState message="Calculando estadísticas de repartos…" />
          </Panel>
        ) : isError || !data ? (
          <Panel>
            <ErrorState message={routeStatisticsErrorMessage(error)} onRetry={() => refetch()} />
          </Panel>
        ) : (
          <div className={cn('space-y-5', isFetching && 'opacity-60')}>
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              <MetricBlock label="Tiempo adentro (promedio)" icon={Clock3} value={formatDuration(data.stay.avgSeconds)}
                           note={`Mediana ${formatDuration(data.stay.medianSeconds)} · ${stayNote}`} />
              <MetricBlock label="Repartos que volvieron" icon={Truck} value={formatCount(arrivals)}
                           note="Con control de entrada" />
              <MetricBlock
                label="Salidas a la mañana"
                icon={Sunrise}
                accent={morning > 0 ? 'amber' : 'default'}
                value={formatCount(morning)}
                note={`De ${formatCount(exits)} salidas del período`}
              />
              <MetricBlock
                label="Rechazos del chofer"
                icon={MessageSquareWarning}
                accent={rejections > 0 ? 'red' : 'default'}
                value={formatCount(rejections)}
                note={`${formatCount(data.rejectionsByRoute.length)} repartos`}
              />
            </div>

            <StayPanel byBranch={data.stayByBranch} byRoute={data.stayByRoute} />
            <div className="grid gap-5 xl:grid-cols-2">
              {/* A new range or branch closes the open hour; a background refetch keeps it. */}
              <ArrivalsByHourChart key={`${f.filters.from}-${f.filters.to}-${f.branchId}`}
                                   hours={data.arrivalsByHour} singleDay={singleDay} />
              <ArrivalsByDayChart days={data.arrivalsByDay} />
            </div>
            <MorningExitsPanel days={data.exitsByDay} byRoute={data.morningExitsByRoute} />
            <RouteRejectionsTable rows={data.rejectionsByRoute} />
          </div>
        )}
      </div>
    </div>
  )
}
