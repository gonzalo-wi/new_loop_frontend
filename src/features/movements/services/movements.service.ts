import type { Movement } from '../types'
import { MOCK_MOVEMENTS } from '../mocks/movements.mock'

const store = [...MOCK_MOVEMENTS]

export async function fetchMovements(): Promise<Movement[]> {
  await new Promise((r) => setTimeout(r, 400))
  return [...store].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function fetchMovementById(id: string): Promise<Movement> {
  await new Promise((r) => setTimeout(r, 200))
  const m = store.find((m) => m.id === id)
  if (!m) throw new Error('Movimiento no encontrado')
  return { ...m }
}
