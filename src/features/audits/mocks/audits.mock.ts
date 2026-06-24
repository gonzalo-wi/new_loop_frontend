import type { AuditLog } from '../types'

const ts = (ms: number) => new Date(Date.now() - ms).toISOString().replace('Z', '')
const M = 60_000
const H = 3_600_000

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'a1b2c3d4-0000-0000-0000-000000000001',
    userId: null, userRole: null,
    action: 'CREATE_BRANCH', entityName: 'Branch',
    entityId: '550e8400-e29b-41d4-a716-446655440001',
    oldValue: null,
    newValue: '{"id":"550e8400...","name":"Ciudadela","code":"CIU","active":true}',
    reason: null, source: 'ADMIN_WEB', ipAddress: null,
    createdAt: ts(10 * M),
  },
  {
    id: 'a1b2c3d4-0000-0000-0000-000000000002',
    userId: null, userRole: null,
    action: 'CREATE_PRODUCT', entityName: 'Product',
    entityId: '660e8400-e29b-41d4-a716-446655440002',
    oldValue: null,
    newValue: '{"id":"660e8400...","name":"Soda 1.5","code":"SOD-001","active":true}',
    reason: null, source: 'ADMIN_WEB', ipAddress: null,
    createdAt: ts(30 * M),
  },
  {
    id: 'a1b2c3d4-0000-0000-0000-000000000003',
    userId: null, userRole: null,
    action: 'UPDATE_BRANCH', entityName: 'Branch',
    entityId: '550e8400-e29b-41d4-a716-446655440001',
    oldValue: '{"name":"Ciudadela","address":"Av. Principal 100"}',
    newValue: '{"name":"Ciudadela","address":"Av. Principal 200"}',
    reason: null, source: 'ADMIN_WEB', ipAddress: null,
    createdAt: ts(2 * H),
  },
  {
    id: 'a1b2c3d4-0000-0000-0000-000000000004',
    userId: null, userRole: null,
    action: 'DEACTIVATE_USER', entityName: 'User',
    entityId: '770e8400-e29b-41d4-a716-446655440004',
    oldValue: null, newValue: null,
    reason: null, source: 'ADMIN_WEB', ipAddress: null,
    createdAt: ts(5 * H),
  },
  {
    id: 'a1b2c3d4-0000-0000-0000-000000000005',
    userId: null, userRole: null,
    action: 'CREATE_USER', entityName: 'User',
    entityId: '880e8400-e29b-41d4-a716-446655440005',
    oldValue: null,
    newValue: '{"id":"880e8400...","name":"Juan Pérez","username":"jperez","role":"REPARTIDOR"}',
    reason: null, source: 'ADMIN_WEB', ipAddress: null,
    createdAt: ts(26 * H),
  },
]
