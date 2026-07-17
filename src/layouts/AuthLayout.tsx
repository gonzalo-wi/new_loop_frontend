import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { ROUTES } from '@/shared/constants'

export function AuthLayout() {
  const { isAuthenticated } = useAuthStore()

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  return (
    <div className="flex min-h-screen bg-zinc-50">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-2/5 flex-col justify-between border-r border-zinc-200 bg-zinc-900 p-10">
        <div>
          <div className="flex items-center gap-2.5">
            <img src="/logoLoop.png" alt="LOOP" className="h-10 w-10 object-contain" />
            <span className="text-lg font-semibold text-white">LOOP</span>
          </div>
          <p className="mt-2 text-sm text-zinc-400 uppercase tracking-wider">
            Control operativo
          </p>
        </div>
        <div>
          <blockquote className="border-l-2 border-blue-600 pl-4">
            <p className="text-sm text-zinc-400 leading-relaxed">
              Sistema integrado de control de mercadería, stock, repartos y auditoría operativa.
            </p>
          </blockquote>
          <p className="mt-6 text-xs text-zinc-600">
            Acceso restringido al personal autorizado.
          </p>
        </div>
      </div>

      {/* Right panel — content */}
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
