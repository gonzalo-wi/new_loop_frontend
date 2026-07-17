import { useEffect, useState } from 'react'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

// 'no-key' is a first-class state (not an error): a build without the Maps key
// still works, it just falls back to a link-out instead of an embedded map.
export type GoogleMapsStatus = 'loading' | 'ready' | 'error' | 'no-key'

// The Maps script must be injected exactly once per page; this promise is shared
// across every hook instance so remounting the modal never re-injects it.
let loadPromise: Promise<void> | null = null

function loadScript(): Promise<void> {
  if (window.google?.maps) return Promise.resolve()
  if (loadPromise) return loadPromise

  loadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&v=weekly`
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => {
      // Reset so a later retry can attempt a fresh injection.
      loadPromise = null
      reject(new Error('Failed to load Google Maps script'))
    }
    document.head.appendChild(script)
  })

  return loadPromise
}

export function useGoogleMaps(): GoogleMapsStatus {
  const [status, setStatus] = useState<GoogleMapsStatus>(() => {
    if (window.google?.maps) return 'ready'
    return API_KEY ? 'loading' : 'no-key'
  })

  useEffect(() => {
    if (status !== 'loading') return

    let active = true
    loadScript().then(
      () => active && setStatus('ready'),
      () => active && setStatus('error')
    )
    return () => {
      active = false
    }
  }, [status])

  return status
}
