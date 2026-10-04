import { useCallback, useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { RouteScene } from '@/features/auth/components/RouteScene'
import { ROUTES } from '@/shared/constants'

const DEPART_MS = 850

export type AuthOutletContext = {
  // Plays the truck "departure" animation, then runs `done` (sign-in + redirect).
  depart: (done: () => void) => void
}

export function AuthLayout() {
  const { isAuthenticated } = useAuthStore()
  const [departing, setDeparting] = useState(false)

  const depart = useCallback((done: () => void) => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches
    if (reduceMotion || !isDesktop) {
      done()
      return
    }
    setDeparting(true)
    window.setTimeout(done, DEPART_MS)
  }, [])

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Scene */}
      <div className="relative hidden flex-1 overflow-hidden bg-zinc-950 lg:block">
        <RouteScene departing={departing} />

        <div className="pointer-events-none absolute left-8 top-8 flex items-center gap-3">
          <img src="/logoLoop.png" alt="LOOP" className="h-10 w-10 object-contain" />
          <div className="leading-none">
            <p className="text-lg font-bold tracking-tight text-white">LOOP</p>
            <p className="mt-1 text-xs text-zinc-500">Mercadería · Stock · Repartos</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex w-full flex-col justify-between px-6 py-8 lg:w-[480px] lg:shrink-0 lg:px-14">
        <div />
        <div className="mx-auto w-full max-w-sm">
          <Outlet context={{ depart } satisfies AuthOutletContext} />
        </div>
        <p className="text-center text-xs text-zinc-400">
          Acceso restringido al personal autorizado · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
