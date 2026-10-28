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
  '/orders':        'Pedidos',
  '/dispensers':    'Dispensers',
  '/orderable-products': 'Pedibles',
  '/app-version':   'App móvil',
  '/statistics/dispensers': 'Estadísticas · Dispensers',
  '/statistics/performance': 'Estadísticas · Desempeño',
  '/statistics':    'Estadísticas',
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
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-zinc-400">LOOP</span>
        <ChevronRight size={14} className="text-zinc-300" />
        <span className="font-medium text-zinc-900">{title || 'Inicio'}</span>
      </div>

      {/* Right: datetime · status · notifications · user */}
      <div className="flex items-center gap-2">

        <div className="hidden items-center gap-2.5 rounded-full border border-zinc-200 px-3 py-1.5 sm:flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs font-medium text-zinc-600">En línea</span>
          <span className="h-3 w-px bg-zinc-200" />
          <span className="text-xs tabular-nums text-zinc-500">{formatClock(now)}</span>
        </div>

        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800"
          title="Notificaciones"
        >
          <Bell size={17} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white" />
        </button>

        {user && (
          <div className="ml-1 flex items-center gap-2.5 border-l border-zinc-200 pl-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold uppercase text-white">
              {user.name.charAt(0)}
            </div>
            <div className="hidden leading-tight sm:block">
              <p className="text-[13px] font-semibold text-zinc-900">{user.name}</p>
              <p className="text-[11px] text-zinc-500">
                {ROLE_LABELS[user.role as UserRole] ?? user.role}
              </p>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
