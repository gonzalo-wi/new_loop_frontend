import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Route,
  ClipboardList,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ClipboardCheck,
  Loader2,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/shared/components/ui'
import { ROUTES } from '@/shared/constants'
import { cn } from '@/shared/lib/utils'
import { fetchPendingArrivals } from '@/features/stock/services/stock-controls.service'
import { fetchStockControls } from '@/features/stock/services/stock-controls.service'
import { fetchDeliveries } from '@/features/deliveries/services/deliveries.service'
import { fetchBranches } from '@/features/branches/services/branches.service'
import { fetchOrders } from '@/features/orders/services/orders.service'

const today = new Date().toISOString().split('T')[0]

// ── Quick action link ─────────────────────────────────────────────────────────

function QuickAction({
  to,
  icon: Icon,
  label,
  variant = 'secondary',
}: {
  to: string
  icon: React.ElementType
  label: string
  variant?: 'primary' | 'secondary'
}) {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-1.5 rounded-[3px] border px-3 py-[7px] text-xs font-semibold transition-colors',
        variant === 'primary'
          ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
          : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900'
      )}
    >
      <Icon size={11} strokeWidth={2.5} />
      {label}
    </Link>
  )
}

// ── Metric cell ───────────────────────────────────────────────────────────────

function MetricCell({
  label,
  value,
  note,
  status = 'neutral',
  loading = false,
}: {
  label: string
  value: string | number
  note?: string
  status?: 'critical' | 'warning' | 'success' | 'info' | 'neutral'
  loading?: boolean
}) {
  const valueColor = {
    critical: 'text-red-600',
    warning:  'text-amber-600',
    success:  'text-emerald-600',
    info:     'text-blue-600',
    neutral:  'text-zinc-950',
  }[status]

  const bg = status === 'critical' ? 'bg-red-50/60' : status === 'warning' ? 'bg-amber-50/40' : ''

  return (
    <div className={cn('flex min-w-0 flex-col gap-1 px-6 py-5 transition-colors', bg)}>
      <dt className="text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-400">{label}</dt>
      <dd className={cn('text-3xl font-bold tabular-nums leading-none', valueColor)}>
        {loading ? <Loader2 size={18} className="animate-spin text-zinc-300" /> : value}
      </dd>
      {note && <span className="text-[10px] text-zinc-400">{note}</span>}
    </div>
  )
}

// ── Dashboard page ────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { data: pendingArrivals, isLoading: loadingArrivals } = useQuery({
    queryKey: ['pending-arrivals'],
    queryFn:  () => fetchPendingArrivals(),
    refetchInterval: 30_000,
  })

  const { data: deliveries = [], isLoading: loadingDeliveries } = useQuery({
    queryKey: ['deliveries'],
    queryFn:  fetchDeliveries,
    staleTime: 60_000,
  })

  const { data: branches = [], isLoading: loadingBranches } = useQuery({
    queryKey: ['branches'],
    queryFn:  fetchBranches,
    staleTime: 60_000,
  })

  const { data: todayEntries, isLoading: loadingEntries } = useQuery({
    queryKey: ['stock-controls', 'ENTRY', 'today', today],
    queryFn:  () => fetchStockControls({ type: 'ENTRY', from: today, to: today, page: 0, size: 1 }),
    refetchInterval: 30_000,
  })

  const { data: todayExits, isLoading: loadingExits } = useQuery({
    queryKey: ['stock-controls', 'EXIT', 'today', today],
    queryFn:  () => fetchStockControls({ type: 'EXIT', from: today, to: today, page: 0, size: 1 }),
    refetchInterval: 30_000,
  })

  const { data: pendingOrders, isLoading: loadingPending } = useQuery({
    queryKey: ['orders', { status: 'PENDING' }],
    queryFn:  () => fetchOrders({ status: 'PENDING', page: 0, size: 1 }),
    refetchInterval: 60_000,
  })

  const { data: inProgressOrders, isLoading: loadingInProgress } = useQuery({
    queryKey: ['orders', { status: 'IN_PROGRESS' }],
    queryFn:  () => fetchOrders({ status: 'IN_PROGRESS', page: 0, size: 1 }),
    refetchInterval: 30_000,
  })

  const { data: completedToday, isLoading: loadingCompleted } = useQuery({
    queryKey: ['orders', { status: 'COMPLETED', from: today }],
    queryFn:  () => fetchOrders({ status: 'COMPLETED', from: today, to: today, page: 0, size: 1 }),
    refetchInterval: 60_000,
  })

  // Pending arrivals grouped by branch
  const pendingByBranch = useMemo(() => {
    if (!pendingArrivals) return []
    const map = new Map<string, { branchId: string; branchName: string; count: number }>()
    for (const r of pendingArrivals.pendingRoutes) {
      const existing = map.get(r.branchId)
      if (existing) existing.count++
      else map.set(r.branchId, { branchId: r.branchId, branchName: r.branchName, count: 1 })
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count)
  }, [pendingArrivals])

  // Derived values
  const activeDeliveries  = deliveries.filter((d) => d.status === 'active').length
  const activeBranches    = branches.filter((b) => b.status === 'active').length
  const pendingArrCount   = pendingArrivals?.pending ?? 0
  const totalExpected     = pendingArrivals?.totalExpected ?? 0
  const pendingOrderCount = pendingOrders?.totalElements ?? 0
  const inProgressCount   = inProgressOrders?.totalElements ?? 0
  const completedCount    = completedToday?.totalElements ?? 0
  const entriesCount      = todayEntries?.page.totalElements ?? 0
  const exitsCount        = todayExits?.page.totalElements ?? 0

  const hasPendingArrivals = pendingArrCount > 0

  return (
    <div className="flex min-h-0 flex-col bg-zinc-50">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <PageHeader
        title="Dashboard operativo"
        description="Estado actual del sistema de control de mercadería."
      />

      {/* ── Pending arrivals banner ─────────────────────────────────────── */}
      {!loadingArrivals && hasPendingArrivals && (
        <div className="flex items-center gap-4 border-b border-amber-200 bg-amber-50 px-6 py-2">
          <Clock size={12} className="shrink-0 text-amber-600" />
          <span className="text-xs text-amber-800">
            <strong>{pendingArrCount}</strong> reparto{pendingArrCount !== 1 ? 's' : ''} pendiente{pendingArrCount !== 1 ? 's' : ''} de llegar hoy
          </span>
          <Link
            to={ROUTES.STOCK_ENTRIES}
            className="ml-auto flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 hover:text-amber-900"
          >
            Ver entradas <ArrowRight size={10} />
          </Link>
        </div>
      )}

      {/* ── Quick actions ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-zinc-200 bg-white px-5 py-3">
        <span className="mr-2 text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-300">
          Acciones
        </span>
        <QuickAction to={ROUTES.STOCK_ENTRIES} icon={ArrowDownToLine} label="Nueva entrada"     variant="primary" />
        <QuickAction to={ROUTES.STOCK_EXITS}   icon={ArrowUpFromLine} label="Registrar salida" />
        <QuickAction to={ROUTES.DELIVERIES}    icon={Route}           label="Repartos" />
        <QuickAction to={ROUTES.ORDERS}        icon={ClipboardCheck}  label="Pedidos" />
        <QuickAction to={ROUTES.AUDITS}        icon={ClipboardList}   label="Auditoría" />
      </div>

      {/* ── Metrics strip ──────────────────────────────────────────────── */}
      <div className="border-b border-zinc-200 bg-white">
        <dl className="flex divide-x divide-zinc-100">
          <MetricCell
            label="Faltan llegar hoy"
            value={loadingArrivals ? '—' : `${pendingArrCount} / ${totalExpected}`}
            status={pendingArrCount > 0 ? 'warning' : 'success'}
            note={pendingArrCount === 0 ? 'todos llegaron' : `${pendingArrivals?.arrived ?? 0} ya volvieron`}
            loading={loadingArrivals}
          />
          <MetricCell
            label="Repartos activos"
            value={loadingDeliveries ? '—' : activeDeliveries}
            loading={loadingDeliveries}
          />
          <MetricCell
            label="Pedidos en proceso"
            value={loadingInProgress ? '—' : inProgressCount}
            status={inProgressCount > 0 ? 'info' : 'neutral'}
            loading={loadingInProgress}
          />
          <MetricCell
            label="Sucursales activas"
            value={loadingBranches ? '—' : activeBranches}
            loading={loadingBranches}
          />
          <div className="flex-1" />
        </dl>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 divide-x divide-zinc-200">

        {/* Left: controles de hoy + faltan llegar */}
        <div className="flex min-w-0 flex-1 flex-col">

          {/* Controles de hoy */}
          <div className="border-b border-zinc-200 bg-white">
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-2.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                Controles de hoy
              </span>
              <span className="font-mono text-[10px] text-zinc-400">{today}</span>
            </div>
            <div className="flex divide-x divide-zinc-100">
              <Link
                to={ROUTES.STOCK_ENTRIES}
                className="flex flex-1 flex-col gap-1 px-6 py-5 transition-colors hover:bg-zinc-50"
              >
                <dt className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-400">
                  <ArrowDownToLine size={10} className="text-emerald-500" />
                  Entradas registradas
                </dt>
                <dd className="text-3xl font-bold tabular-nums leading-none text-zinc-950">
                  {loadingEntries ? <Loader2 size={18} className="animate-spin text-zinc-300" /> : entriesCount}
                </dd>
              </Link>
              <Link
                to={ROUTES.STOCK_EXITS}
                className="flex flex-1 flex-col gap-1 px-6 py-5 transition-colors hover:bg-zinc-50"
              >
                <dt className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-400">
                  <ArrowUpFromLine size={10} className="text-red-400" />
                  Salidas registradas
                </dt>
                <dd className="text-3xl font-bold tabular-nums leading-none text-zinc-950">
                  {loadingExits ? <Loader2 size={18} className="animate-spin text-zinc-300" /> : exitsCount}
                </dd>
              </Link>
            </div>
          </div>

          {/* Repartos que faltan llegar */}
          <div className="flex-1 bg-white">
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                  Repartos pendientes de llegar
                </span>
                {pendingArrCount > 0 && (
                  <span className="flex h-4 min-w-[1rem] items-center justify-center rounded-[3px] bg-amber-500 px-1 text-[9px] font-bold text-white">
                    {pendingArrCount}
                  </span>
                )}
              </div>
              <Link
                to={ROUTES.STOCK_ENTRIES}
                className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 hover:text-zinc-700"
              >
                Registrar entrada <ArrowRight size={10} />
              </Link>
            </div>

            {loadingArrivals ? (
              <div className="flex items-center justify-center py-12 text-xs text-zinc-400">
                Cargando...
              </div>
            ) : pendingArrCount === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-[3px] border border-emerald-200 bg-emerald-50">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                </div>
                <p className="text-xs font-medium text-zinc-500">Todos los repartos llegaron</p>
                <p className="text-[10px] text-zinc-400">
                  {totalExpected > 0 ? `${totalExpected} de ${totalExpected} completados` : 'Sin repartos esperados hoy'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50">
                    <th className="px-5 py-2 text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-400">Sucursal</th>
                    <th className="px-4 py-2 text-right text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-400 w-24">Pendientes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {pendingByBranch.map((b) => (
                    <tr key={b.branchId} className="bg-white hover:bg-amber-50/30">
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-1.5">
                          <AlertCircle size={11} className="shrink-0 text-amber-500" />
                          <span className="text-sm text-zinc-800">{b.branchName}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-[3px] bg-amber-100 px-1.5 font-mono text-xs font-bold text-amber-700">
                          {b.count}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: pedidos por estado */}
        <div className="flex w-72 shrink-0 flex-col bg-white xl:w-80">

          <div className="border-b border-zinc-200 px-5 py-2.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
              Pedidos
            </span>
          </div>

          <div className="flex flex-1 flex-col divide-y divide-zinc-100">
            {/* PENDING */}
            <Link
              to={ROUTES.ORDERS}
              className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-zinc-50"
            >
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600">Pendientes</p>
                <p className="mt-0.5 text-[11px] text-zinc-500">Sin asignar</p>
              </div>
              <span className={cn(
                'text-2xl font-bold tabular-nums',
                pendingOrderCount > 0 ? 'text-amber-600' : 'text-zinc-300'
              )}>
                {loadingPending ? '—' : pendingOrderCount}
              </span>
            </Link>

            {/* IN_PROGRESS */}
            <Link
              to={ROUTES.ORDERS}
              className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-zinc-50"
            >
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-blue-600">En proceso</p>
                <p className="mt-0.5 text-[11px] text-zinc-500">En distribución</p>
              </div>
              <span className={cn(
                'text-2xl font-bold tabular-nums',
                inProgressCount > 0 ? 'text-blue-600' : 'text-zinc-300'
              )}>
                {loadingInProgress ? '—' : inProgressCount}
              </span>
            </Link>

            {/* COMPLETED today */}
            <Link
              to={ROUTES.ORDERS}
              className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-zinc-50"
            >
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">Completados hoy</p>
                <p className="mt-0.5 text-[11px] text-zinc-500">{today}</p>
              </div>
              <span className={cn(
                'text-2xl font-bold tabular-nums',
                completedCount > 0 ? 'text-emerald-600' : 'text-zinc-300'
              )}>
                {loadingCompleted ? '—' : completedCount}
              </span>
            </Link>
          </div>

          {/* Footer */}
          <div className="border-t border-zinc-100 bg-zinc-50/50 px-5 py-2.5">
            <Link
              to={ROUTES.ORDERS}
              className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 hover:text-zinc-700"
            >
              Ver todos los pedidos <ArrowRight size={10} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div className="border-t border-zinc-200 bg-white px-6 py-2">
        <div className="flex items-center gap-4 text-[10px] text-zinc-400">
          <span className="font-bold uppercase tracking-[0.12em]">LOOP</span>
          <span className="h-3 w-px bg-zinc-200" />
          <span>
            {new Date().toLocaleDateString('es-AR', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </span>
          <span className="ml-auto flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Sistema activo
          </span>
        </div>
      </div>
    </div>
  )
}
