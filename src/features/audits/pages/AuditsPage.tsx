import { useState } from 'react'
import { PageHeader } from '@/shared/components/ui'
import { AuditTabs, type AuditTabKey } from '../components/AuditTabs'
import { AuditEventsTab } from '../components/AuditEventsTab'
import { StockControlCorrectionsTab } from '../components/StockControlCorrectionsTab'
import { OrderPerformanceTab } from '../components/OrderPerformanceTab'

export function AuditsPage() {
  const [tab, setTab] = useState<AuditTabKey>('events')

  return (
    <div>
      <PageHeader
        title="Auditoría"
        description="Trazabilidad de operaciones: eventos del sistema, correcciones de controles y rendimiento de pedidos por usuario."
      />

      <AuditTabs active={tab} onChange={setTab} />

      {tab === 'events' && <AuditEventsTab />}
      {tab === 'corrections' && <StockControlCorrectionsTab />}
      {tab === 'performance' && <OrderPerformanceTab />}
    </div>
  )
}
