import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { fetchRemitosPdf, markRemitosPrinted } from '../services/stock-controls.service'

const BLOB_TTL_MS = 60_000

/** Prints several remitos through one print dialog, then marks them all printed. */
export function useRemitoBatchPrint() {
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function markPrinted(ids: string[]) {
    try {
      await markRemitosPrinted(ids)
      await queryClient.invalidateQueries({ queryKey: ['stock-controls'] })
    } catch (err) {
      setError(
        `Los remitos se mandaron a imprimir pero no se pudieron marcar como impresos. ${
          err instanceof Error ? err.message : ''
        }`.trim()
      )
    }
  }

  /** `onPrinted` runs once the dialog opened and the remitos were marked. */
  async function print(ids: string[], onPrinted?: () => void) {
    if (busy || ids.length === 0) return
    setBusy(true)
    setError(null)

    let blob: Blob
    try {
      blob = await fetchRemitosPdf(ids)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron obtener los remitos.')
      setBusy(false)
      return
    }

    const url = URL.createObjectURL(blob)
    // Same as single printing: a hidden iframe avoids the popup blocker.
    const frame = document.createElement('iframe')
    frame.style.display = 'none'
    frame.src = url
    // Busy lasts until the remitos are marked: a large PDF takes seconds to load, and a second click
    // meanwhile would print the whole batch again without the reprint confirmation.
    let settled = false
    const settle = () => {
      if (settled) return
      settled = true
      setBusy(false)
    }
    frame.onload = () => {
      // The browser can't tell whether the paper came out, so opening the print dialog counts as printed.
      void markPrinted(ids).then(() => {
        onPrinted?.()
        settle()
      })
      frame.contentWindow?.focus()
      frame.contentWindow?.print()
    }
    document.body.appendChild(frame)
    setTimeout(() => {
      URL.revokeObjectURL(url)
      frame.remove()
      // The PDF never loaded: free the button so the operator can try again.
      settle()
    }, BLOB_TTL_MS)
  }

  return { print, busy, error, clearError: () => setError(null) }
}
