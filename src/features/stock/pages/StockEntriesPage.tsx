import { StockControlsPage } from '../components/StockControlsPage'

export function StockEntriesPage() {
  return (
    <StockControlsPage
      type="ENTRY"
      title="Controles de entrada"
      description="Registro de ingresos de mercadería por reparto."
      createLabel="Nueva entrada"
    />
  )
}
