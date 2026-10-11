import type { DispenserMovementType } from './types'

// "Embolsado": an unload serial that came back still bagged (a new dispenser the driver could not deliver),
// so the plant can skip repair for it. Marked from the mobile app; the backend matches serials ignoring case.

export function isBagged(serial: string, baggedSerials: string[]): boolean {
  const target = serial.toUpperCase()
  return baggedSerials.some((s) => s.toUpperCase() === target)
}

/** Bagged serials to send on save: only on unloads, and only those still in the scanned list. */
export function baggedSerialsToSend(
  type: DispenserMovementType,
  serials: string[],
  baggedSerials: string[],
): string[] {
  if (type !== 'UNLOAD') return []
  return baggedSerials.filter((b) => isBagged(b, serials))
}
