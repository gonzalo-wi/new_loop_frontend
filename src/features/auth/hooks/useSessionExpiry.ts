import { useEffect } from 'react'
import { isExpired } from '../lib/sessionExpiry'
import { useAuthStore } from '../store/auth.store'

// Well under the one minute allowed; a single timer at `exp` is unreliable in background tabs.
const CHECK_EVERY_MS = 30_000

/** While mounted, ends the session once its token expires: on a timer and when the tab is shown again. */
export function useSessionExpiry() {
  const token = useAuthStore((s) => s.token)
  const expireSession = useAuthStore((s) => s.expireSession)

  useEffect(() => {
    if (!token) return
    const check = () => {
      if (isExpired(token, Date.now())) expireSession()
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') check()
    }
    check()
    const timer = window.setInterval(check, CHECK_EVERY_MS)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [token, expireSession])
}
