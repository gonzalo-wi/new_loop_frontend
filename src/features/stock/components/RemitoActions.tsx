import { useState } from 'react'
import { FileText, Printer, Loader2, AlertTriangle, X } from 'lucide-react'
import { fetchRemitoPdf } from '../services/stock-controls.service'

// The endpoint needs a Bearer token, so the PDF can't be linked to directly —
// it has to be fetched through the axios client and handed to the browser as a
// blob URL.
const BLOB_TTL_MS = 60_000

type Props = {
  controlId: string
  /** 'icon' for table rows, 'button' for the detail header. */
  variant?: 'icon' | 'button'
}

export function RemitoActions({ controlId, variant = 'icon' }: Props) {
  const [busy, setBusy] = useState<'view' | 'print' | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  async function handlePrint(e: React.MouseEvent) {
    e.stopPropagation()
    if (busy) return
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
            className="rounded p-1 text-zinc-400 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-40"
            title="Ver remito (PDF)"
          >
            {busy === 'view' ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <FileText size={13} />
            )}
          </button>
          <button
            onClick={handlePrint}
            disabled={!!busy}
            className="rounded p-1 text-zinc-400 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-40"
            title="Imprimir remito"
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
            className="flex h-8 items-center gap-1.5 rounded-sm border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            {busy === 'view' ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <FileText size={13} />
            )}
            Ver remito
          </button>
          <button
            onClick={handlePrint}
            disabled={!!busy}
            className="flex h-8 items-center gap-1.5 rounded-sm border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            {busy === 'print' ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Printer size={13} />
            )}
            Imprimir
          </button>
        </>
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
            className="shrink-0 rounded p-0.5 text-amber-600/70 hover:bg-amber-100 hover:text-amber-800"
          >
            <X size={13} />
          </button>
        </div>
      )}
    </>
  )
}
