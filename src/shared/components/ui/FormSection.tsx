import type { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

type Props = {
  title: string
  description?: string
  icon?: LucideIcon
  children: React.ReactNode
  className?: string
}

export function FormSection({ title, description, icon: Icon, children, className }: Props) {
  return (
    <div className={cn('border-t border-zinc-100 pt-6 first:border-t-0 first:pt-0', className)}>
      <div className="mb-4 flex items-center gap-2.5">
        {Icon && (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-600">
            <Icon size={14} />
          </span>
        )}
        <div>
          <h3 className="text-sm font-semibold text-zinc-800">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-zinc-500">{description}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </div>
  )
}

type FieldProps = {
  label: string
  htmlFor?: string
  required?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
  className?: string
  fullWidth?: boolean
}

export function FormField({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
  className,
  fullWidth,
}: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1', fullWidth && 'sm:col-span-2', className)}>
      <label
        htmlFor={htmlFor}
        className="text-[13px] font-medium text-zinc-700"
      >
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-zinc-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// Reusable input styling
export const inputClassName =
  'h-10 w-full rounded-lg border border-zinc-200 bg-white shadow-card transition-colors hover:border-zinc-300 px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 disabled:bg-zinc-50 disabled:text-zinc-500'

export const selectClassName =
  'select-chevron h-10 w-full rounded-lg border border-zinc-200 bg-white shadow-card transition-colors hover:border-zinc-300 pl-3 pr-8 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 disabled:bg-zinc-50 disabled:text-zinc-500 appearance-none'

export const textareaClassName =
  'w-full rounded-lg border border-zinc-200 bg-white shadow-card transition-colors hover:border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 disabled:bg-zinc-50 disabled:text-zinc-500 resize-none'
