import { NavLink, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  LayoutDashboard,
  Package,
  Building2,
  ArrowDownToLine,
  ArrowUpFromLine,
  Truck,
  Route,
  GitCompareArrows,
  ClipboardList,
  Users,
  LogOut,
  Boxes,
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { ROUTES } from '@/shared/constants'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { ROLE_LABELS } from '@/shared/constants'
import type { UserRole } from '@/shared/types'
import { fetchDashboardMetrics } from '@/features/dashboard/services/dashboard.service'

type NavItem = { to: string; icon: React.ElementType; label: string }
type NavGroup = { label: string; items: NavItem[] }

const NAV_GROUPS: NavGroup[] = [
  {
    label: '',
    items: [{ to: ROUTES.DASHBOARD, icon: LayoutDashboard, label: 'Dashboard' }],
  },
  {
    label: 'Operaciones',
    items: [
      { to: ROUTES.STOCK_ENTRIES, icon: ArrowDownToLine,  label: 'Entradas' },
      { to: ROUTES.STOCK_EXITS,   icon: ArrowUpFromLine,  label: 'Salidas' },
      { to: ROUTES.DELIVERIES,    icon: Route,            label: 'Repartos' },
      { to: ROUTES.MOVEMENTS,     icon: GitCompareArrows, label: 'Movimientos' },
    ],
  },
  {
    label: 'Inventario',
    items: [
      { to: ROUTES.STOCK,    icon: Boxes,   label: 'Stock' },
      { to: ROUTES.PRODUCTS, icon: Package, label: 'Productos' },
    ],
  },
  {
    label: 'Logística',
    items: [
      { to: ROUTES.TRUCKS,   icon: Truck,     label: 'Unidades' },
      { to: ROUTES.BRANCHES, icon: Building2, label: 'Sucursales' },
    ],
  },
  {
    label: 'Control',
    items: [
      { to: ROUTES.AUDITS, icon: ClipboardList, label: 'Auditoría' },
      { to: ROUTES.USERS,  icon: Users,         label: 'Usuarios' },
    ],
  },
]

export function Sidebar() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  // Reads from TanStack Query cache — deduped with DashboardPage
  const { data: metrics } = useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: fetchDashboardMetrics,
    staleTime: 60_000,
    refetchInterval: 60_000,
  })

  const delayedCount = metrics?.delayedMovements ?? 0
  const pendingCount = metrics?.pendingMovements ?? 0
  const movBadge     = delayedCount + pendingCount
  const movBadgeRed  = delayedCount > 0

  function handleLogout() {
    logout()
    navigate(ROUTES.LOGIN)
  }

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-zinc-200 bg-white">

      {/* ── Brand ─────────────────────────────────────────────── */}
      {/* Top accent line gives LOOP a distinctive identity marker */}
      <div className="border-t-[3px] border-t-zinc-500 bg-zinc-950 px-4 pb-4 pt-3.5">
        <div className="flex items-center gap-3">
          {/* Monogram — subtle inset highlight on dark */}
          <div className={[
            'flex h-8 w-8 shrink-0 items-center justify-center',
            'rounded-[3px] border border-zinc-700 bg-zinc-900',
            'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]',
          ].join(' ')}>
            <span className="font-mono text-[15px] font-black tracking-tight text-white">L</span>
          </div>

          <div className="min-w-0 leading-none">
            <div className="flex items-baseline gap-2">
              <p className="text-[13px] font-black tracking-tight text-white">LOOP</p>
              <span className="font-mono text-[9px] text-zinc-600">v0.1</span>
            </div>
            <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.12em] text-zinc-500">
              Mercadería · Stock · Repartos
            </p>
          </div>
        </div>
      </div>

      {/* ── Navigation ────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto pb-2 pt-1.5">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} className={cn(gi > 0 && 'mt-1')}>
            {group.label && (
              <div className={cn('flex items-center gap-2 px-4 pb-1', gi > 0 && 'pt-3')}>
                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-400">
                  {group.label}
                </span>
                <span className="flex-1 border-t border-zinc-100" />
              </div>
            )}
            <ul>
              {group.items.map((item) => {
                const badge = item.to === ROUTES.MOVEMENTS && movBadge > 0
                  ? { count: movBadge, red: movBadgeRed }
                  : null

                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === ROUTES.DASHBOARD}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2.5 py-[7px] pr-3 text-sm transition-colors',
                          'border-l-[3px]',
                          isActive
                            ? 'border-l-zinc-900 bg-zinc-50 pl-[10px] font-semibold text-zinc-950'
                            : 'border-l-transparent pl-[10px] text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon
                            size={14}
                            className={cn(
                              'shrink-0 transition-colors',
                              isActive ? 'text-zinc-900' : 'text-zinc-400'
                            )}
                          />
                          <span className="flex-1 leading-none tracking-[-0.01em]">
                            {item.label}
                          </span>
                          {badge && (
                            <span className={cn(
                              'mr-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-[3px] px-1 text-[9px] font-bold text-white',
                              badge.red ? 'bg-red-500' : 'bg-amber-500'
                            )}>
                              {badge.count > 9 ? '9+' : badge.count}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── User footer ───────────────────────────────────────── */}
      <div className="border-t border-zinc-100">
        {user && (
          <div className="flex items-center gap-2.5 px-3 py-2.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[3px] bg-zinc-900 text-[10px] font-bold uppercase text-white">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold leading-tight text-zinc-800">
                {user.name}
              </p>
              <p className="mt-0.5 text-[9px] font-medium uppercase tracking-wide text-zinc-400">
                {ROLE_LABELS[user.role as UserRole] ?? user.role}
              </p>
            </div>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="shrink-0 rounded p-1 text-zinc-400 transition-colors hover:text-zinc-700"
            >
              <LogOut size={13} />
            </button>
          </div>
        )}
        <div className="border-t border-zinc-100 px-3 py-1.5">
          <p className="text-[9px] font-medium uppercase tracking-widest text-zinc-300">
            Producción · {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </aside>
  )
}
