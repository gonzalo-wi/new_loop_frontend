import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Truck } from 'lucide-react'
import { Panel } from '@/shared/components/ui'
import type { CoverageDay } from '../types'

type Props = { coverage: CoverageDay[] }

/** Routes that went out and have no entry control for that date: every truck that leaves comes back. */
export function MissingEntriesPanel({ coverage }: Props) {
  const missing = coverage.filter((day) => day.missingEntries > 0)
  return (
    <Panel
      title="Repartos que volvieron sin control de entrada"
      description="Solo días que ya terminaron: lo de hoy todavía puede estar en la calle."
      icon={Truck}
    >
      {missing.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-zinc-500">
          {coverage.length === 0 ? 'No hubo salidas en días ya terminados del período.' : 'Todos los repartos que salieron tienen su control de entrada.'}
        </p>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {missing.map((day) => (
            <li key={`${day.branchId}-${day.controlDate}`} className="px-5 py-3 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium text-zinc-900">
                  {format(parseISO(day.controlDate), "EEE dd/MM", { locale: es })} · {day.branchName}
                </span>
                <span className="tabular-nums text-red-700">
                  {day.missingEntries} de {day.expectedEntries}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">{day.missingRoutes.join(', ')}</p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
