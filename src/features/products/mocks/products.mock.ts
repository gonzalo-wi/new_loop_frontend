import type { Product } from '../types'

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1', code: 'PRD-001', displayOrder: 1,
    name: 'Bidón 20L', description: 'Bidón plástico retornable de 20 litros',
    type: 'returnable', unit: 'unidad', status: 'active',
    createdAt: '2023-01-10T00:00:00Z', updatedAt: '2024-03-01T00:00:00Z',
  },
  {
    id: '2', code: 'PRD-002', displayOrder: 2,
    name: 'Botella 500ml', description: 'Botella PET 500ml descartable',
    type: 'disposable', unit: 'unidad', packQuantity: 12, status: 'active',
    createdAt: '2023-01-10T00:00:00Z', updatedAt: '2024-03-01T00:00:00Z',
  },
  {
    id: '3', code: 'PRD-003', displayOrder: 3,
    name: 'Bidón 12L', description: 'Bidón plástico retornable de 12 litros',
    type: 'returnable', unit: 'unidad', status: 'active',
    createdAt: '2023-02-15T00:00:00Z', updatedAt: '2024-02-10T00:00:00Z',
  },
  {
    id: '4', code: 'PRD-004', displayOrder: 4,
    name: 'Tapón estándar', description: 'Tapón de rosca para bidón',
    type: 'returnable', unit: 'unidad', packQuantity: 100, status: 'active',
    createdAt: '2023-01-10T00:00:00Z', updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: '5', code: 'PRD-005', displayOrder: 5,
    name: 'Caja cartón 6u', description: 'Caja de cartón para 6 botellas 500ml',
    type: 'disposable', unit: 'unidad', packQuantity: 6, status: 'active',
    createdAt: '2023-03-01T00:00:00Z', updatedAt: '2024-04-20T00:00:00Z',
  },
  {
    id: '6', code: 'PRD-006', displayOrder: 6,
    name: 'Paleta madera', description: 'Paleta estándar de madera 1.2x1m',
    type: 'returnable', unit: 'unidad', status: 'active',
    createdAt: '2023-04-01T00:00:00Z', updatedAt: '2024-03-15T00:00:00Z',
  },
  {
    id: '7', code: 'PRD-007', displayOrder: 7,
    name: 'Film stretch', description: 'Rollo de film para paletizado',
    type: 'disposable', unit: 'rollo', packQuantity: 4, status: 'inactive',
    createdAt: '2023-05-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '8', code: 'PRD-008', displayOrder: 8,
    name: 'Bidón 5L', description: 'Bidón pequeño de 5 litros retornable',
    type: 'returnable', unit: 'unidad', status: 'active',
    createdAt: '2023-06-01T00:00:00Z', updatedAt: '2024-05-01T00:00:00Z',
  },
]
