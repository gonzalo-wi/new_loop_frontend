import { Truck } from 'lucide-react'
import { PageHeader, EmptyState, ActionButton, Panel } from '@/shared/components/ui'
import { Plus } from 'lucide-react'

export function TrucksPage() {
  return (
    <div className="pb-8">
      <PageHeader
        title="Unidades"
        description="Flota de camiones y vehículos operativos."
        actions={
          <ActionButton variant="primary" icon={<Plus size={14} />}>
            Nueva unidad
          </ActionButton>
        }
      />
      <Panel className="mx-6">
        <EmptyState
          icon={Truck}
          title="Módulo en desarrollo"
          description="La gestión de unidades estará disponible próximamente."
          className="py-24"
        />
      </Panel>
    </div>
  )
}
