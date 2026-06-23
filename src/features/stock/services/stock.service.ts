import type { StockEntry } from '../types'
import { MOCK_STOCK } from '../mocks/stock.mock'

export async function fetchStock(): Promise<StockEntry[]> {
  await new Promise((r) => setTimeout(r, 400))
  return [...MOCK_STOCK]
}
