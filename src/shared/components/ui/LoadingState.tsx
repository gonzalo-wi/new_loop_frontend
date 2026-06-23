import { Loader2 } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

type Props = {
  message?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingState({ message = 'Cargando...', className, size = 'md' }: Props) {
  const iconSize = { sm: 16, md: 20, lg: 28 }[size]
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16 text-zinc-400', className)}>
      <Loader2 size={iconSize} className="animate-spin" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

export function LoadingRow({ cols }: { cols: number }) {
  return (
    <tr>
      <td colSpan={cols} className="py-12">
        <LoadingState size="sm" />
      </td>
    </tr>
  )
}
