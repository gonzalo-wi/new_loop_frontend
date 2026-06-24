import type { Delivery } from '../types'

export const MOCK_DELIVERIES: Delivery[] = [
  {
    id: '1', code: 'REP-001',
    branchId: 'b1', branchName: 'Ciudadela', branchCode: 'CIU',
    driver: 'Miguel Torres', truckPlate: 'ABC 123',
    status: 'active', observations: 'Reparto zona norte',
    createdAt: '2024-06-01T08:00:00', updatedAt: '2024-06-20T09:00:00',
  },
  {
    id: '2', code: 'REP-002',
    branchId: 'b2', branchName: 'Palermo', branchCode: 'PAL',
    driver: 'Fernando Díaz', truckPlate: 'XYZ 999',
    status: 'active', observations: undefined,
    createdAt: '2024-06-05T08:00:00', updatedAt: '2024-06-21T10:00:00',
  },
  {
    id: '3', code: 'REP-003',
    branchId: 'b1', branchName: 'Ciudadela', branchCode: 'CIU',
    driver: 'Roberto Sánchez', truckPlate: 'DEF 456',
    status: 'active', observations: 'Solo entregas por la tarde',
    createdAt: '2024-06-10T08:00:00', updatedAt: '2024-06-22T11:00:00',
  },
  {
    id: '4', code: 'REP-004',
    branchId: 'b3', branchName: 'Lanús', branchCode: 'LAN',
    driver: undefined, truckPlate: undefined,
    status: 'inactive', observations: 'Reparto suspendido',
    createdAt: '2024-05-01T08:00:00', updatedAt: '2024-06-01T08:00:00',
  },
]
