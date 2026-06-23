import { Outlet, Navigate } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { ROUTES } from '@/shared/constants'

export function AdminLayout() {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
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
