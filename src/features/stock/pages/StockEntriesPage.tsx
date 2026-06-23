import { ArrowDownToLine } from 'lucide-react'
import { PageHeader, EmptyState, ActionButton, ActionBar } from '@/shared/components/ui'
import { Plus } from 'lucide-react'

export function StockEntriesPage() {
  return (
    <div>
      <PageHeader
        title="Entradas de stock"
        description="Registro de ingresos de mercadería al sistema."
        actions={
          <ActionButton variant="primary" icon={<Plus size={14} />}>
            Nueva entrada
          </ActionButton>
        }
      />
      <ActionBar />
      <EmptyState
        icon={ArrowDownToLine}
        title="Módulo en desarrollo"
        description="Las entradas de stock estarán disponibles próximamente."
        className="py-24"
      />
    </div>
  )
}
