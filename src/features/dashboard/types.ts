export type DashboardMetrics = {
  totalMovementsToday: number
  pendingMovements: number
  delayedMovements: number
  activeDeliveries: number
  completedDeliveriesToday: number
  totalStockUnits: number
  activeBranches: number
  activeProducts: number
}

export type OperationalAlert = {
  id: string
  type: 'warning' | 'error' | 'info'
  title: string
  description: string
  entityType: string
  entityId: string
  createdAt: string
}
