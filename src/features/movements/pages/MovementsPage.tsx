import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchMovements } from '../services/movements.service'
import type { Movement, MovementType } from '../types'
import {
  PageHeader,
  ActionBar,
  SearchInput,
  FilterBar,
  DataTable,
  StatusBadge,
} from '@/shared/components/ui'
import type { TableColumn } from '@/shared/types'
import { formatDateTime } from '@/shared/lib/utils'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { cn } from '@/shared/lib/utils'

const TYPE_LABELS: Record<MovementType, string> = {
  entry:      'Entrada',
  exit:       'Salida',
  transfer:   'Transferencia',
  adjustment: 'Ajuste',
}

const TYPE_STYLE: Record<MovementType, string> = {
  entry:      'text-emerald-700 bg-emerald-50 border-emerald-200',
  exit:       'text-red-600 bg-red-50 border-red-200',
  transfer:   'text-blue-700 bg-blue-50 border-blue-200',
  adjustment: 'text-amber-700 bg-amber-50 border-amber-200',
}

export function MovementsPage() {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({ type: '', status: '' })

  const debouncedSearch = useDebounce(search)

  const { data: movements = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['movements'],
    queryFn: fetchMovements,
  })

  const filtered = movements.filter((m) => {
    const matchesSearch =
      !debouncedSearch ||
      m.code.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      m.productName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (m.fromBranchName ?? '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (m.toBranchName ?? '').toLowerCase().includes(debouncedSearch.toLowerCase())
    const matchesType = !filters.type || m.type === filters.type
    const matchesStatus = !filters.status || m.status === filters.status
    return matchesSearch && matchesType && matchesStatus
  })

  const columns: TableColumn<Movement>[] = [
    {
      key: 'code',
      header: 'Código',
      width: '140px',
      render: (m) => (
        <span className="font-mono text-xs font-medium text-zinc-700">{m.code}</span>
      ),
    },
    {
      key: 'type',
      header: 'Tipo',
      width: '110px',
      render: (m) => (
        <span
          className={cn(
            'inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
            TYPE_STYLE[m.type]
          )}
        >
          {TYPE_LABELS[m.type]}
        </span>
      ),
    },
    {
      key: 'product',
      header: 'Producto',
      render: (m) => (
        <div>
          <p className="text-sm font-medium text-zinc-900">{m.productName}</p>
          <p className="text-[10px] font-mono text-zinc-400">{m.productCode}</p>
        </div>
      ),
    },
    {
      key: 'route',
      header: 'Origen → Destino',
      render: (m) => (
        <div className="text-xs text-zinc-600">
          {m.fromBranchName && <span>{m.fromBranchName}</span>}
          {m.fromBranchName && m.toBranchName && (
            <span className="mx-1 text-zinc-300">→</span>
          )}
          {m.toBranchName && <span>{m.toBranchName}</span>}
          {!m.fromBranchName && !m.toBranchName && (
            <span className="text-zinc-300">—</span>
          )}
        </div>
      ),
    },
    {
      key: 'quantities',
      header: 'Cantidades',
      align: 'right',
      width: '120px',
      render: (m) => (
        <div className="text-right text-xs tabular-nums text-zinc-600 space-y-0.5">
          {m.quantityFull !== 0 && (
            <p>
              <span className={cn('font-medium', m.quantityFull < 0 ? 'text-red-500' : 'text-zinc-900')}>
                {m.quantityFull > 0 ? '+' : ''}{m.quantityFull}
              </span>
              {' '}llenos
            </p>
          )}
          {m.quantityEmpty !== 0 && <p><span className="font-medium">{m.quantityEmpty}</span> vacíos</p>}
          {m.quantityReplacement !== 0 && <p><span className="font-medium">{m.quantityReplacement}</span> recambios</p>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      width: '100px',
      render: (m) => <StatusBadge status={m.status} />,
    },
    {
      key: 'operator',
      header: 'Operador',
      width: '130px',
      render: (m) => <span className="text-xs text-zinc-500">{m.operatorName}</span>,
    },
    {
      key: 'createdAt',
      header: 'Fecha',
      width: '130px',
      render: (m) => <span className="text-xs text-zinc-400">{formatDateTime(m.createdAt)}</span>,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Movimientos"
        description="Registro de entradas, salidas, transferencias y ajustes de stock."
      />

      <ActionBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por código, producto o sucursal..."
          className="w-72"
        />
        <FilterBar
          filters={[
            {
              key: 'type',
              label: 'Tipo',
              options: Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label })),
            },
            {
              key: 'status',
              label: 'Estado',
              options: [
                { value: 'pending',     label: 'Pendiente' },
                { value: 'in_progress', label: 'En proceso' },
                { value: 'completed',   label: 'Completado' },
                { value: 'delayed',     label: 'Demorado' },
                { value: 'cancelled',   label: 'Cancelado' },
              ],
            },
          ]}
          activeFilters={filters}
          onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
          onClearAll={() => setFilters({ type: '', status: '' })}
        />
        <span className="ml-auto text-xs text-zinc-400">
          {filtered.length} movimiento{filtered.length !== 1 ? 's' : ''}
        </span>
      </ActionBar>

      <div className="border-b border-zinc-200">
        <DataTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          getRowKey={(m) => m.id}
          emptyTitle="Sin movimientos"
          emptyDescription="No hay movimientos que coincidan con los filtros."
          rowClassName={(m) =>
            m.status === 'delayed' ? 'border-l-2 border-l-red-400' : undefined
          }
        />
      </div>
    </div>
  )
}
