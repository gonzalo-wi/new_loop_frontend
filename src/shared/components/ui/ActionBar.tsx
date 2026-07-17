import { cn } from '@/shared/lib/utils'

type Props = {
  children?: React.ReactNode
  className?: string
}

export function ActionBar({ children, className }: Props) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 border-b border-zinc-200 bg-white px-4 py-2.5',
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
        'inline-flex items-center gap-1.5 rounded-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'px-3 h-8 text-sm' : 'px-4 h-9 text-sm',
        variant === 'primary' &&
          'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
        variant === 'secondary' &&
          'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300',
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
