import { Outlet, Navigate } from 'react-router-dom'
import { Package, Truck, ClipboardCheck } from 'lucide-react'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { ROUTES } from '@/shared/constants'

const highlights = [
  { icon: Package, label: 'Control de stock en tiempo real' },
  { icon: Truck, label: 'Seguimiento de repartos y camiones' },
  { icon: ClipboardCheck, label: 'Trazabilidad y auditoría completa' },
]

export function AuthLayout() {
  const { isAuthenticated } = useAuthStore()

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  return (
    <div className="flex min-h-screen bg-zinc-50">
      {/* Left panel — branding */}
      <div className="relative hidden lg:flex lg:w-2/5 flex-col justify-between overflow-hidden border-r border-zinc-200 bg-zinc-900 p-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative">
          <div className="flex items-center gap-2.5">
            <img src="/logoLoop.png" alt="LOOP" className="h-10 w-10 object-contain" />
            <span className="text-lg font-semibold text-white">LOOP</span>
          </div>
          <p className="mt-2 text-xs font-medium uppercase tracking-widest text-zinc-500">
            Control operativo
          </p>
        </div>

        <div className="relative space-y-8">
          <ul className="space-y-4">
            {highlights.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-zinc-700 bg-zinc-800/80">
                  <Icon size={15} className="text-zinc-300" />
                </span>
                <span className="text-sm text-zinc-300">{label}</span>
              </li>
            ))}
          </ul>

          <blockquote className="border-l-2 border-blue-600 pl-4">
            <p className="text-sm text-zinc-400 leading-relaxed">
              Sistema integrado de control de mercadería, stock, repartos y auditoría operativa.
            </p>
          </blockquote>

          <p className="text-xs text-zinc-600">Acceso restringido al personal autorizado.</p>
        </div>
      </div>

      {/* Right panel — content */}
      <div className="flex flex-1 flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-md border border-zinc-200 bg-white p-8 shadow-sm">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
