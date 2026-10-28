import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { FileText, Printer, Loader2, AlertTriangle, X } from 'lucide-react'
import { ConfirmDialog } from '@/shared/components/ui'
import { cn } from '@/shared/lib/utils'
import { fetchRemitoPdf, markRemitoPrinted } from '../services/stock-controls.service'

// The endpoint needs a Bearer token, so the PDF can't be linked to directly —
// it has to be fetched through the axios client and handed to the browser as a
// blob URL.
const BLOB_TTL_MS = 60_000

type Props = {
  controlId: string
  /** Several operators share one panel session; this tells them someone already printed it. */
  printed: boolean
  /** 'icon' for table rows, 'button' for the detail header. */
  variant?: 'icon' | 'button'
}

export function RemitoActions({ controlId, printed, variant = 'icon' }: Props) {
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState<'view' | 'print' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPrinted, setIsPrinted] = useState(printed)
  const [confirmReprint, setConfirmReprint] = useState(false)

  useEffect(() => setIsPrinted(printed), [printed])

  function fail(err: unknown) {
    setError(err instanceof Error ? err.message : 'No se pudo obtener el remito.')
  }

  async function handleView(e: React.MouseEvent) {
    e.stopPropagation()
    if (busy) return
    // Opened synchronously: after an await the popup blocker would kill it.
    const tab = window.open('', '_blank')
    setBusy('view')
    setError(null)
    try {
      const blob = await fetchRemitoPdf(controlId)
      const url = URL.createObjectURL(blob)
      if (tab) tab.location.href = url
      else window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), BLOB_TTL_MS)
    } catch (err) {
      tab?.close()
      fail(err)
    } finally {
      setBusy(null)
    }
  }

  async function markPrinted() {
    try {
      await markRemitoPrinted(controlId)
      setIsPrinted(true)
      queryClient.invalidateQueries({ queryKey: ['stock-controls'] })
    } catch (err) {
      setError(
        `El remito se mandó a imprimir pero no se pudo marcar como impreso: ${
          err instanceof Error ? err.message : 'error desconocido'
        }`
      )
    }
  }

  function handlePrintClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (busy) return
    if (isPrinted) setConfirmReprint(true)
    else print()
  }

  async function print() {
    setBusy('print')
    setError(null)
    try {
      const blob = await fetchRemitoPdf(controlId)
      const url = URL.createObjectURL(blob)
      // A hidden iframe sidesteps the popup blocker entirely and lets us fire
      // the print dialog straight from the loaded PDF.
      const frame = document.createElement('iframe')
      frame.style.display = 'none'
      frame.src = url
      frame.onload = () => {
        // The browser can't tell whether the paper came out, so opening the print dialog counts as printed.
        void markPrinted()
        frame.contentWindow?.focus()
        frame.contentWindow?.print()
      }
      document.body.appendChild(frame)
      setTimeout(() => {
        URL.revokeObjectURL(url)
        frame.remove()
      }, BLOB_TTL_MS)
    } catch (err) {
      fail(err)
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      {variant === 'icon' ? (
        <>
          <button
            onClick={handleView}
            disabled={!!busy}
            className="rounded-md p-1 text-zinc-400 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-40"
            title="Ver remito (PDF)"
          >
            {busy === 'view' ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <FileText size={13} />
            )}
          </button>
          <button
            onClick={handlePrintClick}
            disabled={!!busy}
            className={cn(
              'rounded-md p-1 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-40',
              isPrinted ? 'text-emerald-600' : 'text-zinc-400'
            )}
            title={isPrinted ? 'Remito impreso — imprimir de nuevo' : 'Imprimir remito'}
          >
            {busy === 'print' ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Printer size={13} />
            )}
          </button>
        </>
      ) : (
        <>
          <button
            onClick={handleView}
            disabled={!!busy}
            className="flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            {busy === 'view' ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <FileText size={13} />
            )}
            Ver remito
          </button>
          <button
            onClick={handlePrintClick}
            disabled={!!busy}
            className="flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            {busy === 'print' ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Printer size={13} />
            )}
            {isPrinted ? 'Reimprimir' : 'Imprimir'}
          </button>
          {isPrinted && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              Impreso
            </span>
          )}
        </>
      )}

      {confirmReprint && (
        // Rendered inside a clickable table row: keep the dialog's clicks from opening the detail.
        <div onClick={(e) => e.stopPropagation()}>
          <ConfirmDialog
            open
            variant="warning"
            title="Este remito ya se imprimió"
            description="Alguien ya lo mandó a imprimir. ¿Querés imprimirlo de nuevo?"
            confirmLabel="Imprimir de nuevo"
            onClose={() => setConfirmReprint(false)}
            onConfirm={() => {
              setConfirmReprint(false)
              void print()
            }}
          />
        </div>
      )}

      {error && (
        <div className="fixed bottom-5 right-5 z-[60] flex max-w-sm items-start gap-2.5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 shadow-lg">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="flex-1 text-xs leading-relaxed text-amber-800">{error}</p>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setError(null)
            }}
            className="shrink-0 rounded-md p-0.5 text-amber-600/70 hover:bg-amber-100 hover:text-amber-800"
          >
            <X size={13} />
          </button>
        </div>
      )}
    </>
  )
}
