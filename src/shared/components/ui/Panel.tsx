import type { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

type Props = {
  title?: React.ReactNode
  description?: string
  icon?: LucideIcon
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function Panel({ title, description, icon: Icon, actions, children, className }: Props) {
  return (
    <section
      className={cn('overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-card', className)}
    >
      {title && (
        <header className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            {Icon && (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-500">
                <Icon size={15} />
              </span>
            )}
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-zinc-900">{title}</h2>
              {description && <p className="truncate text-xs text-zinc-500">{description}</p>}
            </div>
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  )
}
