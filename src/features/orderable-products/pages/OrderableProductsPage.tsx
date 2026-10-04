import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Power, PowerOff, ShoppingBasket, Boxes, Package2, Check, X as XIcon } from 'lucide-react'
import {
  fetchOrderableProducts,
  activateOrderableProduct,
  deactivateOrderableProduct,
} from '../services/orderable-products.service'
import type { OrderableProduct } from '../types'
import { OrderableProductFormModal } from '../components/OrderableProductFormModal'
import {
  PageHeader,
  ActionBar,
  ActionButton,
  SearchInput,
  FilterBar,
  DataTable,
  StatusBadge,
  ConfirmDialog,
  MetricBlock,
  Panel,
} from '@/shared/components/ui'
import type { TableColumn } from '@/shared/types'
import { formatDate } from '@/shared/lib/utils'
import { useDebounce } from '@/shared/hooks/useDebounce'

type ConfirmTarget = { product: OrderableProduct; action: 'activate' | 'deactivate' }

const STATUS_FILTER = [
  { value: 'active',   label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
]

function YesNo({ value }: { value: boolean }) {
  return value ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
      <Check size={12} /> Sí
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs text-zinc-300">
      <XIcon size={12} /> No
    </span>
  )
}

export function OrderableProductsPage() {
  const queryClient = useQueryClient()

  const [search, setSearch]           = useState('')
  const [filters, setFilters]         = useState<Record<string, string>>({ status: '' })
  const [selectedProduct, setSelected] = useState<OrderableProduct | null>(null)
  const [showForm, setShowForm]       = useState(false)
  const [confirmTarget, setConfirm]   = useState<ConfirmTarget | null>(null)

  const debouncedSearch = useDebounce(search)

  const { data: products = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['orderable-products'],
    queryFn:  fetchOrderableProducts,
  })

  const activeCount = products.filter((p) => p.status === 'active').length
  const bulkCount    = products.filter((p) => p.allowsBulk).length

  const filtered = products.filter((p) => {
    const matchStatus = !filters.status || p.status === filters.status
    const matchSearch =
      !debouncedSearch ||
      p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      p.code.toLowerCase().includes(debouncedSearch.toLowerCase())
    return matchStatus && matchSearch
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['orderable-products'] })

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivateOrderableProduct(id),
    onSuccess: () => { invalidate(); setConfirm(null) },
  })

  const activateMutation = useMutation({
    mutationFn: (id: string) => activateOrderableProduct(id),
    onSuccess: () => { invalidate(); setConfirm(null) },
  })

  function handleFormSuccess() {
    invalidate()
    setShowForm(false)
    setSelected(null)
  }

  const columns: TableColumn<OrderableProduct>[] = [
    {
      key: 'code',
      header: 'Código',
      width: '120px',
      render: (p) => (
        <span className="font-mono text-xs font-medium text-zinc-600">{p.code}</span>
      ),
    },
    {
      key: 'name',
      header: 'Nombre',
      render: (p) => (
        <div>
          <p className="text-sm font-medium text-zinc-900">{p.name}</p>
          {p.description && (
            <p className="mt-0.5 max-w-xs truncate text-xs text-zinc-400">{p.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'allowsUnit',
      header: 'Por unidad',
      width: '100px',
      align: 'center',
      render: (p) => <YesNo value={p.allowsUnit} />,
    },
    {
      key: 'allowsBulk',
      header: 'Por bulto',
      width: '100px',
      align: 'center',
      render: (p) => <YesNo value={p.allowsBulk} />,
    },
    {
      key: 'unitsPerBulk',
      header: 'U/bulto',
      width: '80px',
      align: 'center',
      render: (p) => (
        <span className="font-mono text-xs text-zinc-500">{p.unitsPerBulk ?? '—'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      width: '90px',
      render: (p) => <StatusBadge status={p.status} />,
    },
    {
      key: 'updatedAt',
      header: 'Actualizado',
      width: '120px',
      render: (p) => <span className="text-xs text-zinc-400">{formatDate(p.updatedAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '80px',
      render: (p) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setSelected(p)
              setShowForm(true)
            }}
            className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            title="Editar"
          >
            <Pencil size={13} />
          </button>
          {p.status === 'active' ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setConfirm({ product: p, action: 'deactivate' })
              }}
              className="rounded-md p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600"
              title="Desactivar"
            >
              <PowerOff size={13} />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setConfirm({ product: p, action: 'activate' })
              }}
              className="rounded-md p-1 text-zinc-400 hover:bg-emerald-50 hover:text-emerald-600"
              title="Activar"
            >
              <Power size={13} />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="pb-8">
      <PageHeader
        title="Productos pedibles"
        description="Catálogo de productos que los repartidores pueden pedir."
        actions={
          <ActionButton
            variant="primary"
            icon={<Plus size={14} />}
            onClick={() => { setSelected(null); setShowForm(true) }}
          >
            Nuevo producto
          </ActionButton>
        }
      />

      <div className="grid grid-cols-3 gap-4 px-6">
        <MetricBlock
          label="Pedibles activos"
          icon={ShoppingBasket}
          accent={activeCount > 0 ? 'green' : 'default'}
          value={activeCount}
          note={`de ${products.length} en total`}
        />
        <MetricBlock
          label="Habilitados por bulto"
          icon={Boxes}
          accent="blue"
          value={bulkCount}
        />
        <MetricBlock
          label="Solo por unidad"
          icon={Package2}
          accent="default"
          value={products.length - bulkCount}
        />
      </div>

      <Panel className="mx-6 mt-5">
        <ActionBar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por código o nombre..."
            className="w-64"
          />
          <FilterBar
            filters={[{ key: 'status', label: 'Estado', options: STATUS_FILTER }]}
            activeFilters={filters}
            onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
            onClearAll={() => setFilters({ status: '' })}
          />
          <span className="ml-auto text-xs text-zinc-400">
            {filtered.length} producto{filtered.length !== 1 ? 's' : ''}
          </span>
        </ActionBar>

        <div>
          <DataTable
            columns={columns}
            data={filtered}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
            getRowKey={(p) => p.id}
            emptyTitle="Sin productos pedibles"
            emptyDescription="No hay productos que coincidan con los filtros."
            emptyAction={
              !debouncedSearch && !filters.status ? (
                <ActionButton
                  variant="primary"
                  size="sm"
                  icon={<Plus size={13} />}
                  onClick={() => { setSelected(null); setShowForm(true) }}
                >
                  Nuevo producto
                </ActionButton>
              ) : undefined
            }
          />
        </div>
      </Panel>

      {showForm && (
        <OrderableProductFormModal
          product={selectedProduct}
          onClose={() => { setShowForm(false); setSelected(null) }}
          onSuccess={handleFormSuccess}
        />
      )}

      <ConfirmDialog
        open={!!confirmTarget}
        onClose={() => setConfirm(null)}
        onConfirm={() =>
          confirmTarget?.action === 'deactivate'
            ? deactivateMutation.mutate(confirmTarget.product.id)
            : confirmTarget && activateMutation.mutate(confirmTarget.product.id)
        }
        isLoading={deactivateMutation.isPending || activateMutation.isPending}
        title={confirmTarget?.action === 'deactivate' ? 'Desactivar producto' : 'Activar producto'}
        description={
          confirmTarget?.action === 'deactivate'
            ? `"${confirmTarget?.product.name}" dejará de estar disponible para pedidos.`
            : `"${confirmTarget?.product.name}" volverá a estar disponible para pedidos.`
        }
        confirmLabel={confirmTarget?.action === 'deactivate' ? 'Desactivar' : 'Activar'}
        variant={confirmTarget?.action === 'deactivate' ? 'danger' : 'info'}
      />
    </div>
  )
}
