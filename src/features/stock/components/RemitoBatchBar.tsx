import { useState } from 'react'
import { AlertTriangle, Loader2, Printer, X } from 'lucide-react'
import { ConfirmDialog } from '@/shared/components/ui'
import type { StockControl } from '../types'
import { MAX_REMITO_BATCH, alreadyPrintedCount, notPrintedIds } from '../lib/remitoSelection'
import { useRemitoBatchPrint } from '../hooks/useRemitoBatchPrint'

type Props = {
  /** The rows shown in the list, in their order. */
  controls: StockControl[]
  /** The selected rows that still have a remito, in list order. */
  selection: StockControl[]
  onClear: () => void
}

export function RemitoBatchBar({ controls, selection, onClear }: Props) {
  const { print, busy, error, clearError } = useRemitoBatchPrint()
  const [confirmReprint, setConfirmReprint] = useState(false)

  const pending = notPrintedIds(controls)
  const reprints = alreadyPrintedCount(selection)
  const hasSelection = selection.length > 0
  const tooManyPending = pending.length > MAX_REMITO_BATCH
  const tooManySelected = selection.length > MAX_REMITO_BATCH

  function printSelection() {
    void print(selection.map((c) => c.id), onClear)
  }

  function handlePrintSelection() {
    if (reprints > 0) setConfirmReprint(true)
    else printSelection()
  }

  return (
    <>
      {/* Right-aligned, above the print and selection columns of the rows. */}
      <div className="flex flex-wrap items-center justify-end gap-2 border-b border-zinc-100 bg-zinc-50/60 px-4 py-2">
        {(tooManyPending || tooManySelected) && (
          <span className="text-xs text-amber-700">
            Se pueden imprimir hasta {MAX_REMITO_BATCH} remitos por vez.
          </span>
        )}

        {hasSelection ? (
          <>
            <button
              onClick={onClear}
              disabled={busy}
              className="h-8 px-2 text-xs text-zinc-500 underline hover:text-zinc-800 disabled:opacity-40"
            >
              Quitar selección
            </button>
            <button
              onClick={handlePrintSelection}
              disabled={busy || tooManySelected}
              className="flex h-8 items-center gap-1.5 rounded-md bg-blue-600 px-3 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? <Loader2 size={13} className="animate-spin" /> : <Printer size={13} />}
              Imprimir {selection.length} seleccionado{selection.length !== 1 ? 's' : ''}
            </button>
          </>
        ) : (
          <button
            onClick={() => void print(pending)}
            disabled={busy || pending.length === 0 || tooManyPending}
            className="flex h-8 items-center gap-1.5 rounded-md bg-blue-600 px-3 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
            title={pending.length === 0 ? 'No quedan remitos sin imprimir en esta lista' : 'Imprime todos los remitos que todavía no se imprimieron'}
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : <Printer size={13} />}
            {pending.length === 0 ? 'Sin remitos pendientes' : `Imprimir pendientes (${pending.length})`}
          </button>
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
