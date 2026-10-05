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
  Building2,
  Loader2,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader, MetricBlock, Panel } from '@/shared/components/ui'
import { ROUTES } from '@/shared/constants'
import { cn } from '@/shared/lib/utils'
import { fetchPendingArrivals } from '@/features/stock/services/stock-controls.service'
import { fetchStockControls } from '@/features/stock/services/stock-controls.service'
import { fetchDeliverySummary } from '@/features/deliveries/services/deliveries.service'
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
        'inline-flex h-9 items-center gap-2 rounded-md px-3.5 text-sm font-medium shadow-card transition-colors',
        variant === 'primary'
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : 'border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
      )}
    >
      <Icon size={15} />
      {label}
    </Link>
  )
}

// ── Dashboard page ────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { data: pendingArrivals, isLoading: loadingArrivals } = useQuery({
    queryKey: ['pending-arrivals'],
    queryFn:  () => fetchPendingArrivals(),
    refetchInterval: 30_000,
  })

  const { data: deliverySummary, isLoading: loadingDeliveries } = useQuery({
    queryKey: ['deliveries', 'summary'],
    queryFn:  fetchDeliverySummary,
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
  const activeDeliveries  = deliverySummary?.active ?? 0
  const activeBranches    = branches.filter((b) => b.status === 'active').length
  const pendingArrCount   = pendingArrivals?.pending ?? 0
  const totalExpected     = pendingArrivals?.totalExpected ?? 0
  const pendingOrderCount = pendingOrders?.totalElements ?? 0
  const inProgressCount   = inProgressOrders?.totalElements ?? 0
  const completedCount    = completedToday?.totalElements ?? 0
  const entriesCount      = todayEntries?.page.totalElements ?? 0
  const exitsCount        = todayExits?.page.totalElements ?? 0

  const hasPendingArrivals = pendingArrCount > 0

  const ordersTotal = pendingOrderCount + inProgressCount + completedCount
  const orderRows = [
    { label: 'Pendientes',      hint: 'Sin asignar',     count: pendingOrderCount, loading: loadingPending,    dot: 'bg-amber-500',   bar: 'bg-amber-400' },
    { label: 'En proceso',      hint: 'En distribución', count: inProgressCount,   loading: loadingInProgress, dot: 'bg-blue-500',    bar: 'bg-blue-500' },
    { label: 'Completados hoy', hint: today,             count: completedCount,    loading: loadingCompleted,  dot: 'bg-emerald-500', bar: 'bg-emerald-500' },
  ]

  const spinner = <Loader2 size={20} className="animate-spin text-zinc-300" />

  return (
    <div className="pb-8">
      <PageHeader
        title="Dashboard operativo"
        description={new Date().toLocaleDateString('es-AR', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        })}
        actions={
          <>
            <QuickAction to={ROUTES.STOCK_EXITS}   icon={ArrowUpFromLine} label="Registrar salida" />
            <QuickAction to={ROUTES.STOCK_ENTRIES} icon={ArrowDownToLine} label="Nueva entrada" variant="primary" />
          </>
        }
      />

      <div className="space-y-5 px-6">

        {/* ── Pending arrivals banner ───────────────────────────────────── */}
        {!loadingArrivals && hasPendingArrivals && (
          <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <Clock size={16} />
            </span>
            <p className="text-sm text-amber-900">
              <strong className="font-semibold">{pendingArrCount}</strong> reparto{pendingArrCount !== 1 ? 's' : ''} pendiente{pendingArrCount !== 1 ? 's' : ''} de llegar hoy
            </p>
            <Link
              to={ROUTES.STOCK_ENTRIES}
              className="ml-auto flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100"
            >
              Ver entradas <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* ── Metrics ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <MetricBlock
            label="Faltan llegar hoy"
            icon={Clock}
            accent={pendingArrCount > 0 ? 'amber' : 'green'}
            value={loadingArrivals ? spinner : `${pendingArrCount} / ${totalExpected}`}
            note={pendingArrCount === 0 ? 'Todos llegaron' : `${pendingArrivals?.arrived ?? 0} ya volvieron`}
          />
          <MetricBlock
            label="Repartos activos"
            icon={Route}
            value={loadingDeliveries ? spinner : activeDeliveries}
          />
          <MetricBlock
            label="Pedidos en proceso"
            icon={ClipboardCheck}
            accent={inProgressCount > 0 ? 'blue' : 'default'}
            value={loadingInProgress ? spinner : inProgressCount}
          />
          <MetricBlock
            label="Sucursales activas"
            icon={Building2}
            value={loadingBranches ? spinner : activeBranches}
          />
        </div>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div className="grid gap-5 xl:grid-cols-3">

          <div className="space-y-5 xl:col-span-2">
            <Panel
              title="Controles de hoy"
              icon={ClipboardList}
              actions={<span className="text-xs tabular-nums text-zinc-400">{today}</span>}
            >
              <div className="grid grid-cols-2 divide-x divide-zinc-100">
                <Link to={ROUTES.STOCK_ENTRIES} className="group flex items-center gap-4 px-5 py-5 transition-colors hover:bg-zinc-50">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <ArrowDownToLine size={20} />
                  </span>
                  <div className="flex-1">
                    <p className="text-[13px] font-medium text-zinc-500">Entradas registradas</p>
                    <p className="mt-1 text-[28px] font-semibold leading-none tracking-tight tabular-nums text-zinc-900">
                      {loadingEntries ? spinner : entriesCount}
                    </p>
                  </div>
                  <ArrowRight size={16} className="text-zinc-300 transition-colors group-hover:text-zinc-500" />
                </Link>
                <Link to={ROUTES.STOCK_EXITS} className="group flex items-center gap-4 px-5 py-5 transition-colors hover:bg-zinc-50">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600">
                    <ArrowUpFromLine size={20} />
                  </span>
                  <div className="flex-1">
                    <p className="text-[13px] font-medium text-zinc-500">Salidas registradas</p>
                    <p className="mt-1 text-[28px] font-semibold leading-none tracking-tight tabular-nums text-zinc-900">
                      {loadingExits ? spinner : exitsCount}
                    </p>
                  </div>
                  <ArrowRight size={16} className="text-zinc-300 transition-colors group-hover:text-zinc-500" />
                </Link>
              </div>
            </Panel>

            <Panel
              title={
                <span className="flex items-center gap-2">
                  Repartos pendientes de llegar
                  {pendingArrCount > 0 && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      {pendingArrCount}
                    </span>
                  )}
                </span>
              }
              icon={Route}
              actions={
                <Link to={ROUTES.STOCK_ENTRIES} className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                  Registrar entrada <ArrowRight size={14} />
                </Link>
              }
            >
              {loadingArrivals ? (
                <div className="flex items-center justify-center py-12 text-sm text-zinc-400">Cargando...</div>
              ) : pendingArrCount === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <CheckCircle2 size={20} />
                  </span>
                  <p className="text-sm font-medium text-zinc-700">Todos los repartos llegaron</p>
                  <p className="text-xs text-zinc-400">
                    {totalExpected > 0 ? `${totalExpected} de ${totalExpected} completados` : 'Sin repartos esperados hoy'}
                  </p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50">
                      <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Sucursal</th>
                      <th className="w-28 px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Pendientes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {pendingByBranch.map((b) => (
                      <tr key={b.branchId} className="hover:bg-zinc-50/70">
                        <td className="px-5 py-3.5">
                          <span className="flex items-center gap-2">
                            <AlertCircle size={15} className="shrink-0 text-amber-500" />
                            <span className="text-sm font-medium text-zinc-800">{b.branchName}</span>
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-amber-100 px-2 text-xs font-semibold tabular-nums text-amber-700">
                            {b.count}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Panel>
          </div>

          {/* Pedidos por estado */}
          <Panel title="Pedidos" icon={ClipboardCheck} className="flex flex-col self-start">
            <div className="px-5 pt-5">
              <div className="flex h-2 overflow-hidden rounded-full bg-zinc-100">
                {ordersTotal > 0 && orderRows.map((r) => (
                  <div key={r.label} className={r.bar} style={{ width: `${(r.count / ordersTotal) * 100}%` }} />
                ))}
              </div>
            </div>
            <div className="divide-y divide-zinc-100 px-2 py-2">
              {orderRows.map((r) => (
                <Link
                  key={r.label}
                  to={ROUTES.ORDERS}
                  className="flex items-center gap-3 rounded-md px-3 py-3 transition-colors hover:bg-zinc-50"
                >
                  <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', r.dot)} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-800">{r.label}</p>
                    <p className="text-xs text-zinc-400">{r.hint}</p>
                  </div>
                  <span className={cn('text-xl font-semibold tabular-nums', r.count > 0 ? 'text-zinc-900' : 'text-zinc-300')}>
                    {r.loading ? '—' : r.count}
                  </span>
                </Link>
              ))}
            </div>
            <div className="border-t border-zinc-100 px-5 py-3">
              <Link to={ROUTES.ORDERS} className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                Ver todos los pedidos <ArrowRight size={14} />
              </Link>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
