import { useState, useEffect } from 'react'
import { Bell, ChevronRight } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { ROLE_LABELS } from '@/shared/constants'
import type { UserRole } from '@/shared/types'

const ROUTE_LABELS: Record<string, string> = {
  '/':              'Dashboard',
  '/branches':      'Sucursales',
  '/products':      'Productos',
  '/stock':         'Stock',
  '/stock/entries': 'Entradas de stock',
  '/stock/exits':   'Salidas de stock',
  '/movements':     'Movimientos',
  '/deliveries':    'Repartos',
  '/trucks':        'Unidades',
  '/audits':        'Auditoría',
  '/users':         'Usuarios',
}

function usePageTitle(): string {
  const { pathname } = useLocation()
  const exact = ROUTE_LABELS[pathname]
  if (exact) return exact
  const prefix = Object.keys(ROUTE_LABELS)
    .filter((k) => k !== '/')
    .find((k) => pathname.startsWith(k))
  return prefix ? ROUTE_LABELS[prefix] : ''
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function formatClock(date: Date): string {
  const day = DAY_NAMES[date.getDay()]
  const dd  = String(date.getDate()).padStart(2, '0')
  const mm  = String(date.getMonth() + 1).padStart(2, '0')
  const hh  = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${day} ${dd}/${mm}  ${hh}:${min}`
}

function useLiveClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])
  return now
}

export function Topbar() {
  const title = usePageTitle()
  const { user } = useAuthStore()
  const now = useLiveClock()

  return (
    <header className="flex h-10 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-5">

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-xs">
        <span className="font-mono text-[11px] font-semibold tracking-[0.08em] text-zinc-400">
          LOOP
        </span>
        {title && (
          <>
            <ChevronRight size={11} className="mx-0.5 text-zinc-300" />
            <span className="font-semibold text-zinc-700">{title}</span>
          </>
        )}
      </div>

      {/* Right: datetime · status · notifications · user */}
      <div className="flex items-center divide-x divide-zinc-100">

        {/* Live clock */}
        <div className="hidden pr-4 sm:block">
          <span className="font-mono text-[11px] tabular-nums text-zinc-400">
            {formatClock(now)}
          </span>
        </div>

        {/* System status */}
        <div className="hidden items-center gap-2 px-4 sm:flex">
          <span className="relative flex h-[7px] w-[7px]">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
            <span className="relative inline-flex h-[7px] w-[7px] rounded-full bg-emerald-500" />
          </span>
          <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-400">
            En línea
          </span>
        </div>

        {/* Notifications */}
        <div className="px-4">
          <button
            className="relative text-zinc-400 hover:text-zinc-700 transition-colors"
            title="Notificaciones"
          >
            <Bell size={15} />
            <span className="absolute -right-0.5 -top-0.5 h-[6px] w-[6px] rounded-full bg-amber-500" />
          </button>
        </div>

        {/* User */}
        {user && (
          <div className="flex items-center gap-2.5 pl-4">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[3px] bg-zinc-900 text-[9px] font-bold uppercase text-white">
              {user.name.charAt(0)}
            </div>
            <div className="hidden leading-tight sm:block">
              <p className="text-[11px] font-semibold text-zinc-800">{user.name}</p>
              <p className="text-[9px] font-medium uppercase tracking-[0.08em] text-zinc-400">
                {ROLE_LABELS[user.role as UserRole] ?? user.role}
              </p>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
