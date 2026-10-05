import { useState } from 'react'
import { PageHeader } from '@/shared/components/ui'
import { AuditTabs, type AuditTabKey } from '../components/AuditTabs'
import { AuditEventsTab } from '../components/AuditEventsTab'
import { IntegrationIssuesTab } from '../components/IntegrationIssuesTab'
import { StockControlCorrectionsTab } from '../components/StockControlCorrectionsTab'
import { OrderPerformanceTab } from '../components/OrderPerformanceTab'

export function AuditsPage() {
  const [tab, setTab] = useState<AuditTabKey>('integrations')

  return (
    <div className="pb-8">
      <PageHeader
        title="Auditoría"
        description="Trazabilidad de operaciones: envíos pendientes a Aguas/Odoo, eventos del sistema, correcciones de controles y rendimiento de pedidos por usuario."
      />

      <AuditTabs active={tab} onChange={setTab} />

      {tab === 'integrations' && <IntegrationIssuesTab />}
      {tab === 'events' && <AuditEventsTab />}
      {tab === 'corrections' && <StockControlCorrectionsTab />}
      {tab === 'performance' && <OrderPerformanceTab />}
    </div>
  )
}
