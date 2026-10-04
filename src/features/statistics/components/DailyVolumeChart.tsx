import { useEffect, useRef, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { DispenserDailyPoint } from '../types'

// Categorical pair validated for CVD separation (dataviz validator, light surface).
export const INSTALL_COLOR = '#2563eb'
export const WITHDRAW_COLOR = '#0d9488'

const HEIGHT = 240
const PAD = { top: 12, right: 8, bottom: 28, left: 40 }

function niceMax(value: number) {
  if (value <= 4) return 4
  const pow = 10 ** Math.floor(Math.log10(value))
  const step = [1, 2, 2.5, 5, 10].find((s) => (s * pow * 4) >= value)! * pow
  return step * 4
}

type Props = { data: DispenserDailyPoint[] }

export function DailyVolumeChart({ data }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(800)
  const [hover, setHover] = useState<number | null>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const max = niceMax(Math.max(1, ...data.map((d) => Math.max(d.installed, d.withdrawn))))
  const plotW = Math.max(0, width - PAD.left - PAD.right)
  const plotH = HEIGHT - PAD.top - PAD.bottom
  const band = data.length ? plotW / data.length : 0
  const barW = Math.max(2, Math.min(24, (band - 6) / 2))
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH
  const ticks = [0, 1, 2, 3, 4].map((i) => (max / 4) * i)
  const labelEvery = Math.max(1, Math.ceil(data.length / Math.max(1, Math.floor(plotW / 56))))

  // Column with a 4px rounded data-end and a square baseline.
  function bar(x: number, value: number, color: string) {
    if (value <= 0) return null
    const top = y(value)
    const h = PAD.top + plotH - top
    const r = Math.min(4, h, barW / 2)
    return (
      <path
        d={`M${x},${top + h} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${top + h} Z`}
        fill={color}
      />
    )
  }

  const hovered = hover !== null ? data[hover] : null

  return (
    <div ref={wrapRef} className="relative">
      <svg width={width} height={HEIGHT} role="img" aria-label="Dispensers instalados y retirados por día">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke="#f4f4f5" />
            <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-zinc-400 text-[11px] tabular-nums">
              {Math.round(t).toLocaleString('es-AR')}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const x0 = PAD.left + i * band + (band - (barW * 2 + 2)) / 2
          return (
            <g key={d.date}>
              {hover === i && (
                <rect x={PAD.left + i * band} y={PAD.top} width={band} height={plotH} fill="#f4f4f5" />
              )}
              {bar(x0, d.installed, INSTALL_COLOR)}
              {bar(x0 + barW + 2, d.withdrawn, WITHDRAW_COLOR)}
              {i % labelEvery === 0 && (
                <text x={PAD.left + i * band + band / 2} y={HEIGHT - 8} textAnchor="middle" className="fill-zinc-400 text-[11px]">
                  {format(parseISO(d.date), 'dd/MM')}
                </text>
              )}
              <rect
                x={PAD.left + i * band}
                y={PAD.top}
                width={band}
                height={plotH}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            </g>
          )
        })}
        <line x1={PAD.left} x2={width - PAD.right} y1={y(0)} y2={y(0)} stroke="#e4e4e7" />
      </svg>

      {hovered && hover !== null && (
        <div
          className="pointer-events-none absolute top-2 z-10 w-52 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 shadow-lg"
          style={{
            left: Math.min(
              Math.max(0, PAD.left + hover * band + band / 2 - 104),
              Math.max(0, width - 208)
            ),
          }}
        >
          <p className="text-xs font-semibold capitalize text-zinc-900">
            {format(parseISO(hovered.date), "EEEE d 'de' MMMM", { locale: es })}
          </p>
          <div className="mt-2 space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: INSTALL_COLOR }} />
              <span className="text-zinc-600">Instalados</span>
              <span className="ml-auto font-semibold tabular-nums text-zinc-900">{hovered.installed}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: WITHDRAW_COLOR }} />
              <span className="text-zinc-600">Retirados</span>
              <span className="ml-auto font-semibold tabular-nums text-zinc-900">{hovered.withdrawn}</span>
            </div>
            <p className="border-t border-zinc-100 pt-1.5 text-zinc-500">
              {hovered.installMovements} cargas · {hovered.withdrawalMovements} descargas
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
