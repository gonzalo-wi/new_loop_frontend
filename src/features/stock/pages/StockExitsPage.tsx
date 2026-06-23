import { ArrowUpFromLine } from 'lucide-react'
import { PageHeader, EmptyState, ActionButton, ActionBar } from '@/shared/components/ui'
import { Plus } from 'lucide-react'

export function StockExitsPage() {
  return (
    <div>
      <PageHeader
        title="Salidas de stock"
        description="Registro de egresos de mercadería del sistema."
        actions={
          <ActionButton variant="primary" icon={<Plus size={14} />}>
            Nueva salida
          </ActionButton>
        }
      />
      <ActionBar />
      <EmptyState
        icon={ArrowUpFromLine}
        title="Módulo en desarrollo"
        description="Las salidas de stock estarán disponibles próximamente."
        className="py-24"
      />
    </div>
  )
}
