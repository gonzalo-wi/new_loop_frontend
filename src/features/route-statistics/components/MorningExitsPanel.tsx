import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Sunrise } from 'lucide-react'
import { Panel } from '@/shared/components/ui'
import type { DailyExits, RouteCount } from '../types'

const TOP_ROUTES = 10

type Props = { days: DailyExits[]; byRoute: RouteCount[] }

/** Exits made on the delivery day itself instead of the day before. */
export function MorningExitsPanel({ days, byRoute }: Props) {
  const withMorning = days.filter((d) => d.morning > 0)
  const anyExit = days.some((d) => d.morning + d.dayBefore > 0)
  return (
    <Panel
      title="Salidas hechas a la mañana"
      description="Controles de salida hechos el mismo día del reparto, en vez del día anterior."
      icon={Sunrise}
    >
      {withMorning.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-zinc-500">
          {anyExit ? 'Todas las salidas del período se hicieron el día anterior.' : 'No hubo salidas en el período.'}
        </p>
      ) : (
        <div className="grid divide-y divide-zinc-100 lg:grid-cols-[3fr_2fr] lg:divide-x lg:divide-y-0">
          <ul className="divide-y divide-zinc-100">
            {withMorning.map((d) => (
              <li key={d.date} className="px-5 py-3 text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-medium capitalize text-zinc-900">
                    {format(parseISO(d.date), 'EEE dd/MM', { locale: es })}
                  </span>
                  <span className="tabular-nums text-amber-700">
                    {d.morning} de {d.morning + d.dayBefore}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {d.morningRoutes.map((r) => `${r.routeCode} (${r.branchName})`).join(', ')}
                </p>
              </li>
            ))}
          </ul>
          <div>
            <h3 className="px-5 pt-3 text-xs font-medium uppercase tracking-wide text-zinc-400">Los que más lo hacen</h3>
            <ul className="divide-y divide-zinc-100">
              {byRoute.slice(0, TOP_ROUTES).map((r) => (
                <li key={r.routeId} className="flex items-baseline justify-between gap-3 px-5 py-2.5 text-sm">
                  <span className="min-w-0 truncate">
                    <span className="font-medium text-zinc-900">{r.routeCode}</span>
                    <span className="ml-2 text-xs text-zinc-400">{r.branchName}</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-zinc-700">
                    {r.count} {r.count === 1 ? 'vez' : 'veces'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Panel>
  )
}
