import type { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

type Accent = 'default' | 'green' | 'amber' | 'red' | 'blue'

type Props = {
  label: string
  value: string | number
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
        'border border-zinc-200 border-l-[3px] bg-white px-4 py-3.5',
        ACCENT_BORDER[accent],
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-400">{label}</p>
        {Icon && <Icon size={13} className="mt-0.5 shrink-0 text-zinc-300" />}
      </div>
      <div className="mt-2 flex items-end gap-1.5">
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
