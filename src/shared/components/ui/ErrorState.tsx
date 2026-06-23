import { AlertTriangle, RefreshCw } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

type Props = {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = 'Error al cargar',
  message = 'Ocurrió un error inesperado. Intentá de nuevo.',
  onRetry,
  className,
}: Props) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 py-16', className)}>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500">
        <AlertTriangle size={20} />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-zinc-800">{title}</p>
        <p className="mt-1 text-sm text-zinc-500">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-900 underline underline-offset-2"
        >
          <RefreshCw size={13} />
          Reintentar
        </button>
      )}
    </div>
  )
}
