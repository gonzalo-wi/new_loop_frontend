import { cn } from '@/shared/lib/utils'

type Props = {
  title: string
  description?: string
  actions?: React.ReactNode
  meta?: React.ReactNode
  className?: string
  children?: React.ReactNode
}

export function PageHeader({ title, description, actions, meta, className, children }: Props) {
  return (
    <div className={cn('px-6 pb-5 pt-6', className)}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {meta && <p className="mb-1 text-xs font-medium text-zinc-400">{meta}</p>}
          <h1 className="text-[22px] font-semibold tracking-tight text-zinc-900">{title}</h1>
          {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}
