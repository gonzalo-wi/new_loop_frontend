import { formatDateTime } from '@/shared/lib/utils'
import { cn } from '@/shared/lib/utils'

export type AuditEntry = {
  id: string
  action: string
  description: string
  user: string
  timestamp: string
  type?: 'create' | 'update' | 'delete' | 'status_change' | 'info'
}

const TYPE_COLOR: Record<NonNullable<AuditEntry['type']>, string> = {
  create:        'bg-emerald-500',
  update:        'bg-blue-500',
  delete:        'bg-red-500',
  status_change: 'bg-amber-500',
  info:          'bg-zinc-400',
}

type Props = {
  entries: AuditEntry[]
  className?: string
}

export function AuditTimeline({ entries, className }: Props) {
  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-400">Sin registros de auditoría.</p>
    )
  }

  return (
    <div className={cn('relative', className)}>
      <div className="absolute left-[15px] top-0 bottom-0 w-px bg-zinc-200" />
      <ul className="space-y-4">
        {entries.map((entry, index) => {
          const dotColor = TYPE_COLOR[entry.type ?? 'info']
          return (
            <li key={entry.id} className={cn('relative flex gap-4', index === entries.length - 1 && 'pb-0')}>
              <div
                className={cn(
                  'relative z-10 mt-0.5 h-[10px] w-[10px] shrink-0 rounded-full border-2 border-white',
                  dotColor
                )}
                style={{ marginLeft: '10px' }}
              />
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-sm font-medium text-zinc-800">{entry.action}</span>
                  <span className="text-xs text-zinc-400">{entry.user}</span>
                  <span className="text-xs text-zinc-400 ml-auto">
                    {formatDateTime(entry.timestamp)}
                  </span>
                </div>
                {entry.description && (
                  <p className="mt-0.5 text-xs text-zinc-500 leading-relaxed">{entry.description}</p>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
