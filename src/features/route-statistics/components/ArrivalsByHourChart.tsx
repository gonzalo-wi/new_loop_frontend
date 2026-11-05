import { useEffect, useRef, useState } from 'react'
import { Clock } from 'lucide-react'
import { Panel } from '@/shared/components/ui'
import { formatClock } from '../lib/duration'
import type { HourArrivals } from '../types'

const HEIGHT = 180
const PAD = { top: 16, right: 8, bottom: 26, left: 32 }
const MAX_BAR = 22
const BAR_COLOR = '#2563eb'
const SELECTED_COLOR = '#1e3a8a'
const GRID_COLOR = '#f4f4f5'
const TICKS = 4
const LABEL_EVERY = 2

type Props = { hours: HourArrivals[]; singleDay: boolean }

const pad2 = (n: number) => String(n).padStart(2, '0')
const hourLabel = (hour: number) => `${pad2(hour)}:00`

/** Arrivals per hour of the entry control; for a single day a bar opens the routes of that hour. */
export function ArrivalsByHourChart({ hours, singleDay }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(720)
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const total = hours.reduce((sum, h) => sum + h.count, 0)
  const max = Math.max(TICKS, Math.ceil(Math.max(0, ...hours.map((h) => h.count)) / TICKS) * TICKS)
  const plotW = Math.max(0, width - PAD.left - PAD.right)
  const plotH = HEIGHT - PAD.top - PAD.bottom
  const band = hours.length ? plotW / hours.length : 0
  const barW = Math.max(2, Math.min(MAX_BAR, band - 4))
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH
  const ticks = Array.from({ length: TICKS + 1 }, (_, i) => (max / TICKS) * i)
  const open = selected !== null ? hours[selected] : null
  const toggle = (i: number) => setSelected(selected === i ? null : i)

  return (
    <Panel
      title="Repartos que entran por hora"
      description={
        singleDay
          ? 'Según la hora del control de entrada. Tocá una barra para ver qué repartos entraron.'
          : 'Según la hora del control de entrada, sumando todo el período. Elegí un solo día para ver qué repartos fueron.'
      }
      icon={Clock}
    >
      {/* The wrapper stays mounted, empty or not, so its width is always measured. */}
      <div ref={wrapRef} className={total === 0 ? undefined : 'px-5 py-4'}>
        {total === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-zinc-500">No entraron repartos en el período.</p>
        ) : (
          <>
            <svg width={width} height={HEIGHT} role="img" aria-label="Repartos que entran por hora">
              {ticks.map((t) => (
                <g key={t}>
                  <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke={GRID_COLOR} />
                  <text x={PAD.left - 6} y={y(t)} dy="0.32em" textAnchor="end" className="fill-zinc-400 text-[11px] tabular-nums">
                    {Math.round(t)}
                  </text>
                </g>
              ))}
              {hours.map((h, i) => {
                const x = PAD.left + i * band + (band - barW) / 2
                const top = y(h.count)
                return (
                  <g key={h.hour}>
                    {h.count > 0 && (
                      <>
                        <rect x={x} y={top} width={barW} height={PAD.top + plotH - top} rx={2}
                              fill={selected === i ? SELECTED_COLOR : BAR_COLOR}>
                          <title>{`${hourLabel(h.hour)}: ${h.count} repartos`}</title>
                        </rect>
                        <text x={x + barW / 2} y={top - 4} textAnchor="middle" className="fill-zinc-500 text-[10px] tabular-nums">
                          {h.count}
                        </text>
                      </>
                    )}
                    {i % LABEL_EVERY === 0 && (
                      <text x={PAD.left + i * band + band / 2} y={HEIGHT - 8} textAnchor="middle" className="fill-zinc-400 text-[11px]">
                        {pad2(h.hour)}
                      </text>
                    )}
                    {singleDay && h.count > 0 && (
                      <rect
                        x={PAD.left + i * band} y={PAD.top} width={band} height={plotH} fill="transparent"
                        className="cursor-pointer outline-none"
                        role="button"
                        tabIndex={0}
                        aria-label={`Ver repartos de las ${hourLabel(h.hour)}`}
                        aria-pressed={selected === i}
                        onClick={() => toggle(i)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            toggle(i)
                          }
                        }}
                      />
                    )}
                  </g>
                )
              })}
            </svg>

          {open && (
            <div className="mt-3 rounded-md border border-zinc-200 bg-zinc-50/60">
              <p className="border-b border-zinc-100 px-4 py-2 text-xs font-medium text-zinc-600">
                De {hourLabel(open.hour)} a {hourLabel((open.hour + 1) % 24)} · {open.count} repartos
              </p>
              <ul className="grid gap-x-6 px-4 py-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                {open.routes.map((r) => (
                  <li key={`${r.routeCode}-${r.branchName}-${r.arrivedAt}`} className="flex items-baseline gap-2 py-1">
                    <span className="tabular-nums text-zinc-500">{formatClock(r.arrivedAt)}</span>
                    <span className="font-medium text-zinc-900">{r.routeCode}</span>
                    <span className="truncate text-xs text-zinc-400">{r.branchName}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          </>
        )}
      </div>
    </Panel>
  )
}
