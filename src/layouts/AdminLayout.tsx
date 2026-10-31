import { Outlet, Navigate } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useSessionExpiry } from '@/features/auth/hooks/useSessionExpiry'
import { ROUTES } from '@/shared/constants'

export function AdminLayout() {
  const { isAuthenticated } = useAuthStore()
  useSessionExpiry()

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />
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
