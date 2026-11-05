import { Clock3 } from 'lucide-react'
import { Panel } from '@/shared/components/ui'
import { formatCount } from '@/features/performance/lib/format'
import { formatDuration } from '../lib/duration'
import type { BranchStay, RouteStay } from '../types'

const LONGEST_ROUTES = 10

type Props = { byBranch: BranchStay[]; byRoute: RouteStay[] }

/** Average stay per branch and the routes that stay longest (entry control → exit control, same day). */
export function StayPanel({ byBranch, byRoute }: Props) {
  return (
    <Panel
      title="Tiempo adentro de la planta"
      description="Desde el control de entrada hasta el control de salida del mismo día."
      icon={Clock3}
    >
      {byRoute.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-zinc-500">
          No hay repartos con entrada y salida el mismo día en el período.
        </p>
      ) : (
        <div className="grid divide-y divide-zinc-100 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
          <div>
            <h3 className="px-5 pt-3 text-xs font-medium uppercase tracking-wide text-zinc-400">Por sucursal</h3>
            <ul className="divide-y divide-zinc-100">
              {byBranch.map((b) => (
                <li key={b.branchId} className="flex items-baseline justify-between gap-3 px-5 py-2.5 text-sm">
                  <span className="font-medium text-zinc-900">{b.branchName}</span>
                  <span className="tabular-nums text-zinc-700">
                    {formatDuration(b.avgSeconds)}
                    <span className="ml-2 text-xs text-zinc-400">{formatCount(b.stays)} repartos</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="px-5 pt-3 text-xs font-medium uppercase tracking-wide text-zinc-400">Los que más tardan</h3>
            <ul className="divide-y divide-zinc-100">
              {byRoute.slice(0, LONGEST_ROUTES).map((r) => (
                <li key={r.routeId} className="flex items-baseline justify-between gap-3 px-5 py-2.5 text-sm">
                  <span className="min-w-0 truncate">
                    <span className="font-medium text-zinc-900">{r.routeCode}</span>
                    <span className="ml-2 text-xs text-zinc-400">{r.branchName}</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-zinc-700">
                    {formatDuration(r.avgSeconds)}
                    <span className="ml-2 text-xs text-zinc-400">
                      {formatCount(r.stays)} {r.stays === 1 ? 'día' : 'días'}
                    </span>
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
