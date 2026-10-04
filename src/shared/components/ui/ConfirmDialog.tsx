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
        className="absolute inset-0 bg-zinc-900/40"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-sm mx-4 rounded-lg border border-zinc-200 bg-white shadow-lg">
        <div className="flex items-start justify-between p-5">
          <div className="flex items-start gap-3">
            <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', config.iconClass)}>
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
        <div className="flex items-center justify-end gap-2 border-t border-zinc-100 bg-zinc-50/60 px-5 py-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="h-9 rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 shadow-card hover:bg-zinc-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'h-9 rounded-md px-4 text-sm font-medium shadow-card disabled:opacity-50',
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
