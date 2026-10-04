import { cn } from '@/shared/lib/utils'

type Props = {
  children?: React.ReactNode
  className?: string
}

export function ActionBar({ children, className }: Props) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 border-b border-zinc-100 bg-white px-4 py-3',
        className
      )}
    >
      {children}
    </div>
  )
}

// Reusable button variants for action bars

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  icon?: React.ReactNode
}

export function ActionButton({
  variant = 'secondary',
  size = 'sm',
  icon,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'h-9 px-3.5 text-sm' : 'h-10 px-4 text-sm',
        variant === 'primary' &&
          'bg-blue-600 text-white shadow-card hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-1',
        variant === 'secondary' &&
          'border border-zinc-200 bg-white text-zinc-700 shadow-card hover:border-zinc-300 hover:bg-zinc-50',
        variant === 'ghost' && 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
        variant === 'danger' &&
          'border border-red-200 bg-white text-red-600 hover:bg-red-50 hover:border-red-300',
        className
      )}
    >
      {icon}
      {children}
    </button>
  )
}
