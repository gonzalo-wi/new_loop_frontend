import type { User } from '../types'

export const MOCK_USERS: User[] = [
  {
    id: '1', name: 'Admin Sistema',    username: 'admin',
    role: 'admin',          status: 'active',
    createdAt: '2023-01-01T00:00:00Z', updatedAt: '2024-06-23T07:50:00Z',
  },
  {
    id: '2', name: 'Carlos Supervisor', username: 'csupervisor',
    role: 'supervisor',     status: 'active',
    createdAt: '2023-02-10T00:00:00Z', updatedAt: '2024-06-23T06:45:00Z',
  },
  {
    id: '3', name: 'Ana Controlador',  username: 'acontrolador',
    role: 'controller',     status: 'active',
    createdAt: '2023-02-15T00:00:00Z', updatedAt: '2024-06-23T07:55:00Z',
  },
  {
    id: '4', name: 'Miguel Torres',    username: 'mtorres',
    role: 'delivery_driver', status: 'active',
    createdAt: '2023-03-01T00:00:00Z', updatedAt: '2024-06-22T06:30:00Z',
  },
  {
    id: '5', name: 'Roberto Sánchez', username: 'rsanchez',
    role: 'picker',          status: 'active',
    createdAt: '2023-04-05T00:00:00Z', updatedAt: '2024-06-22T07:00:00Z',
  },
  {
    id: '6', name: 'Luciana Gómez',   username: 'lgomez',
    role: 'loader',          status: 'active',
    createdAt: '2023-04-10T00:00:00Z', updatedAt: '2024-06-22T07:15:00Z',
  },
  {
    id: '7', name: 'Fernando Díaz',   username: 'fdiaz',
    role: 'delivery_driver', status: 'inactive',
    createdAt: '2023-05-20T00:00:00Z', updatedAt: '2024-05-10T08:00:00Z',
  },
]
