import { useEffect, useRef, useState } from 'react'
import { format, parseISO } from 'date-fns'

export type BarSeries = { key: string; label: string; color: string }

export type DailyBarsPoint = { date: string; values: Record<string, number> }

type Props = {
  data: DailyBarsPoint[]
  series: BarSeries[]
  ariaLabel: string
}

const HEIGHT = 200
const PAD = { top: 12, right: 8, bottom: 28, left: 36 }
const GAP = 2
const MAX_BAR = 18
const MIN_LABEL_SPACING = 48
const TICKS = 4

function niceMax(value: number) {
  if (value <= TICKS) return TICKS
  const pow = 10 ** Math.floor(Math.log10(value))
  const step = ([1, 2, 2.5, 5, 10].find((s) => s * pow * TICKS >= value) ?? 10) * pow
  return step * TICKS
}

/** Grouped bars per day, same hand-made approach as the dispenser statistics chart (no chart library). */
export function DailyBarsChart({ data, series, ariaLabel }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(720)
  const [hover, setHover] = useState<number | null>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const max   = niceMax(Math.max(1, ...data.flatMap((d) => series.map((s) => d.values[s.key] ?? 0))))
  const plotW = Math.max(0, width - PAD.left - PAD.right)
  const plotH = HEIGHT - PAD.top - PAD.bottom
  const band  = data.length ? plotW / data.length : 0
  const barW  = Math.max(2, Math.min(MAX_BAR, (band - 6 - GAP * (series.length - 1)) / series.length))
  const y     = (v: number) => PAD.top + plotH - (v / max) * plotH
  const ticks = Array.from({ length: TICKS + 1 }, (_, i) => (max / TICKS) * i)
  const labelEvery = Math.max(1, Math.ceil(data.length / Math.max(1, Math.floor(plotW / MIN_LABEL_SPACING))))
  const hovered = hover !== null ? data[hover] : null

  return (
    <div ref={wrapRef} className="relative">
      <svg width={width} height={HEIGHT} role="img" aria-label={ariaLabel}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke="#f4f4f5" />
            <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-zinc-400 text-[11px] tabular-nums">
              {Math.round(t).toLocaleString('es-AR')}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const groupW = barW * series.length + GAP * (series.length - 1)
          const x0 = PAD.left + i * band + (band - groupW) / 2
          return (
            <g key={d.date}>
              {hover === i && <rect x={PAD.left + i * band} y={PAD.top} width={band} height={plotH} fill="#f4f4f5" />}
              {series.map((s, j) => {
                const value = d.values[s.key] ?? 0
                if (value <= 0) return null
                const top = y(value)
                return (
                  <rect key={s.key} x={x0 + j * (barW + GAP)} y={top} width={barW}
                        height={PAD.top + plotH - top} rx={2} fill={s.color} />
                )
              })}
              {i % labelEvery === 0 && (
                <text x={PAD.left + i * band + band / 2} y={HEIGHT - 8} textAnchor="middle" className="fill-zinc-400 text-[11px]">
                  {format(parseISO(d.date), 'dd/MM')}
                </text>
              )}
              <rect x={PAD.left + i * band} y={PAD.top} width={band} height={plotH} fill="transparent"
                    onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
            </g>
          )
        })}
      </svg>

      <div className="mt-2 flex flex-wrap gap-4 text-xs text-zinc-500">
        {series.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

      {hovered && (
        <div className="pointer-events-none absolute right-2 top-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs shadow-lg">
          <p className="font-medium text-zinc-900">{format(parseISO(hovered.date), 'dd/MM/yyyy')}</p>
          {series.map((s) => (
            <p key={s.key} className="tabular-nums text-zinc-600">
              {s.label}: {(hovered.values[s.key] ?? 0).toLocaleString('es-AR')}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
