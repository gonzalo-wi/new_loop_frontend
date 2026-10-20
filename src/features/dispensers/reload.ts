import type { DispenserMovement } from './types'

// "Recarga": a route can get several loads (LOAD) for the same date, the first one plus recargas.
// Only the day's last load can be cancelled or corrected; the backend answers 409 for the rest.

export const LATER_RELOAD_MESSAGE =
  'Tiene una recarga posterior: solo se puede cancelar o corregir la última carga del día.'

/** True when another active load of the same route and date was registered after this one. */
export function hasLaterLoad(movement: DispenserMovement, movements: DispenserMovement[]): boolean {
  if (movement.type !== 'LOAD' || movement.status === 'CANCELLED') return false
  const createdAt = Date.parse(movement.createdAt)
  return movements.some(
    (other) =>
      other.id !== movement.id &&
      other.type === 'LOAD' &&
      other.status !== 'CANCELLED' &&
      other.routeCode.trim() === movement.routeCode.trim() &&
      other.movementDate === movement.movementDate &&
      Date.parse(other.createdAt) > createdAt,
  )
}
