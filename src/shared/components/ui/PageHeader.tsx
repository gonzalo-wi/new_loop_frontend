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
    <div className={cn('border-b border-zinc-200 bg-white', className)}>
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <div className="min-w-0">
          {/* Breadcrumb/context line */}
          {meta && (
            <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-400">
              {meta}
            </p>
          )}
          <h1 className="text-base font-bold tracking-tight text-zinc-950">{title}</h1>
          {description && (
            <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
      {children && (
        <div className="border-t border-zinc-100 px-6 pb-3 pt-2">{children}</div>
      )}
    </div>
  )
}
