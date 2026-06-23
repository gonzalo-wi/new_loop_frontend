import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchStock } from '../services/stock.service'
import type { StockEntry } from '../types'
import {
  PageHeader,
  ActionBar,
  SearchInput,
  FilterBar,
  DataTable,
  SectionHeader,
} from '@/shared/components/ui'
import type { TableColumn } from '@/shared/types'
import { formatDateTime } from '@/shared/lib/utils'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { cn } from '@/shared/lib/utils'

function QuantityCell({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-end">
      <span className={cn('tabular-nums font-medium', value === 0 ? 'text-zinc-300' : 'text-zinc-900')}>
        {value.toLocaleString('es-AR')}
      </span>
      <span className="text-[10px] text-zinc-400 uppercase tracking-wide">{label}</span>
    </div>
  )
}

export function StockPage() {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({
    branchId: '',
    productType: '',
  })

  const debouncedSearch = useDebounce(search)

  const { data: stock = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['stock'],
    queryFn: fetchStock,
  })

  const branches = [...new Set(stock.map((s) => s.branchName))].map((name) => ({
    value: stock.find((s) => s.branchName === name)?.branchId ?? '',
    label: name,
  }))

  const filtered = stock.filter((s) => {
    const matchesSearch =
      !debouncedSearch ||
      s.productName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      s.productCode.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      s.branchName.toLowerCase().includes(debouncedSearch.toLowerCase())
    const matchesBranch = !filters.branchId || s.branchId === filters.branchId
    const matchesType = !filters.productType || s.productType === filters.productType
    return matchesSearch && matchesBranch && matchesType
  })

  // Totals
  const totalFull = filtered.reduce((acc, s) => acc + s.quantityFull, 0)
  const totalEmpty = filtered.reduce((acc, s) => acc + s.quantityEmpty, 0)
  const totalReplacement = filtered.reduce((acc, s) => acc + s.quantityReplacement, 0)

  const columns: TableColumn<StockEntry>[] = [
    {
      key: 'product',
      header: 'Producto',
      render: (s) => (
        <div>
          <p className="font-medium text-zinc-900">{s.productName}</p>
          <p className="text-[10px] font-mono text-zinc-400">{s.productCode}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Tipo',
      width: '110px',
      render: (s) => (
        <span
          className={cn(
            'text-[10px] font-medium uppercase tracking-wide rounded-sm px-1.5 py-0.5 border',
            s.productType === 'returnable'
              ? 'text-blue-700 bg-blue-50 border-blue-200'
              : 'text-zinc-600 bg-zinc-100 border-zinc-200'
          )}
        >
          {s.productType === 'returnable' ? 'Retornable' : 'Descartable'}
        </span>
      ),
    },
    {
      key: 'branch',
      header: 'Sucursal',
      render: (s) => (
        <div>
          <p className="text-sm text-zinc-800">{s.branchName}</p>
          <p className="text-[10px] font-mono text-zinc-400">{s.branchCode}</p>
        </div>
      ),
    },
    {
      key: 'quantityFull',
      header: 'Llenos',
      align: 'right',
      width: '90px',
      render: (s) => <QuantityCell value={s.quantityFull} label="llenos" />,
    },
    {
      key: 'quantityEmpty',
      header: 'Vacíos',
      align: 'right',
      width: '90px',
      render: (s) => <QuantityCell value={s.quantityEmpty} label="vacíos" />,
    },
    {
      key: 'quantityReplacement',
      header: 'Recambios',
      align: 'right',
      width: '90px',
      render: (s) => <QuantityCell value={s.quantityReplacement} label="recambios" />,
    },
    {
      key: 'lastMovement',
      header: 'Últ. movimiento',
      width: '140px',
      render: (s) => (
        <span className="text-xs text-zinc-400">{formatDateTime(s.lastMovementAt)}</span>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Stock"
        description="Estado actual del inventario por producto y sucursal."
      />

      {/* Summary bar */}
      <div className="border-b border-zinc-200 bg-white px-6 py-3">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Total llenos</p>
            <p className="text-lg font-semibold text-zinc-900 tabular-nums">
              {totalFull.toLocaleString('es-AR')}
            </p>
          </div>
          <div className="h-8 w-px bg-zinc-200" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Total vacíos</p>
            <p className="text-lg font-semibold text-zinc-900 tabular-nums">
              {totalEmpty.toLocaleString('es-AR')}
            </p>
          </div>
          <div className="h-8 w-px bg-zinc-200" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Recambios</p>
            <p className="text-lg font-semibold text-zinc-900 tabular-nums">
              {totalReplacement.toLocaleString('es-AR')}
            </p>
          </div>
          <div className="ml-auto">
            <SectionHeader
              title={`${filtered.length} registro${filtered.length !== 1 ? 's' : ''}`}
            />
          </div>
        </div>
      </div>

      <ActionBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar producto o sucursal..."
          className="w-60"
        />
        <FilterBar
          filters={[
            { key: 'branchId', label: 'Sucursal', options: branches },
            {
              key: 'productType',
              label: 'Tipo',
              options: [
                { value: 'returnable', label: 'Retornable' },
                { value: 'disposable', label: 'Descartable' },
              ],
            },
          ]}
          activeFilters={filters}
          onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
          onClearAll={() => setFilters({ branchId: '', productType: '' })}
        />
      </ActionBar>

      <div className="border-b border-zinc-200">
        <DataTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          getRowKey={(s) => s.id}
          emptyTitle="Sin registros de stock"
          emptyDescription="No hay entradas de stock que coincidan con los filtros aplicados."
        />
      </div>
    </div>
  )
}
