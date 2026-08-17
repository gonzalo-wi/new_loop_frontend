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

const ACCENT_BORDER: Record<Accent, string> = {
  default: 'border-l-zinc-300',
  green:   'border-l-emerald-500',
  amber:   'border-l-amber-500',
  red:     'border-l-red-500',
  blue:    'border-l-blue-500',
}

const ACCENT_VALUE: Record<Accent, string> = {
  default: 'text-zinc-950',
  green:   'text-emerald-700',
  amber:   'text-amber-700',
  red:     'text-red-700',
  blue:    'text-blue-700',
}

const ACCENT_ICON: Record<Accent, string> = {
  default: 'bg-zinc-100 text-zinc-400',
  green:   'bg-emerald-50 text-emerald-600',
  amber:   'bg-amber-50 text-amber-600',
  red:     'bg-red-50 text-red-600',
  blue:    'bg-blue-50 text-blue-600',
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
    <div
      className={cn(
        'rounded-md border border-zinc-200 border-l-[3px] bg-white px-4 py-3.5 transition-shadow hover:shadow-sm',
        ACCENT_BORDER[accent],
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-400">{label}</p>
        {Icon && (
          <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-sm', ACCENT_ICON[accent])}>
            <Icon size={13} />
          </span>
        )}
      </div>
      <div className="mt-2.5 flex items-end gap-1.5">
        <span className={cn('text-2xl font-bold tabular-nums leading-none', ACCENT_VALUE[accent])}>
          {value}
        </span>
        {unit && <span className="mb-0.5 text-xs font-medium text-zinc-400">{unit}</span>}
      </div>
      {note && (
        <p className="mt-1.5 text-[10px] text-zinc-400">{note}</p>
      )}
    </div>
  )
}
