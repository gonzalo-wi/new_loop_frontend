import { AlertTriangle, X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

type Variant = 'danger' | 'warning' | 'info'

type Props = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: Variant
  isLoading?: boolean
}

const VARIANT_CONFIG: Record<Variant, { iconClass: string; confirmClass: string }> = {
  danger:  { iconClass: 'bg-red-50 text-red-500',   confirmClass: 'bg-red-600 hover:bg-red-700 text-white' },
  warning: { iconClass: 'bg-amber-50 text-amber-500', confirmClass: 'bg-amber-600 hover:bg-amber-700 text-white' },
  info:    { iconClass: 'bg-blue-50 text-blue-500',  confirmClass: 'bg-blue-600 hover:bg-blue-700 text-white' },
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  isLoading,
}: Props) {
  if (!open) return null

  const config = VARIANT_CONFIG[variant]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-sm rounded-sm border border-zinc-200 bg-white shadow-lg mx-4">
        <div className="flex items-start justify-between p-5">
          <div className="flex items-start gap-3">
            <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-sm', config.iconClass)}>
              <AlertTriangle size={17} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-900">{title}</p>
              {description && (
                <p className="mt-1 text-sm text-zinc-500 leading-relaxed">{description}</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 ml-2 shrink-0">
            <X size={16} />
          </button>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-zinc-100 px-5 py-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="h-8 rounded-sm border border-zinc-200 bg-white px-4 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'h-8 rounded-sm px-4 text-sm font-medium disabled:opacity-50',
              config.confirmClass
            )}
          >
            {isLoading ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
