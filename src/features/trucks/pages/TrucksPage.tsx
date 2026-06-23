import { Truck } from 'lucide-react'
import { PageHeader, EmptyState, ActionButton, ActionBar } from '@/shared/components/ui'
import { Plus } from 'lucide-react'

export function TrucksPage() {
  return (
    <div>
      <PageHeader
        title="Unidades"
        description="Flota de camiones y vehículos operativos."
        actions={
          <ActionButton variant="primary" icon={<Plus size={14} />}>
            Nueva unidad
          </ActionButton>
        }
      />
      <ActionBar />
      <EmptyState
        icon={Truck}
        title="Módulo en desarrollo"
        description="La gestión de unidades estará disponible próximamente."
        className="py-24"
      />
    </div>
  )
}
