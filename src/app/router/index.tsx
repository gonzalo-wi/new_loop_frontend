import { createBrowserRouter } from 'react-router-dom'
import { AdminLayout } from '@/layouts/AdminLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { BranchesPage } from '@/features/branches/pages/BranchesPage'
import { ProductsPage } from '@/features/products/pages/ProductsPage'
import { StockPage } from '@/features/stock/pages/StockPage'
import { StockEntriesPage } from '@/features/stock/pages/StockEntriesPage'
import { StockExitsPage } from '@/features/stock/pages/StockExitsPage'
import { MovementsPage } from '@/features/movements/pages/MovementsPage'
import { DeliveriesPage } from '@/features/deliveries/pages/DeliveriesPage'
import { TrucksPage } from '@/features/trucks/pages/TrucksPage'
import { AuditsPage } from '@/features/audits/pages/AuditsPage'
import { UsersPage } from '@/features/users/pages/UsersPage'
import { OrderableProductsPage } from '@/features/orderable-products/pages/OrderableProductsPage'
import { OrdersPage } from '@/features/orders/pages/OrdersPage'
import { DispenserMovementsPage } from '@/features/dispensers/pages/DispenserMovementsPage'
import { AppVersionPage } from '@/features/app-version/pages/AppVersionPage'
import { ROUTES } from '@/shared/constants'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AdminLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'branches', element: <BranchesPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'stock', element: <StockPage /> },
      { path: 'stock/entries', element: <StockEntriesPage /> },
      { path: 'stock/exits', element: <StockExitsPage /> },
      { path: 'movements', element: <MovementsPage /> },
      { path: 'deliveries', element: <DeliveriesPage /> },
      { path: 'trucks', element: <TrucksPage /> },
      { path: 'audits', element: <AuditsPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'orderable-products', element: <OrderableProductsPage /> },
      { path: 'orders',     element: <OrdersPage /> },
      { path: 'dispensers', element: <DispenserMovementsPage /> },
      { path: 'app-version', element: <AppVersionPage /> },
    ],
  },
  {
    path: ROUTES.LOGIN,
    element: <AuthLayout />,
    children: [{ index: true, element: <LoginPage /> }],
  },
])
