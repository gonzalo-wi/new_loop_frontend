import { useState } from 'react'
import { AlertTriangle, CheckSquare, Loader2, Printer, X } from 'lucide-react'
import { ConfirmDialog } from '@/shared/components/ui'
import type { StockControl } from '../types'
import { MAX_REMITO_BATCH, alreadyPrintedCount, notPrintedIds } from '../lib/remitoSelection'
import { useRemitoBatchPrint } from '../hooks/useRemitoBatchPrint'

type Props = {
  /** The rows shown in the list, in their order. */
  controls: StockControl[]
  /** The selected rows that still have a remito, in list order. */
  selection: StockControl[]
  onSelect: (ids: string[]) => void
  onClear: () => void
}

export function RemitoBatchBar({ controls, selection, onSelect, onClear }: Props) {
  const { print, busy, error, clearError } = useRemitoBatchPrint()
  const [confirmReprint, setConfirmReprint] = useState(false)

  const pending = notPrintedIds(controls)
  const reprints = alreadyPrintedCount(selection)
  const tooMany = selection.length > MAX_REMITO_BATCH

  function printSelection() {
    void print(selection.map((c) => c.id), onClear)
  }

  function handlePrint() {
    if (reprints > 0) setConfirmReprint(true)
    else printSelection()
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 bg-zinc-50/60 px-4 py-2">
        <button
          onClick={() => onSelect(pending)}
          disabled={pending.length === 0 || busy}
          className="flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
          title={pending.length === 0 ? 'No hay remitos sin imprimir en esta lista' : undefined}
        >
          <CheckSquare size={13} />
          Seleccionar no impresos ({pending.length})
        </button>

        {selection.length > 0 && (
          <>
            <button
              onClick={handlePrint}
              disabled={busy || tooMany}
              className="flex h-8 items-center gap-1.5 rounded-md bg-blue-600 px-3 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? <Loader2 size={13} className="animate-spin" /> : <Printer size={13} />}
              Imprimir {selection.length} remito{selection.length !== 1 ? 's' : ''}
            </button>
            <button
              onClick={onClear}
              disabled={busy}
              className="h-8 px-2 text-xs text-zinc-500 underline hover:text-zinc-800 disabled:opacity-40"
            >
              Quitar selección
            </button>
            {tooMany && (
              <span className="text-xs text-amber-700">
                Se pueden imprimir hasta {MAX_REMITO_BATCH} remitos por vez.
              </span>
            )}
          </>
        )}
      </div>

      {confirmReprint && (
        <ConfirmDialog
          open
          variant="warning"
          title={reprints === 1 ? 'Un remito ya se imprimió' : `${reprints} remitos ya se imprimieron`}
          description={`De los ${selection.length} seleccionados, ${reprints} ya se mandaron a imprimir. ¿Querés imprimirlos todos igual?`}
          confirmLabel="Imprimir todos"
          onClose={() => setConfirmReprint(false)}
          onConfirm={() => {
            setConfirmReprint(false)
            printSelection()
          }}
        />
      )}

      {error && (
        <div
          role="alert"
          className="fixed bottom-5 right-5 z-[60] flex max-w-sm items-start gap-2.5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 shadow-lg"
        >
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="flex-1 text-xs leading-relaxed text-amber-800">{error}</p>
          <button
            onClick={clearError}
            className="shrink-0 rounded-md p-0.5 text-amber-600/70 hover:bg-amber-100 hover:text-amber-800"
            aria-label="Cerrar"
          >
            <X size={13} />
          </button>
        </div>
      )}
    </>
  )
}
