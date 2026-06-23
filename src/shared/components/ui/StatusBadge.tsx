import { cn } from '@/shared/lib/utils'
import type { OperationalStatus } from '@/shared/types'

const STATUS_CONFIG: Record<
  OperationalStatus,
  { label: string; badge: string; dot: string }
> = {
  active:      { label: 'Activo',      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  inactive:    { label: 'Inactivo',    badge: 'bg-zinc-100 text-zinc-500 border-zinc-200',         dot: 'bg-zinc-400' },
  pending:     { label: 'Pendiente',   badge: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-500' },
  in_progress: { label: 'En proceso',  badge: 'bg-blue-50 text-blue-700 border-blue-200',          dot: 'bg-blue-500' },
  completed:   { label: 'Completado',  badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  rejected:    { label: 'Rechazado',   badge: 'bg-red-50 text-red-700 border-red-200',             dot: 'bg-red-500' },
  delayed:     { label: 'Demorado',    badge: 'bg-red-100 text-red-800 border-red-300',            dot: 'bg-red-600' },
  cancelled:   { label: 'Cancelado',   badge: 'bg-zinc-100 text-zinc-500 border-zinc-200',         dot: 'bg-zinc-400' },
  approved:    { label: 'Aprobado',    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  archived:    { label: 'Archivado',   badge: 'bg-zinc-100 text-zinc-400 border-zinc-200',         dot: 'bg-zinc-300' },
  warning:     { label: 'Advertencia', badge: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-500' },
}

type Props = {
  status: OperationalStatus
  label?: string
  /** 'badge' (default) = full pill label. 'dot' = colored dot + text, no border. */
  variant?: 'badge' | 'dot'
  size?: 'sm' | 'md'
  className?: string
}

export function StatusBadge({ status, label, variant = 'badge', size = 'sm', className }: Props) {
  const config = STATUS_CONFIG[status]
  const text = label ?? config.label

  if (variant === 'dot') {
    return (
      <span className={cn('inline-flex items-center gap-1.5', className)}>
        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', config.dot)} />
        <span className={cn(
          'font-medium text-zinc-700',
          size === 'sm' ? 'text-xs' : 'text-sm'
        )}>
          {text}
        </span>
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center border font-semibold uppercase tracking-wide rounded-[3px]',
        size === 'sm' ? 'text-[9px] px-1.5 py-[3px] leading-none' : 'text-[10px] px-2 py-1',
        config.badge,
        // Extra emphasis for critical statuses
        (status === 'delayed' || status === 'rejected') && 'ring-1 ring-red-300 ring-inset',
        className
      )}
    >
      {text}
    </span>
  )
}
