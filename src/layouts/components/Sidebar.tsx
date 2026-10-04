import { useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
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
  ChevronRight,
  Truck,
  Boxes,
  MapPinned,
  ShieldCheck,
  Settings,
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { ROUTES } from '@/shared/constants'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { ROLE_LABELS } from '@/shared/constants'
import type { UserRole } from '@/shared/types'
import { useLocalStorage } from '@/shared/hooks/useLocalStorage'
import { fetchPendingArrivals } from '@/features/stock/services/stock-controls.service'

// Roles allowed to see the item; defaults to the enclosing group's `roles`
// when omitted. Omit on both group and item to allow every role with panel
// access (currently everyone except delivery_driver, who has no admin panel
// access at all).
type NavItem = { to: string; icon: React.ElementType; label: string; roles?: UserRole[] }
type NavGroup = { label: string; icon?: React.ElementType; roles?: UserRole[]; items: NavItem[] }

// Controller, loader (dispenser loader) and picker only operate the floor —
// they only need Entradas, Salidas, Pedidos and Dispensers plus the Dashboard.
// BACK_OFFICE_ROLES is a subset of OPERATIONAL_ROLES (admin/supervisor see both tiers).
const OPERATIONAL_ROLES: UserRole[] = ['admin', 'supervisor', 'controller', 'loader', 'picker']
const BACK_OFFICE_ROLES: UserRole[] = ['admin', 'supervisor']

// Groups with an empty label render their items flat (no collapsible header).
const NAV_GROUPS: NavGroup[] = [
  {
    label: '',
    roles: OPERATIONAL_ROLES,
    items: [{ to: ROUTES.DASHBOARD, icon: LayoutDashboard, label: 'Dashboard' }],
  },
  {
    label: 'Operaciones',
    icon: Truck,
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
    icon: Boxes,
    roles: BACK_OFFICE_ROLES,
    items: [
      { to: ROUTES.PRODUCTS,           icon: Package,        label: 'Productos' },
      { to: ROUTES.ORDERABLE_PRODUCTS, icon: ShoppingBasket, label: 'Pedibles' },
    ],
  },
  {
    label: 'Logística',
    icon: MapPinned,
    roles: BACK_OFFICE_ROLES,
    items: [
      { to: ROUTES.BRANCHES, icon: Building2, label: 'Sucursales' },
    ],
  },
  {
    label: 'Control',
    icon: ShieldCheck,
    roles: BACK_OFFICE_ROLES,
    items: [
      { to: ROUTES.AUDITS, icon: ClipboardList, label: 'Auditoría' },
      { to: ROUTES.USERS,  icon: Users,         label: 'Usuarios' },
    ],
  },
  {
    label: 'Sistema',
    icon: Settings,
    roles: ['admin'],
    items: [
      { to: ROUTES.APP_VERSION, icon: Smartphone, label: 'App móvil' },
    ],
  },
]

function matchesPath(pathname: string, to: string) {
  return to === ROUTES.DASHBOARD ? pathname === to : pathname === to || pathname.startsWith(`${to}/`)
}

function CountBadge({ count, title }: { count: number; title?: string }) {
  return (
    <span
      title={title}
      className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-amber-100 px-1.5 text-[11px] font-semibold text-amber-700"
    >
      {count > 9 ? '9+' : count}
    </span>
  )
}

export function Sidebar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user, logout } = useAuthStore()
  const [openGroups, setOpenGroups] = useLocalStorage<string[]>('loop_sidebar_open', [])

  const { data: pendingArrivals } = useQuery({
    queryKey: ['pending-arrivals'],
    queryFn:  () => fetchPendingArrivals(),
    staleTime: 30_000,
    refetchInterval: 30_000,
  })

  const arrivalBadge = pendingArrivals?.pending ?? 0
  const badgeFor = (to: string) => (to === ROUTES.STOCK_ENTRIES && arrivalBadge > 0 ? arrivalBadge : 0)
  const arrivalTitle = `${arrivalBadge} reparto${arrivalBadge !== 1 ? 's' : ''} pendiente${arrivalBadge !== 1 ? 's' : ''} de llegar`

  // Hide items the current role isn't allowed to see (and any group left empty).
  // An item's own `roles` wins; otherwise it inherits the group's `roles`.
  const role = user?.role
  const canSee = (roles?: UserRole[]) => !roles || (!!role && roles.includes(role))
  const visibleGroups = NAV_GROUPS
    .map((group) => ({ ...group, items: group.items.filter((i) => canSee(i.roles ?? group.roles)) }))
    .filter((group) => group.items.length > 0)

  const activeGroup = visibleGroups.find(
    (g) => g.label && g.items.some((i) => matchesPath(pathname, i.to))
  )?.label

  // Navigating into a section (e.g. from a dashboard link) expands it.
  useEffect(() => {
    if (activeGroup && !openGroups.includes(activeGroup)) {
      setOpenGroups([...openGroups, activeGroup])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGroup])

  function toggleGroup(label: string) {
    setOpenGroups(
      openGroups.includes(label) ? openGroups.filter((l) => l !== label) : [...openGroups, label]
    )
  }

  function handleLogout() {
    logout()
    navigate(ROUTES.LOGIN)
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-zinc-200 bg-white">

      {/* ── Brand ─────────────────────────────────────────────── */}
      <div className="flex h-16 items-center gap-3 px-5">
        <img src="/logoLoop.png" alt="LOOP" className="h-9 w-9 shrink-0 object-contain" />
        <div className="min-w-0 leading-none">
          <p className="text-[15px] font-bold tracking-tight text-zinc-900">LOOP</p>
          <p className="mt-1 truncate text-[11px] text-zinc-400">Mercadería · Stock · Repartos</p>
        </div>
      </div>

      {/* ── Navigation ────────────────────────────────────────── */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-3 pt-1">
        {visibleGroups.map((group) => {
          if (!group.label) {
            return group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === ROUTES.DASHBOARD}
                className={({ isActive }) =>
                  cn(
                    'group flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                    isActive ? 'bg-blue-50 text-blue-700' : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      size={18}
                      className={cn('shrink-0', isActive ? 'text-blue-600' : 'text-zinc-400 group-hover:text-zinc-600')}
                    />
                    <span className="flex-1 truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))
          }

          const isOpen = openGroups.includes(group.label)
          const isActive = activeGroup === group.label
          const groupBadge = group.items.reduce((sum, i) => sum + badgeFor(i.to), 0)
          const GroupIcon = group.icon ?? ChevronRight

          return (
            <div key={group.label}>
              <button
                type="button"
                onClick={() => toggleGroup(group.label)}
                aria-expanded={isOpen}
                className={cn(
                  'group flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                  isActive ? 'text-zinc-900' : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
                )}
              >
                <GroupIcon
                  size={18}
                  className={cn('shrink-0', isActive ? 'text-blue-600' : 'text-zinc-400 group-hover:text-zinc-600')}
                />
                <span className="flex-1 truncate text-left">{group.label}</span>
                {!isOpen && groupBadge > 0 && <CountBadge count={groupBadge} title={arrivalTitle} />}
                <ChevronRight
                  size={15}
                  className={cn('shrink-0 text-zinc-400 transition-transform duration-200', isOpen && 'rotate-90')}
                />
              </button>

              <div
                className={cn(
                  'grid transition-[grid-template-rows] duration-200 ease-out',
                  isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                )}
              >
                <ul className="ml-[21px] flex flex-col gap-0.5 overflow-hidden border-l border-zinc-200 pl-3">
                  {group.items.map((item, idx) => {
                    const badge = badgeFor(item.to)
                    return (
                      <li key={item.to} className={cn(idx === 0 && 'mt-1', idx === group.items.length - 1 && 'mb-1')}>
                        <NavLink
                          to={item.to}
                          tabIndex={isOpen ? undefined : -1}
                          className={({ isActive: itemActive }) =>
                            cn(
                              'relative flex h-8 items-center gap-2 rounded-md px-2.5 text-[13px] transition-colors',
                              itemActive
                                ? 'bg-blue-50 font-medium text-blue-700 before:absolute before:-left-[13px] before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-full before:bg-blue-600'
                                : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
                            )
                          }
                        >
                          <span className="flex-1 truncate">{item.label}</span>
                          {badge > 0 && <CountBadge count={badge} title={arrivalTitle} />}
                        </NavLink>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          )
        })}
      </nav>

      {/* ── User footer ───────────────────────────────────────── */}
      {user && (
        <div className="border-t border-zinc-200 p-3">
          <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50/70 p-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold uppercase text-white">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[13px] font-semibold text-zinc-900">{user.name}</p>
              <p className="mt-0.5 truncate text-[11px] text-zinc-500">
                {ROLE_LABELS[user.role as UserRole] ?? user.role}
              </p>
            </div>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="shrink-0 rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white hover:text-red-600"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
