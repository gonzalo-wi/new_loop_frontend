import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useSessionExpiry } from '@/features/auth/hooks/useSessionExpiry'
import { canAccessPath, homePathFor } from '@/features/auth/lib/panelAccess'
import { ROUTES } from '@/shared/constants'

export function AdminLayout() {
  const { isAuthenticated, user } = useAuthStore()
  const { pathname } = useLocation()
  useSessionExpiry()

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  if (!canAccessPath(user?.role, pathname)) {
    return <Navigate to={homePathFor(user?.role)} replace />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
