import { ROUTES } from '@/shared/constants'
import type { UserRole } from '@/shared/types'

// Viewers only follow their plant's stock controls; the backend answers 403 anywhere else,
// so the panel keeps them on these pages instead of showing broken screens.
const VIEWER_PATHS: readonly string[] = [ROUTES.STOCK_ENTRIES, ROUTES.STOCK_EXITS]

/** Message shown when a role must not log into the panel at all, or null when it can. */
export function panelLoginError(role: UserRole): string | null {
  return role === 'clarkista'
    ? 'Este usuario es para la app móvil. Ingresá desde la tablet.'
    : null
}

/** Where a role lands after logging in. */
export function homePathFor(role: UserRole | undefined): string {
  return role === 'viewer' ? ROUTES.STOCK_EXITS : ROUTES.DASHBOARD
}

export function canAccessPath(role: UserRole | undefined, pathname: string): boolean {
  if (role !== 'viewer') return true
  return VIEWER_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}
