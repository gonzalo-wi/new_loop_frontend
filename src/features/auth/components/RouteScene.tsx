import { useEffect, useRef, useState } from 'react'
import { cn } from '@/shared/lib/utils'

// Isometric delivery loop rendered with CSS 3D transforms: a truck circulates
// between the three plants, stopping at each one. Purely decorative — no real data.

const SIZE = 560
const BASE_RX = 56
const BASE_RZ = -36
const CRUISE_SPEED = 0.07 // px per ms
const DEPART_SPEED = 0.45
const STOP_MS = 1100

const ROUTE =
  'M 110 270 L 110 160 Q 110 120 150 120 L 410 120 Q 450 120 450 160 L 450 380 Q 450 420 410 420 L 150 420 Q 110 420 110 380 Z'

const STOPS = [
  { name: 'Ciudadela', x: 110, y: 270 },
  { name: 'La Plata',  x: 450, y: 270 },
  { name: 'Lomas',     x: 280, y: 420 },
]

// Plant warehouses sit beside their stop; index matches STOPS.
const BUILDINGS = [
  { x: 28,  y: 232, w: 58, d: 76, h: 30 },
  { x: 474, y: 232, w: 58, d: 76, h: 30 },
  { x: 242, y: 442, w: 76, d: 56, h: 30 },
]

const CITY_BLOCKS = [
  { x: 150, y: 160, w: 40, d: 36, h: 16 },
  { x: 200, y: 168, w: 26, d: 28, h: 30 },
  { x: 318, y: 160, w: 44, d: 30, h: 12 },
  { x: 372, y: 166, w: 36, d: 40, h: 24 },
  { x: 150, y: 302, w: 30, d: 44, h: 26 },
  { x: 190, y: 318, w: 44, d: 36, h: 12 },
  { x: 320, y: 300, w: 34, d: 34, h: 34 },
  { x: 366, y: 312, w: 44, d: 44, h: 14 },
  { x: 480, y: 120, w: 40, d: 40, h: 18 },
  { x: 40,  y: 440, w: 44, d: 40, h: 14 },
  { x: 476, y: 440, w: 40, d: 44, h: 26 },
  { x: 36,  y: 92,  w: 36, d: 48, h: 20 },
  { x: 252, y: 52,  w: 56, d: 44, h: 22 },
]

type BoxProps = {
  x: number
  y: number
  z?: number
  w: number
  d: number
  h: number
  top: string
  side: string
  shade: string
}

function Box({ x, y, z = 0, w, d, h, top, side, shade }: BoxProps) {
  const face = 'absolute left-0 top-0'
  return (
    <div
      className="absolute [transform-style:preserve-3d]"
      style={{ left: x, top: y, width: w, height: d, transform: `translateZ(${z}px)` }}
    >
      <div className={face} style={{ width: w, height: h, background: shade, transformOrigin: 'top', transform: 'rotateX(90deg)' }} />
      <div className={face} style={{ width: w, height: h, background: side, transformOrigin: 'top', transform: `translateY(${d}px) rotateX(90deg)` }} />
      <div className={face} style={{ width: h, height: d, background: shade, transformOrigin: 'left', transform: 'rotateY(-90deg)' }} />
      <div className={face} style={{ width: h, height: d, background: side, transformOrigin: 'left', transform: `translateX(${w}px) rotateY(-90deg)` }} />
      <div className={cn(face, 'transition-colors duration-500')} style={{ width: w, height: d, background: top, transform: `translateZ(${h}px)` }} />
    </div>
  )
}

function nearestLength(path: SVGPathElement, total: number, x: number, y: number) {
  let best = 0
  let bestDist = Infinity
  for (let l = 0; l <= total; l += 2) {
    const p = path.getPointAtLength(l)
    const dist = (p.x - x) ** 2 + (p.y - y) ** 2
    if (dist < bestDist) {
      bestDist = dist
      best = l
    }
  }
  return best
}

type Props = {
  departing: boolean
}

export function RouteScene({ departing }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const planeRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const truckRef = useRef<HTMLDivElement>(null)
  const departingRef = useRef(departing)
  departingRef.current = departing

  const [visited, setVisited] = useState<number[]>([0])
  const [status, setStatus] = useState<{ stop: number; mode: 'working' | 'driving' }>({
    stop: 0,
    mode: 'working',
  })

  useEffect(() => {
    const container = containerRef.current
    const plane = planeRef.current
    const path = pathRef.current
    const truck = truckRef.current
    if (!container || !plane || !path || !truck) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const total = path.getTotalLength()
    const stopAt = STOPS.map((s) => nearestLength(path, total, s.x, s.y))

    let dist = stopAt[0]
    let stopIndex = 1
    let nextStopDist = stopAt[1]
    let pauseUntil = performance.now() + STOP_MS
    let last = performance.now()
    let rx = BASE_RX
    let rz = BASE_RZ
    let targetRx = BASE_RX
    let targetRz = BASE_RZ
    let raf = 0
    let scale = 1
    const timers: number[] = []

    function fit() {
      const { width, height } = container!.getBoundingClientRect()
      scale = Math.max(0.6, Math.min(1.35, width / 760, height / 720))
    }

    function placeTruck() {
      const p = path!.getPointAtLength(dist % total)
      const q = path!.getPointAtLength((dist + 1) % total)
      const angle = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI
      truck!.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) rotateZ(${angle}deg)`
    }

    function applyPlane() {
      plane!.style.setProperty('--rx', String(rx))
      plane!.style.setProperty('--rz', String(rz))
      plane!.style.transform = `translate(-50%, -50%) scale(${scale}) rotateX(${rx}deg) rotateZ(${rz}deg)`
    }

    function frame(now: number) {
      const dt = Math.min(64, now - last)
      last = now
      const leaving = departingRef.current

      if (leaving || now >= pauseUntil) {
        dist += dt * (leaving ? DEPART_SPEED : CRUISE_SPEED)
        if (!leaving && dist >= nextStopDist) {
          dist = nextStopDist
          pauseUntil = now + STOP_MS
          const arrived = stopIndex
          setVisited((prev) => (arrived === 0 ? [0] : [...prev, arrived]))
          setStatus({ stop: arrived, mode: 'working' })
          const following = (stopIndex + 1) % STOPS.length
          nextStopDist += following === 0 ? total - stopAt[stopIndex] + stopAt[0] : stopAt[following] - stopAt[stopIndex]
          stopIndex = following
          timers.push(window.setTimeout(() => {
            if (!departingRef.current) setStatus({ stop: following, mode: 'driving' })
          }, STOP_MS))
        }
      }
      placeTruck()

      rx += (targetRx - rx) * 0.06
      rz += (targetRz - rz) * 0.06
      applyPlane()

      raf = requestAnimationFrame(frame)
    }

    function onMouseMove(e: MouseEvent) {
      const rect = container!.getBoundingClientRect()
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1
      targetRx = BASE_RX - ny * 8
      targetRz = BASE_RZ + nx * 14
    }

    const resizeObserver = new ResizeObserver(() => {
      fit()
      applyPlane()
    })
    resizeObserver.observe(container)
    fit()
    placeTruck()
    applyPlane()
    if (reduceMotion) return () => resizeObserver.disconnect()

    timers.push(window.setTimeout(() => setStatus({ stop: 1, mode: 'driving' }), STOP_MS))
    raf = requestAnimationFrame(frame)
    window.addEventListener('mousemove', onMouseMove)
    return () => {
      cancelAnimationFrame(raf)
      timers.forEach(clearTimeout)
      resizeObserver.disconnect()
      window.removeEventListener('mousemove', onMouseMove)
    }
  }, [])

  // Plant where the truck is parked right now: blue; already visited this lap: green.
  const tone = (i: number) =>
    !departing && status.mode === 'working' && status.stop === i
      ? 'active'
      : visited.includes(i)
        ? 'done'
        : 'pending'

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden [perspective:1400px]">
      <div
        className={cn(
          'absolute inset-0 transition-all duration-700 ease-in',
          departing && 'scale-110 opacity-0'
        )}
      >
        <div
          ref={planeRef}
          className="absolute left-1/2 top-[54%] [transform-style:preserve-3d]"
          style={{ width: SIZE, height: SIZE }}
        >
          {/* Ground */}
          <div
            className="absolute inset-0 rounded-3xl border border-zinc-800 bg-zinc-900"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />

          {/* Streets + route */}
          <svg className="absolute inset-0" width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            <path d="M 110 270 L 450 270 M 280 120 L 280 420" stroke="#27272a" strokeWidth={14} fill="none" />
            <path d={ROUTE} stroke="#3f3f46" strokeWidth={24} fill="none" strokeLinejoin="round" />
            <path
              ref={pathRef}
              d={ROUTE}
              stroke="#3b82f6"
              strokeWidth={2.5}
              fill="none"
              strokeDasharray="10 10"
              className="animate-route-dash motion-reduce:animate-none"
            />
            {STOPS.map((s, i) => (
              <circle
                key={s.name}
                cx={s.x}
                cy={s.y}
                r={12}
                fill="#18181b"
                stroke={{ active: '#3b82f6', done: '#10b981', pending: '#71717a' }[tone(i)]}
                strokeWidth={3}
                className="transition-colors duration-500"
              />
            ))}
          </svg>

          {CITY_BLOCKS.map((b, i) => (
            <Box key={i} {...b} top="#3f3f46" side="#27272a" shade="#1f1f23" />
          ))}

          {BUILDINGS.map((b, i) => (
            <Box
              key={STOPS[i].name}
              {...b}
              top={{ active: '#2563eb', done: '#10b981', pending: '#d4d4d8' }[tone(i)]}
              side="#71717a"
              shade="#52525b"
            />
          ))}

          {/* Billboard labels — counter-rotated to always face the viewer */}
          {STOPS.map((s, i) => {
            const b = BUILDINGS[i]
            return (
              <div
                key={s.name}
                className="absolute [transform-style:preserve-3d]"
                style={{
                  left: b.x + b.w / 2,
                  top: b.y + b.d / 2,
                  transform: `translateZ(${b.h + 14}px) rotateZ(calc(var(--rz) * -1deg)) rotateX(calc(var(--rx) * -1deg))`,
                }}
              >
                <span
                  className={cn(
                    'block -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors duration-500',
                    {
                      active:  'border-blue-500/40 bg-blue-600 text-white',
                      done:    'border-emerald-500/40 bg-emerald-500 text-white',
                      pending: 'border-zinc-700 bg-zinc-800 text-zinc-300',
                    }[tone(i)]
                  )}
                >
                  {s.name}
                </span>
              </div>
            )
          })}

          {/* Truck: cab faces +x so rotateZ follows the path tangent */}
          <div ref={truckRef} className="absolute left-0 top-0 [transform-style:preserve-3d]">
            <div className="absolute -left-6 -top-[9px] h-[18px] w-12 rounded-md bg-black/50 blur-[3px]" />
            <Box x={-22} y={-7} z={2} w={30} d={14} h={14} top="#fafafa" side="#d4d4d8" shade="#a1a1aa" />
            <Box x={9} y={-6.5} z={2} w={11} d={13} h={11} top="#3b82f6" side="#2563eb" shade="#1d4ed8" />
          </div>
        </div>
      </div>
    </div>
  )
}
