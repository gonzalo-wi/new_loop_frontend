import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  Route,
  ClipboardList,
  Circle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  fetchDashboardMetrics,
  fetchOperationalAlerts,
  fetchRecentMovements,
} from '../services/dashboard.service'
import { StatusBadge, PageHeader } from '@/shared/components/ui'
import { cn, timeAgo } from '@/shared/lib/utils'
import type { OperationalAlert } from '../types'
import type { Movement, MovementType } from '@/features/movements/types'
import { ROUTES } from '@/shared/constants'

// ── Movement display ──────────────────────────────────────────────────────────

const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  entry:      'Entrada',
  exit:       'Salida',
  transfer:   'Transf.',
  adjustment: 'Ajuste',
}

const MOVEMENT_TYPE_DOT: Record<MovementType, string> = {
  entry:      'bg-emerald-500',
  exit:       'bg-red-400',
  transfer:   'bg-blue-500',
  adjustment: 'bg-amber-500',
}

// ── Alert row ─────────────────────────────────────────────────────────────────

const ALERT_CFG: Record<OperationalAlert['type'], { dot: string; badge: string; label: string }> = {
  error:   { dot: 'bg-red-500',   badge: 'text-red-700 bg-red-50 border-red-200',     label: 'CRÍTICO'   },
  warning: { dot: 'bg-amber-500', badge: 'text-amber-700 bg-amber-50 border-amber-200', label: 'PENDIENTE' },
  info:    { dot: 'bg-blue-500',  badge: 'text-blue-700 bg-blue-50 border-blue-200',   label: 'INFO'      },
}

function AlertRow({ alert }: { alert: OperationalAlert }) {
  const cfg = ALERT_CFG[alert.type]
  return (
    <div className="flex gap-3 px-4 py-3.5">
      <span className={cn('mt-[5px] block h-2 w-2 shrink-0 rounded-full', cfg.dot)} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-x-2">
          <div className="flex items-center gap-2">
            <span className={cn(
              'inline-block rounded-[3px] border px-1.5 py-[2px] text-[9px] font-bold uppercase tracking-widest',
              cfg.badge
            )}>
              {cfg.label}
            </span>
            <p className="text-[11px] font-semibold text-zinc-800">{alert.title}</p>
          </div>
          <span className="shrink-0 font-mono text-[10px] text-zinc-400">
            {timeAgo(alert.createdAt)}
          </span>
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">{alert.description}</p>
      </div>
    </div>
  )
}

// ── Movement table row — premium redesign ─────────────────────────────────────

function MovementRow({ mov }: { mov: Movement }) {
  const isDelayed = mov.status === 'delayed'
  const isPending = mov.status === 'pending'

  const qty = [
    mov.quantityFull !== 0        && `${mov.quantityFull > 0 ? '+' : ''}${mov.quantityFull}`,
    mov.quantityEmpty !== 0       && `${mov.quantityEmpty}v`,
    mov.quantityReplacement !== 0 && `${mov.quantityReplacement}rc`,
  ].filter(Boolean).join('  ')

  const route = [mov.fromBranchName, mov.toBranchName].filter(Boolean).join(' → ')

  return (
    <tr className={cn(
      'group border-l-[3px] transition-all duration-75',
      isDelayed
        ? 'border-l-red-400 bg-red-50/30 hover:bg-red-50/50'
        : isPending
        ? 'border-l-amber-400 bg-amber-50/20 hover:bg-amber-50/40'
        : 'border-l-transparent hover:border-l-zinc-300 hover:bg-zinc-50'
    )}>

      {/* Code — monospace pill */}
      <td className="py-3 pl-3 pr-4">
        <span className="inline-block rounded-[3px] border border-zinc-100 bg-zinc-50 px-2 py-[3px] font-mono text-[11px] font-semibold tracking-tight text-zinc-500 group-hover:border-zinc-200 group-hover:bg-white transition-colors">
          {mov.code}
        </span>
      </td>

      {/* Type */}
      <td className="px-4 py-3">
        <span className="flex items-center gap-1.5">
          <span className={cn('h-[7px] w-[7px] shrink-0 rounded-full', MOVEMENT_TYPE_DOT[mov.type])} />
          <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-zinc-500">
            {MOVEMENT_TYPE_LABELS[mov.type]}
          </span>
        </span>
      </td>

      {/* Product + Route */}
      <td className="px-4 py-3">
        <p className="text-[12px] font-semibold leading-tight text-zinc-800">{mov.productName}</p>
        {route && (
          <p className="mt-0.5 max-w-[200px] truncate text-[10px] text-zinc-400">{route}</p>
        )}
      </td>

      {/* Qty */}
      <td className="px-4 py-3 text-right">
        <span className="font-mono text-[11px] font-medium tabular-nums text-zinc-600">{qty}</span>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <StatusBadge status={mov.status} />
      </td>

      {/* Operator + Time */}
      <td className="px-4 py-3">
        <p className="text-[11px] font-medium text-zinc-500 leading-tight">
          {mov.operatorName.split(' ')[0]}
        </p>
        <p className="mt-0.5 font-mono text-[10px] tabular-nums text-zinc-300">
          {timeAgo(mov.createdAt)}
        </p>
      </td>

      {/* Actions — appear on row hover */}
      <td className="py-3 pl-2 pr-4 text-right">
        <div className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity duration-100 group-hover:opacity-100">
          <Link
            to={ROUTES.MOVEMENTS}
            className="rounded-[3px] px-2 py-[5px] text-[10px] font-semibold text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800"
          >
            Ver
          </Link>
          <span className="h-3 w-px bg-zinc-200" />
          <Link
            to={ROUTES.AUDITS}
            className="rounded-[3px] px-2 py-[5px] text-[10px] font-semibold text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800"
          >
            Auditar
          </Link>
        </div>
      </td>
    </tr>
  )
}

// ── Metric cell — two-tier ────────────────────────────────────────────────────

type MetricStatus = 'critical' | 'warning' | 'success' | 'info' | 'neutral'

type MetricCellProps = {
  label: string
  value: string | number
  status?: MetricStatus
  note?: string
  priority?: 'primary' | 'secondary'
  highlighted?: boolean
}

function MetricCell({
  label,
  value,
  status = 'neutral',
  note,
  priority = 'primary',
  highlighted = false,
}: MetricCellProps) {
  const valueColor: Record<MetricStatus, string> = {
    critical: 'text-red-600',
    warning:  'text-amber-600',
    success:  'text-emerald-600',
    info:     'text-blue-600',
    neutral:  'text-zinc-950',
  }

  const highlightBg =
    highlighted && status === 'critical' ? 'bg-red-50/70' :
    highlighted && status === 'warning'  ? 'bg-amber-50/50' :
    ''

  return (
    <div className={cn(
      'flex min-w-0 flex-col gap-1 transition-colors',
      priority === 'primary' ? 'px-6 py-5' : 'px-5 py-2.5',
      highlightBg
    )}>
      <dt className="text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-400">{label}</dt>
      <dd className={cn(
        'font-bold tabular-nums leading-none',
        priority === 'primary' ? 'text-3xl' : 'text-xl',
        valueColor[status]
      )}>
        {value}
      </dd>
      {note && <span className="text-[10px] text-zinc-400">{note}</span>}
    </div>
  )
}

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
          ? 'border-zinc-900 bg-zinc-900 text-white hover:border-zinc-700 hover:bg-zinc-800'
          : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900'
      )}
    >
      <Icon size={11} strokeWidth={2.5} />
      {label}
    </Link>
  )
}

// ── Movement filter ───────────────────────────────────────────────────────────

type MovFilter = 'all' | 'entry' | 'exit' | 'pending' | 'delayed'

const MOV_FILTERS: { key: MovFilter; label: string }[] = [
  { key: 'all',     label: 'Todos'      },
  { key: 'entry',   label: 'Entradas'   },
  { key: 'exit',    label: 'Salidas'    },
  { key: 'pending', label: 'Pendientes' },
  { key: 'delayed', label: 'Demorados'  },
]

const FILTER_EMPTY_LABEL: Record<MovFilter, string> = {
  all:     'movimientos',
  entry:   'entradas',
  exit:    'salidas',
  pending: 'movimientos pendientes',
  delayed: 'movimientos demorados',
}

// ── Dashboard page ────────────────────────────────────────────────────────────

export function DashboardPage() {
  const [movFilter, setMovFilter] = useState<MovFilter>('all')

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: fetchDashboardMetrics,
    refetchInterval: 60_000,
  })

  const { data: alerts = [] } = useQuery({
    queryKey: ['dashboard', 'alerts'],
    queryFn: fetchOperationalAlerts,
    refetchInterval: 30_000,
  })

  const { data: recentMovements = [], isLoading: movementsLoading } = useQuery({
    queryKey: ['dashboard', 'recent-movements'],
    queryFn: fetchRecentMovements,
  })

  const hasCritical = !!metrics && (metrics.delayedMovements > 0 || metrics.pendingMovements > 0)

  const filteredMovements = useMemo(() => {
    return recentMovements.filter((mov) => {
      switch (movFilter) {
        case 'entry':   return mov.type === 'entry'
        case 'exit':    return mov.type === 'exit'
        case 'pending': return mov.status === 'pending'
        case 'delayed': return mov.status === 'delayed'
        default:        return true
      }
    })
  }, [recentMovements, movFilter])

  const filterCounts = useMemo<Record<MovFilter, number>>(() => ({
    all:     recentMovements.length,
    entry:   recentMovements.filter((m) => m.type === 'entry').length,
    exit:    recentMovements.filter((m) => m.type === 'exit').length,
    pending: recentMovements.filter((m) => m.status === 'pending').length,
    delayed: recentMovements.filter((m) => m.status === 'delayed').length,
  }), [recentMovements])

  const delayed = metrics?.delayedMovements ?? 0
  const pending = metrics?.pendingMovements ?? 0

  return (
    <div className="flex min-h-0 flex-col bg-zinc-50">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <PageHeader
        meta="LOOP · Sistema de control"
        title="Dashboard operativo"
        description="Resumen en tiempo real de mercadería, stock y repartos."
      />

      {/* ── Critical banner ───────────────────────────────────────────── */}
      {!metricsLoading && hasCritical && (
        <div className="flex items-center gap-6 border-b border-amber-200 bg-amber-50 px-6 py-2">
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={12} className="text-amber-600" />
            <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-amber-800">
              Atención requerida
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {delayed > 0 && (
              <span className="text-xs text-amber-800">
                <strong>{delayed}</strong> movimiento{delayed !== 1 ? 's' : ''} demorado{delayed !== 1 ? 's' : ''}
              </span>
            )}
            {pending > 0 && (
              <span className="text-xs text-amber-800">
                <strong>{pending}</strong> entrada{pending !== 1 ? 's' : ''} sin controlar
              </span>
            )}
          </div>
          <Link
            to={ROUTES.MOVEMENTS}
            className="ml-auto flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 hover:text-amber-900"
          >
            Ver movimientos <ArrowRight size={10} />
          </Link>
        </div>
      )}

      {/* ── Quick actions toolbar ─────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-zinc-200 bg-white px-5 py-3">
        <span className="mr-2 text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-300">
          Acciones
        </span>
        <QuickAction
          to={ROUTES.STOCK_ENTRIES}
          icon={ArrowDownToLine}
          label="Nueva entrada"
          variant="primary"
        />
        <QuickAction to={ROUTES.STOCK_EXITS} icon={ArrowUpFromLine} label="Registrar salida" />
        <QuickAction to={ROUTES.DELIVERIES}  icon={Route}           label="Crear reparto" />
        <QuickAction to={ROUTES.AUDITS}      icon={ClipboardList}   label="Ver auditoría" />
      </div>

      {/* ── Metrics strip — two-tier ──────────────────────────────────── */}
      <div className="border-b border-zinc-200 bg-white">

        {/* Primary: Demorados · Pendientes · Repartos · Stock */}
        <dl className="flex divide-x divide-zinc-100 border-b border-zinc-100">
          <MetricCell
            label="Demorados"
            value={metricsLoading ? '—' : delayed}
            status={delayed > 0 ? 'critical' : 'neutral'}
            note={delayed > 0 ? 'requieren acción' : 'sin demoras'}
            priority="primary"
            highlighted={delayed > 0}
          />
          <MetricCell
            label="Pendientes"
            value={metricsLoading ? '—' : pending}
            status={pending > 0 ? 'warning' : 'neutral'}
            note={pending > 0 ? 'sin controlar' : 'al día'}
            priority="primary"
            highlighted={pending > 0}
          />
          <MetricCell
            label="Repartos activos"
            value={metricsLoading ? '—' : (metrics?.activeDeliveries ?? 0)}
            status="info"
            priority="primary"
          />
          <MetricCell
            label="Unidades en stock"
            value={metricsLoading ? '—' : (metrics?.totalStockUnits ?? 0).toLocaleString('es-AR')}
            priority="primary"
          />
          <div className="flex-1" />
        </dl>

        {/* Secondary: Movimientos · Entregas · Sucursales */}
        <dl className="flex divide-x divide-zinc-100">
          <MetricCell
            label="Movimientos hoy"
            value={metricsLoading ? '—' : (metrics?.totalMovementsToday ?? 0)}
            priority="secondary"
          />
          <MetricCell
            label="Entregas completadas"
            value={metricsLoading ? '—' : (metrics?.completedDeliveriesToday ?? 0)}
            status="success"
            priority="secondary"
          />
          <MetricCell
            label="Sucursales activas"
            value={metricsLoading ? '—' : (metrics?.activeBranches ?? 0)}
            priority="secondary"
          />
          <div className="flex-1" />
        </dl>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 divide-x divide-zinc-200">

        {/* Left: Movements table */}
        <div className="flex min-w-0 flex-1 flex-col bg-white">

          {/* Movements header + filters */}
          <div className="flex items-center gap-3 border-b border-zinc-200 bg-zinc-50/80 px-4 py-2">
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
              Movimientos
            </span>

            {/* Filter pills with counts */}
            <div className="flex items-center gap-0.5">
              {MOV_FILTERS.map((f) => {
                const count  = filterCounts[f.key]
                const active = movFilter === f.key
                const isCrit = f.key === 'delayed' || f.key === 'pending'
                return (
                  <button
                    key={f.key}
                    onClick={() => setMovFilter(f.key)}
                    className={cn(
                      'flex items-center gap-1 rounded-[3px] px-2 py-[3px] text-[10px] font-medium transition-colors',
                      active
                        ? 'bg-zinc-900 text-white'
                        : 'text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700'
                    )}
                  >
                    {f.label}
                    {f.key !== 'all' && count > 0 && (
                      <span className={cn(
                        'rounded-[2px] px-[5px] py-px text-[9px] font-bold tabular-nums',
                        active
                          ? 'bg-white/20 text-white'
                          : isCrit && f.key === 'delayed'
                          ? 'bg-red-100 text-red-600'
                          : isCrit && f.key === 'pending'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-zinc-200 text-zinc-500'
                      )}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            <Link
              to={ROUTES.MOVEMENTS}
              className="ml-auto flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 transition-colors hover:text-zinc-700"
            >
              Ver todos <ArrowRight size={10} />
            </Link>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {movementsLoading ? (
              <div className="flex items-center justify-center py-16 text-xs text-zinc-400">
                Cargando movimientos...
              </div>
            ) : filteredMovements.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-1.5 py-14">
                <p className="text-xs font-medium text-zinc-400">
                  Sin {FILTER_EMPTY_LABEL[movFilter]}
                </p>
                {movFilter !== 'all' && (
                  <button
                    onClick={() => setMovFilter('all')}
                    className="text-[10px] text-zinc-400 underline hover:text-zinc-600"
                  >
                    Ver todos los movimientos
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50">
                    <th className="py-2.5 pl-3 pr-4 text-left text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-400">
                      Código
                    </th>
                    <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-400">
                      Tipo
                    </th>
                    <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-400">
                      Producto / Ruta
                    </th>
                    <th className="px-4 py-2.5 text-right text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-400">
                      Cant.
                    </th>
                    <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-400">
                      Estado
                    </th>
                    <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-400">
                      Operador
                    </th>
                    <th className="py-2.5 pl-2 pr-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredMovements.map((mov) => (
                    <MovementRow key={mov.id} mov={mov} />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: Alert feed */}
        <div className="flex w-72 shrink-0 flex-col bg-white xl:w-80">

          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50/80 px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                Alertas
              </span>
              {alerts.length > 0 && (
                <span className="flex h-4 min-w-[1rem] items-center justify-center rounded-[3px] bg-amber-500 px-1 text-[9px] font-bold text-white">
                  {alerts.length}
                </span>
              )}
            </div>
            {alerts.length > 0 && (
              <Circle size={7} className="fill-amber-400 text-amber-400" />
            )}
          </div>

          {alerts.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-12 text-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-[3px] border border-emerald-200 bg-emerald-50">
                <span className="text-lg leading-none text-emerald-500">✓</span>
              </div>
              <p className="text-xs font-medium text-zinc-500">Sin alertas activas</p>
              <p className="text-[10px] text-zinc-400">Sistema operando con normalidad</p>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100 overflow-y-auto">
              {alerts.map((alert) => (
                <li key={alert.id}>
                  <AlertRow alert={alert} />
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-zinc-100 bg-zinc-50/50 px-4 py-2">
            <p className="text-[9px] text-zinc-400">
              Actualización cada 30 seg. ·{' '}
              <Link to={ROUTES.AUDITS} className="underline hover:text-zinc-600">
                Ver auditoría
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* ── Footer bar ────────────────────────────────────────────────── */}
      <div className="border-t border-zinc-200 bg-white px-6 py-2">
        <div className="flex items-center gap-6 text-[10px] text-zinc-400">
          <span className="font-bold uppercase tracking-[0.12em]">Estado</span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            API activa (mock)
          </span>
          <span className="text-zinc-300">·</span>
          <span>
            {new Date().toLocaleDateString('es-AR', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </span>
          <Link
            to={ROUTES.STOCK}
            className="ml-auto flex items-center gap-1 font-semibold uppercase tracking-wide text-zinc-500 hover:text-zinc-800 transition-colors"
          >
            Ver stock completo <ArrowRight size={10} />
          </Link>
        </div>
      </div>
    </div>
  )
}
