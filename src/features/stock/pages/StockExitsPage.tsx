import { StockControlsPage } from '../components/StockControlsPage'

export function StockExitsPage() {
  return (
    <StockControlsPage
      type="EXIT"
      title="Controles de salida"
      description="Registro de egresos de mercadería por reparto."
      createLabel="Nueva salida"
    />
  )
}
