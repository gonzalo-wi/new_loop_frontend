import type { DashboardMetrics, OperationalAlert } from '../types'
import { MOCK_MOVEMENTS } from '@/features/movements/mocks/movements.mock'

const M = 60_000
const H = 3_600_000

function ts(ms: number) { return new Date(Date.now() - ms).toISOString() }

export const MOCK_METRICS: DashboardMetrics = {
  totalMovementsToday: 6,
  pendingMovements: 1,
  delayedMovements: 1,
  activeDeliveries: 3,
  completedDeliveriesToday: 7,
  totalStockUnits: 14155,
  activeBranches: 5,
  activeProducts: 7,
}

export const MOCK_ALERTS: OperationalAlert[] = [
  {
    id: 'a1',
    type: 'error',
    title: 'Movimiento demorado',
    description: 'MOV-0546 lleva más de 72hs sin actualización. Salida de 150 bidones desde Depósito Sur.',
    entityType: 'movement',
    entityId: '6',
    createdAt: ts(74 * H),
  },
  {
    id: 'a2',
    type: 'warning',
    title: 'Entrada pendiente de verificación',
    description: 'MOV-0544 tiene 5.000 botellas en espera de control de calidad.',
    entityType: 'movement',
    entityId: '4',
    createdAt: ts(330 * M),
  },
  {
    id: 'a3',
    type: 'warning',
    title: 'Transferencia en tránsito',
    description: 'MOV-0543: 120 llenos + 45 vacíos de Bidón 12L hacia Sucursal Río Cuarto.',
    entityType: 'movement',
    entityId: '3',
    createdAt: ts(3 * H),
  },
]

export const MOCK_RECENT_MOVEMENTS = MOCK_MOVEMENTS.slice(0, 6)
