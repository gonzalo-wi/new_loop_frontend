import { MessageSquareWarning } from 'lucide-react'
import { Panel } from '@/shared/components/ui'
import { formatRate } from '../lib/duration'
import type { RouteRejections } from '../types'

// Old rejections imported from the audit history may have kept no route.
const UNKNOWN_ROUTE = 'Sin reparto'

type Props = { rows: RouteRejections[] }

/** Routes whose drivers rejected entry controls, most rejections first. */
export function RouteRejectionsTable({ rows }: Props) {
  return (
    <Panel
      title="Rechazos por reparto"
      description="Veces que el chofer rechazó el control de entrada. El % es sobre las entradas del reparto en el período."
      icon={MessageSquareWarning}
    >
      {rows.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-zinc-500">Ningún chofer rechazó controles en el período.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-xs font-medium text-zinc-500">
                <th scope="col" className="px-5 py-2.5">Reparto</th>
                <th scope="col" className="px-3 py-2.5 text-right">Rechazos</th>
                <th scope="col" className="px-3 py-2.5 text-right">Controles rechazados</th>
                <th scope="col" className="px-3 py-2.5 text-right">Entradas</th>
                <th scope="col" className="px-3 py-2.5 text-right">%</th>
                <th scope="col" className="px-5 py-2.5">Motivos más comunes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rows.map((r) => (
                <tr key={`${r.routeId ?? 'none'}-${r.routeCode}`} className="align-top">
                  <td className="px-5 py-2.5">
                    <span className="font-medium text-zinc-900">{r.routeCode ?? UNKNOWN_ROUTE}</span>
                    {r.branchName && <span className="ml-2 text-xs text-zinc-400">{r.branchName}</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-medium text-red-700">{r.rejections}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-zinc-700">{r.rejectedControls}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-zinc-700">{r.arrivals}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-zinc-700">{formatRate(r.rate)}</td>
                  <td className="px-5 py-2.5 text-xs text-zinc-600">
                    {r.reasons.length === 0
                      ? <span className="text-zinc-400">Sin motivo escrito</span>
                      : r.reasons.map((reason) => (
                          <p key={reason.reason}>
                            {reason.reason} <span className="tabular-nums text-zinc-400">×{reason.count}</span>
                          </p>
                        ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  )
}
