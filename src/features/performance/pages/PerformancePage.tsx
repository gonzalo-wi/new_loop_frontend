import { useMemo, useState } from 'react'
import { AlertTriangle, ClipboardCheck, Droplets, Gauge, MessageSquareWarning, Timer, Truck } from 'lucide-react'
import {
  Combobox,
  DatePicker,
  ErrorState,
  LoadingState,
  MetricBlock,
  PageHeader,
  Panel,
} from '@/shared/components/ui'
import { cn } from '@/shared/lib/utils'
import { requestErrorMessage, useBranchOptions, usePerformanceFilters, usePerformanceSummary } from '../hooks/usePerformance'
import { currentWeek } from '../lib/dateRange'
import { formatCount, formatPercent } from '../lib/format'
import { summaryTotals } from '../lib/summary'
import type { UserPerformance } from '../types'
import { ControlsTable } from '../components/ControlsTable'
import { DispensersTable } from '../components/DispensersTable'
import { MissingEntriesPanel } from '../components/MissingEntriesPanel'
import { ReasonList } from '../components/ReasonList'
import { UserDetailModal } from '../components/UserDetailModal'

const ALL_BRANCHES = ''

export function PerformancePage() {
  const f = usePerformanceFilters()
  const branches = useBranchOptions(f.isAdmin)
  const { data: summary, isLoading, isError, error, refetch, isFetching } = usePerformanceSummary(f.filters, !f.error)
  const [selected, setSelected] = useState<UserPerformance | null>(null)

  const totals = useMemo(() => (summary ? summaryTotals(summary.users, summary.coverage) : null), [summary])
  const week = currentWeek(new Date())
  const isThisWeek = f.filters.from === week.from && f.filters.to === week.to
  const branchOptions = [
    { value: ALL_BRANCHES, label: 'Todas las sucursales' },
    ...(branches.data ?? []).map((b) => ({ value: b.id, label: b.name, sublabel: b.code })),
  ]

  return (
    <div className="pb-8">
      <PageHeader
        meta="Estadísticas"
        title="Desempeño"
        description="Cómo trabaja cada controlador: errores en los controles de stock y ritmo de carga de dispensers."
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
                onChange={(value) => {
                  f.setBranchId(value)
                  setSelected(null)
                }}
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
            <LoadingState message="Calculando desempeño…" />
          </Panel>
        ) : isError || !summary || !totals ? (
          <Panel>
            <ErrorState message={requestErrorMessage(error)} onRetry={() => refetch()} />
          </Panel>
        ) : (
          <div className={cn('space-y-5', isFetching && 'opacity-60')}>
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
              <MetricBlock label="Controles enviados" icon={ClipboardCheck} value={formatCount(totals.submitted)} />
              <MetricBlock
                label="Controles mal hechos"
                icon={AlertTriangle}
                accent={totals.faulty > 0 ? 'red' : 'default'}
                value={formatCount(totals.faulty)}
                note="Rechazados, editados o corregidos"
              />
              <MetricBlock label="% de error" icon={Gauge} value={formatPercent(totals.errorPercent)} />
              <MetricBlock label="Rechazos del chofer" icon={MessageSquareWarning} value={formatCount(totals.rejectionRounds)} />
              <MetricBlock label="Movimientos de dispensers" icon={Droplets} value={formatCount(totals.movements)}
                           note={`${formatCount(totals.slowLoads)} cargas lentas (+30 min)`} />
              <MetricBlock
                label="Repartos sin entrada"
                icon={Truck}
                accent={totals.missingEntries > 0 ? 'amber' : 'default'}
                value={formatCount(totals.missingEntries)}
              />
            </div>

            <Panel
              title="Controles de stock"
              description="Un control está mal hecho si el chofer lo rechazó, se editó después de enviarlo o un supervisor lo corrigió. Tocá un controlador para ver su detalle."
              icon={ClipboardCheck}
            >
              <ControlsTable users={summary.users} selectedUserId={selected?.userId ?? null} onSelect={setSelected} />
            </Panel>

            <Panel
              title="Carga de dispensers"
              description="Duración desde el primer serial escaneado hasta registrar. El tiempo entre camiones no cuenta las pausas de una hora o más. Tocá un controlador para ver su detalle."
              icon={Timer}
            >
              <DispensersTable users={summary.users} selectedUserId={selected?.userId ?? null} onSelect={setSelected} />
            </Panel>

            <div className="grid gap-5 xl:grid-cols-2">
              <MissingEntriesPanel coverage={summary.coverage} />
              <Panel
                title="Motivos más frecuentes"
                description="De rechazos (chofer) y correcciones (supervisor), por quién los escribió."
                icon={MessageSquareWarning}
              >
                <ReasonList reasons={summary.topReasons} showAuthor emptyText="No hubo rechazos ni correcciones en el período." />
              </Panel>
            </div>
          </div>
        )}
      </div>

      {selected && <UserDetailModal user={selected} filters={f.filters} onClose={() => setSelected(null)} />}
    </div>
  )
}
