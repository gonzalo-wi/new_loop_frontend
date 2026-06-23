import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

type Props = {
  icon?: LucideIcon
  title?: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon = Inbox,
  title = 'Sin resultados',
  description = 'No hay registros para mostrar.',
  action,
  className,
}: Props) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16 text-center', className)}>
      <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-zinc-100 text-zinc-400">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-sm font-medium text-zinc-700">{title}</p>
        {description && <p className="mt-0.5 text-sm text-zinc-400">{description}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
