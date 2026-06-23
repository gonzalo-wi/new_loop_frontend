import { Route } from 'lucide-react'
import { PageHeader, EmptyState, ActionButton, ActionBar } from '@/shared/components/ui'
import { Plus } from 'lucide-react'

export function DeliveriesPage() {
  return (
    <div>
      <PageHeader
        title="Repartos"
        description="Planificación y seguimiento de repartos."
        actions={
          <ActionButton variant="primary" icon={<Plus size={14} />}>
            Nuevo reparto
          </ActionButton>
        }
      />
      <ActionBar />
      <EmptyState
        icon={Route}
        title="Módulo en desarrollo"
        description="La pantalla de repartos estará disponible próximamente."
        className="py-24"
      />
    </div>
  )
}
