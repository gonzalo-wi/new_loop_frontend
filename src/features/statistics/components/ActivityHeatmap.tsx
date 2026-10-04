import { useState } from 'react'
import { cn } from '@/shared/lib/utils'
import type { DispenserHeatCell } from '../types'

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const WEEKDAYS_LONG = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

// Sequential single-hue ramp, light → dark; empty cells stay neutral.
const STEPS = ['bg-blue-100', 'bg-blue-200', 'bg-blue-400', 'bg-blue-600', 'bg-blue-800']

type Props = { cells: DispenserHeatCell[] }

export function ActivityHeatmap({ cells }: Props) {
  const [hover, setHover] = useState<DispenserHeatCell | null>(null)

  const lookup = new Map(cells.map((c) => [`${c.weekday}-${c.hour}`, c.movements]))
  const hours = cells.map((c) => c.hour)
  const firstHour = Math.min(7, ...hours)
  const lastHour = Math.max(20, ...hours)
  const hourRange = Array.from({ length: lastHour - firstHour + 1 }, (_, i) => firstHour + i)
  const max = Math.max(1, ...cells.map((c) => c.movements))
  const step = (n: number) => STEPS[Math.min(STEPS.length - 1, Math.floor((n / max) * STEPS.length))]

  const peak = cells.reduce<DispenserHeatCell | null>((best, c) => (!best || c.movements > best.movements ? c : best), null)

  return (
    <div>
      <div className="overflow-x-auto">
        <div
          className="grid min-w-[560px] gap-[3px]"
          style={{ gridTemplateColumns: `36px repeat(${hourRange.length}, minmax(0, 1fr))` }}
          onMouseLeave={() => setHover(null)}
        >
          <span />
          {hourRange.map((h) => (
            <span key={h} className="pb-1 text-center text-[11px] tabular-nums text-zinc-400">
              {h}
            </span>
          ))}
          {WEEKDAYS.map((label, weekday) => (
            <div key={label} className="contents">
              <span className="flex items-center text-xs text-zinc-500">{label}</span>
              {hourRange.map((hour) => {
                const n = lookup.get(`${weekday}-${hour}`) ?? 0
                return (
                  <div
                    key={hour}
                    onMouseEnter={() => setHover({ weekday, hour, movements: n })}
                    className={cn(
                      'h-7 rounded-[4px] transition-shadow',
                      n === 0 ? 'bg-zinc-50' : step(n),
                      hover?.weekday === weekday && hover.hour === hour && 'ring-2 ring-zinc-900 ring-offset-1'
                    )}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500">
        <p className="min-h-[1rem]">
          {hover ? (
            <>
              <span className="font-medium text-zinc-900">
                {WEEKDAYS_LONG[hover.weekday]} {hover.hour}:00–{hover.hour + 1}:00
              </span>{' '}
              · {hover.movements} movimiento{hover.movements !== 1 ? 's' : ''}
            </>
          ) : peak ? (
            <>
              Pico: <span className="font-medium text-zinc-900">{WEEKDAYS_LONG[peak.weekday]} {peak.hour}:00</span> con{' '}
              {peak.movements} movimientos
            </>
          ) : (
            'Sin movimientos en el período'
          )}
        </p>
        <div className="flex items-center gap-1.5">
          <span>Menos</span>
          <span className="h-3 w-3 rounded-[3px] bg-zinc-50 ring-1 ring-inset ring-zinc-200" />
          {STEPS.map((s) => (
            <span key={s} className={cn('h-3 w-3 rounded-[3px]', s)} />
          ))}
          <span>Más</span>
        </div>
      </div>
    </div>
  )
}
