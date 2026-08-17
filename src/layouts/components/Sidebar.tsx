import { NavLink, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  LayoutDashboard,
  Package,
  Building2,
  ArrowDownToLine,
  ArrowUpFromLine,
  Route,
  ClipboardList,
  Users,
  LogOut,
  ShoppingBasket,
  ClipboardCheck,
  Droplets,
  Smartphone,
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { ROUTES } from '@/shared/constants'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { ROLE_LABELS } from '@/shared/constants'
import type { UserRole } from '@/shared/types'
import { fetchPendingArrivals } from '@/features/stock/services/stock-controls.service'

// Roles allowed to see the item; defaults to the enclosing group's `roles`
// when omitted. Omit on both group and item to allow every role with panel
// access (currently everyone except delivery_driver, who has no admin panel
// access at all).
type NavItem = { to: string; icon: React.ElementType; label: string; roles?: UserRole[] }
type NavGroup = { label: string; roles?: UserRole[]; items: NavItem[] }

// Controller, loader (dispenser loader) and picker only operate the floor —
// they only need Entradas, Salidas, Pedidos and Dispensers plus the Dashboard.
// BACK_OFFICE_ROLES is a subset of OPERATIONAL_ROLES (admin/supervisor see both tiers).
const OPERATIONAL_ROLES: UserRole[] = ['admin', 'supervisor', 'controller', 'loader', 'picker']
const BACK_OFFICE_ROLES: UserRole[] = ['admin', 'supervisor']

const NAV_GROUPS: NavGroup[] = [
  {
    label: '',
    roles: OPERATIONAL_ROLES,
    items: [{ to: ROUTES.DASHBOARD, icon: LayoutDashboard, label: 'Dashboard' }],
  },
  {
    label: 'Operaciones',
    roles: OPERATIONAL_ROLES,
    items: [
      { to: ROUTES.STOCK_ENTRIES, icon: ArrowDownToLine,  label: 'Entradas' },
      { to: ROUTES.STOCK_EXITS,   icon: ArrowUpFromLine,  label: 'Salidas' },
      { to: ROUTES.DELIVERIES,    icon: Route,            label: 'Repartos', roles: BACK_OFFICE_ROLES },
      { to: ROUTES.ORDERS,        icon: ClipboardCheck,   label: 'Pedidos' },
      { to: ROUTES.DISPENSERS,    icon: Droplets,         label: 'Dispensers' },
    ],
  },
  {
    label: 'Inventario',
    roles: BACK_OFFICE_ROLES,
    items: [
      { to: ROUTES.PRODUCTS,           icon: Package,        label: 'Productos' },
      { to: ROUTES.ORDERABLE_PRODUCTS, icon: ShoppingBasket, label: 'Pedibles' },
    ],
  },
  {
    label: 'Logística',
    roles: BACK_OFFICE_ROLES,
    items: [
      { to: ROUTES.BRANCHES, icon: Building2, label: 'Sucursales' },
    ],
  },
  {
    label: 'Control',
    roles: BACK_OFFICE_ROLES,
    items: [
      { to: ROUTES.AUDITS, icon: ClipboardList, label: 'Auditoría' },
      { to: ROUTES.USERS,  icon: Users,         label: 'Usuarios' },
    ],
  },
  {
    label: 'Sistema',
    roles: ['admin'],
    items: [
      { to: ROUTES.APP_VERSION, icon: Smartphone, label: 'App móvil' },
    ],
  },
]

export function Sidebar() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const { data: pendingArrivals } = useQuery({
    queryKey: ['pending-arrivals'],
    queryFn:  () => fetchPendingArrivals(),
    staleTime: 30_000,
    refetchInterval: 30_000,
  })

  const arrivalBadge = pendingArrivals?.pending ?? 0

  // Hide items the current role isn't allowed to see (and any group left empty).
  // An item's own `roles` wins; otherwise it inherits the group's `roles`.
  const role = user?.role
  const canSee = (roles?: UserRole[]) => !roles || (!!role && roles.includes(role))
  const visibleGroups = NAV_GROUPS
    .map((group) => ({ ...group, items: group.items.filter((i) => canSee(i.roles ?? group.roles)) }))
    .filter((group) => group.items.length > 0)

  function handleLogout() {
    logout()
    navigate(ROUTES.LOGIN)
  }

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-white/[0.06] bg-zinc-950">

      {/* ── Brand ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 px-4 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/[0.06] ring-1 ring-white/10">
          <img
            src="/logoLoop.png"
            alt="LOOP"
            className="h-6 w-6 shrink-0 object-contain"
          />
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

      {/* ── Navigation ────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-2.5 pb-2">
        {visibleGroups.map((group, gi) => (
          <div key={gi} className={cn(gi > 0 && 'mt-4')}>
            {group.label && (
              <div className="px-2 pb-1.5">
                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-600">
                  {group.label}
                </span>
              </div>
            )}
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const badge = item.to === ROUTES.STOCK_ENTRIES && arrivalBadge > 0
                  ? { count: arrivalBadge, red: false }
                  : null

                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === ROUTES.DASHBOARD}
                      className={({ isActive }) =>
                        cn(
                          'group flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-sm transition-all duration-150',
                          isActive
                            ? 'bg-blue-600/15 font-semibold text-white ring-1 ring-inset ring-blue-500/20'
                            : 'text-zinc-400 hover:translate-x-0.5 hover:bg-white/[0.05] hover:text-white'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon
                            size={15}
                            strokeWidth={isActive ? 2.25 : 2}
                            className={cn(
                              'shrink-0 transition-colors',
                              isActive ? 'text-blue-400' : 'text-zinc-500 group-hover:text-zinc-300'
                            )}
                          />
                          <span className="flex-1 leading-none tracking-[-0.01em]">
                            {item.label}
                          </span>
                          {badge && (
                            <span className="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white">
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
      <div className="border-t border-white/[0.06] p-2.5">
        {user && (
          <div className="flex items-center gap-2.5 rounded-md px-1.5 py-2 transition-colors hover:bg-white/[0.04]">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-600 text-[10px] font-bold uppercase text-white ring-1 ring-white/10">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold leading-tight text-white">
                {user.name}
              </p>
              <p className="mt-0.5 text-[9px] font-medium uppercase tracking-wide text-zinc-500">
                {ROLE_LABELS[user.role as UserRole] ?? user.role}
              </p>
            </div>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="shrink-0 rounded-sm p-1.5 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <LogOut size={13} />
            </button>
          </div>
        )}
        <p className="mt-2 px-1.5 text-[9px] font-medium uppercase tracking-widest text-zinc-700">
          Producción · {new Date().getFullYear()}
        </p>
      </div>
    </aside>
  )
}
