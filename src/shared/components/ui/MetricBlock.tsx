import type { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

type Accent = 'default' | 'green' | 'amber' | 'red' | 'blue'

type Props = {
  label: string
  value: React.ReactNode
  unit?: string
  note?: string
  icon?: LucideIcon
  accent?: Accent
  className?: string
}

const ACCENT_ICON: Record<Accent, string> = {
  default: 'bg-zinc-100 text-zinc-500',
  green:   'bg-emerald-50 text-emerald-600',
  amber:   'bg-amber-50 text-amber-600',
  red:     'bg-red-50 text-red-600',
  blue:    'bg-blue-50 text-blue-600',
}

const ACCENT_NOTE: Record<Accent, string> = {
  default: 'text-zinc-500',
  green:   'text-emerald-700',
  amber:   'text-amber-700',
  red:     'text-red-700',
  blue:    'text-blue-700',
}

export function MetricBlock({
  label,
  value,
  unit,
  note,
  icon: Icon,
  accent = 'default',
  className,
}: Props) {
  return (
    <div className={cn('rounded-lg border border-zinc-200 bg-white p-4 shadow-card', className)}>
      <div className="flex items-center gap-2.5">
        {Icon && (
          <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md', ACCENT_ICON[accent])}>
            <Icon size={16} />
          </span>
        )}
        <p className="truncate text-[13px] font-medium text-zinc-500">{label}</p>
      </div>
      <div className="mt-3 flex items-end gap-1.5">
        <span className="text-[28px] font-semibold leading-none tracking-tight tabular-nums text-zinc-900">
          {value}
        </span>
        {unit && <span className="mb-0.5 text-sm text-zinc-400">{unit}</span>}
      </div>
      {note && <p className={cn('mt-2 text-xs', ACCENT_NOTE[accent])}>{note}</p>}
    </div>
  )
}
