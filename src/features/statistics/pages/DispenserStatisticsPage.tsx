import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { differenceInCalendarDays, format, parseISO, subDays } from 'date-fns'
import { ArrowDownToLine, ArrowUpFromLine, BarChart3, CalendarClock, Layers, TrendingUp, Truck, Users } from 'lucide-react'
import {
  DataTable,
  DatePicker,
  ErrorState,
  LoadingState,
  MetricBlock,
  PageHeader,
  Panel,
} from '@/shared/components/ui'
import type { TableColumn } from '@/shared/types'
import { cn } from '@/shared/lib/utils'
import { MAX_RANGE_DAYS, fetchDispenserStats } from '../services/statistics.service'
import type { DispenserTechnicianStats } from '../types'
import { DailyVolumeChart, INSTALL_COLOR, WITHDRAW_COLOR } from '../components/DailyVolumeChart'
import { ActivityHeatmap } from '../components/ActivityHeatmap'
import { UserProductivityTable } from '../components/UserProductivityTable'
import { IntegrationQualityPanel } from '../components/IntegrationQualityPanel'

const PRESETS = [
  { days: 7, label: '7 días' },
  { days: 30, label: '30 días' },
  { days: 90, label: '90 días' },
]

const iso = (d: Date) => format(d, 'yyyy-MM-dd')

const technicianColumns: TableColumn<DispenserTechnicianStats>[] = [
  { key: 'technician', header: 'Técnico', render: (r) => <span className="font-medium text-zinc-900">{r.technician}</span> },
  { key: 'routes', header: 'Repartos', align: 'right', render: (r) => <span className="tabular-nums">{r.routes}</span> },
  { key: 'installed', header: 'Instalados', align: 'right', render: (r) => <span className="tabular-nums">{r.installed}</span> },
  { key: 'withdrawn', header: 'Retirados', align: 'right', render: (r) => <span className="tabular-nums">{r.withdrawn}</span> },
  {
    key: 'net',
    header: 'Neto',
    align: 'right',
    render: (r) => {
      const net = r.installed - r.withdrawn
      return (
        // Neutral on purpose: a negative net is a withdrawal route, not a technician fault.
        <span className="font-semibold tabular-nums text-zinc-900">
          {net > 0 ? `+${net}` : net}
        </span>
      )
    },
  },
]

export function DispenserStatisticsPage() {
  const today = new Date()
  const [from, setFrom] = useState(iso(subDays(today, 29)))
  const [to, setTo] = useState(iso(today))

  const rangeDays = from && to ? differenceInCalendarDays(parseISO(to), parseISO(from)) + 1 : 0
  const rangeError =
    !from || !to ? 'Elegí un rango de fechas.'
      : rangeDays < 1 ? 'La fecha "Desde" tiene que ser anterior a "Hasta".'
      : rangeDays > MAX_RANGE_DAYS ? `El rango máximo es de ${MAX_RANGE_DAYS} días.`
      : null

  const { data: stats, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['statistics', 'dispensers', from, to],
    queryFn: () => fetchDispenserStats({ from, to }),
    enabled: !rangeError,
    staleTime: 5 * 60_000,
  })

  function applyPreset(days: number) {
    setFrom(iso(subDays(today, days - 1)))
    setTo(iso(today))
  }

  const v = stats?.volume

  return (
    <div className="pb-8">
      <PageHeader
        meta="Estadísticas"
        title="Dispensers"
        description="Instalaciones (cargas a clientes), retiros (devoluciones) y calidad operativa."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-1 shadow-card">
              {PRESETS.map((p) => {
                const active = rangeDays === p.days && to === iso(today)
                return (
                  <button
                    key={p.days}
                    onClick={() => applyPreset(p.days)}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                      active ? 'bg-blue-50 text-blue-700' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
                    )}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>
            <DatePicker value={from} onChange={setFrom} placeholder="Desde" className="w-40" />
            <span className="text-zinc-400">→</span>
            <DatePicker value={to} onChange={setTo} placeholder="Hasta" className="w-40" />
          </div>
        }
      />

      <div className="space-y-5 px-6">
        {rangeError ? (
          <Panel>
            <p className="px-5 py-10 text-center text-sm text-amber-700">{rangeError}</p>
          </Panel>
        ) : isLoading ? (
          <Panel>
            <LoadingState message="Calculando estadísticas…" />
          </Panel>
        ) : isError || !stats || !v ? (
          <Panel>
            <ErrorState onRetry={() => refetch()} />
          </Panel>
        ) : (
          <>
            {/* ── Volume KPIs ───────────────────────────────────────────── */}
            <div className={cn('grid grid-cols-2 gap-4 xl:grid-cols-5', isFetching && 'opacity-60')}>
              <MetricBlock
                label="Dispensers instalados"
                icon={ArrowUpFromLine}
                accent="blue"
                value={v.installedDispensers.toLocaleString('es-AR')}
                note={`${v.installMovements} cargas a clientes`}
              />
              <MetricBlock
                label="Dispensers retirados"
                icon={ArrowDownToLine}
                value={v.withdrawnDispensers.toLocaleString('es-AR')}
                note={`${v.withdrawalMovements} descargas por devolución`}
              />
              <MetricBlock
                label="Crecimiento neto del parque"
                icon={TrendingUp}
                accent={v.netDispensers > 0 ? 'green' : v.netDispensers < 0 ? 'red' : 'default'}
                value={v.netDispensers > 0 ? `+${v.netDispensers.toLocaleString('es-AR')}` : v.netDispensers.toLocaleString('es-AR')}
                note="instalados − retirados"
              />
              <MetricBlock
                label="Retiros cada 100 instalaciones"
                icon={BarChart3}
                accent={v.withdrawalsPer100 !== null && v.withdrawalsPer100 >= 100 ? 'red' : v.withdrawalsPer100 !== null && v.withdrawalsPer100 >= 60 ? 'amber' : 'default'}
                value={v.withdrawalsPer100 === null ? '—' : Math.round(v.withdrawalsPer100)}
                note="más de 100 = el parque se achica"
              />
              <MetricBlock
                label="Dispensers por movimiento"
                icon={Layers}
                value={v.avgSerialsPerMovement === null ? '—' : v.avgSerialsPerMovement.toFixed(1)}
                note={`máximo ${v.maxSerialsPerMovement} en un movimiento`}
              />
            </div>

            {/* ── Daily volume ──────────────────────────────────────────── */}
            <Panel
              title="Instalaciones y retiros por día"
              description="Cantidad de dispensers por fecha del movimiento"
              icon={CalendarClock}
              actions={
                <div className="flex items-center gap-4 text-xs text-zinc-600">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: INSTALL_COLOR }} /> Instalados
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: WITHDRAW_COLOR }} /> Retirados
                  </span>
                </div>
              }
            >
              <div className="px-5 py-4">
                <DailyVolumeChart data={stats.daily} />
              </div>
            </Panel>

            {/* ── Heatmap ───────────────────────────────────────────────── */}
            <Panel
              title="Actividad por día y hora"
              description="Movimientos registrados — sirve para dimensionar personal en planta"
              icon={BarChart3}
            >
              <div className="px-5 py-5">
                <ActivityHeatmap cells={stats.heatmap} />
              </div>
            </Panel>

            {/* ── Productivity ──────────────────────────────────────────── */}
            <Panel
              title="Productividad por usuario"
              description="Quién registró cada movimiento · Ritmo = minutos medianos entre un movimiento y el siguiente (sin contar pausas de más de 1 h)"
              icon={Users}
            >
              <UserProductivityTable rows={stats.users} />
            </Panel>

            <Panel
              title="Por técnico"
              description="Dispensers instalados y retirados por el técnico del reparto"
              icon={Truck}
            >
              <DataTable
                columns={technicianColumns}
                data={stats.technicians}
                getRowKey={(r) => r.technician}
                emptyTitle="Sin movimientos"
                emptyDescription="No hay movimientos en el período."
              />
            </Panel>

            {/* ── Integration quality ───────────────────────────────────── */}
            <IntegrationQualityPanel quality={stats.quality} />
          </>
        )}
      </div>
    </div>
  )
}
