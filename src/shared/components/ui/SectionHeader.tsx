import { cn } from '@/shared/lib/utils'

type Props = {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

export function SectionHeader({ title, description, actions, className }: Props) {
  return (
    <div className={cn('flex items-center justify-between gap-4 py-3', className)}>
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-zinc-400">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
