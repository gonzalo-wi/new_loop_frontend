import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Power, PowerOff } from 'lucide-react'
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
  ConfirmDialog,
} from '@/shared/components/ui'
import { formatDate } from '@/shared/lib/utils'
import { useDebounce } from '@/shared/hooks/useDebounce'

type ConfirmTarget = { product: OrderableProduct; action: 'activate' | 'deactivate' }

const STATUS_FILTER_OPTIONS = [
  { value: '',       label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
]

export function OrderableProductsPage() {
  const queryClient = useQueryClient()

  const [search, setSearch]           = useState('')
  const [statusFilter, setStatus]     = useState('active')
  const [selectedProduct, setSelected] = useState<OrderableProduct | null>(null)
  const [showForm, setShowForm]       = useState(false)
  const [confirmTarget, setConfirm]   = useState<ConfirmTarget | null>(null)

  const debouncedSearch = useDebounce(search)

  const { data: products = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['orderable-products'],
    queryFn:  fetchOrderableProducts,
  })

  const filtered = products.filter((p) => {
    const matchStatus = !statusFilter || p.status === statusFilter
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

  const selectClass =
    'h-8 rounded-sm border border-zinc-200 bg-white px-2.5 text-xs text-zinc-700 focus:border-zinc-400 focus:outline-none'

  return (
    <div>
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

      <ActionBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por código o nombre..."
          className="w-64"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatus(e.target.value)}
          className={selectClass}
        >
          {STATUS_FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <span className="text-xs text-zinc-400">{filtered.length} productos</span>
      </ActionBar>

      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50">
            <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 w-32">Código</th>
            <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Nombre</th>
            <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 w-24 text-center">Por unidad</th>
            <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 w-24 text-center">Por bulto</th>
            <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 w-20 text-center">U/bulto</th>
            <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 w-20">Estado</th>
            <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 w-28">Actualizado</th>
            <th className="px-4 py-2.5 w-20" />
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center text-sm text-zinc-400">Cargando...</td>
            </tr>
          )}
          {isError && (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center">
                <p className="text-sm text-zinc-500">No se pudieron cargar los productos.</p>
                <button onClick={() => refetch()} className="mt-2 text-xs text-zinc-400 underline hover:text-zinc-700">Reintentar</button>
              </td>
            </tr>
          )}
          {!isLoading && !isError && filtered.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-10 text-center">
                <p className="text-sm text-zinc-500">Sin productos pedibles.</p>
                <button
                  onClick={() => { setSelected(null); setShowForm(true) }}
                  className="mt-2 text-xs text-zinc-400 underline hover:text-zinc-700"
                >
                  Crear el primero
                </button>
              </td>
            </tr>
          )}
          {filtered.map((p) => (
            <tr key={p.id} className="border-b border-zinc-100 bg-white hover:bg-zinc-50">
              <td className="px-4 py-3">
                <span className="font-mono text-xs font-medium text-zinc-600">{p.code}</span>
              </td>
              <td className="px-4 py-3">
                <p className="text-sm font-medium text-zinc-900">{p.name}</p>
                {p.description && (
                  <p className="text-xs text-zinc-400 truncate max-w-xs">{p.description}</p>
                )}
              </td>
              <td className="px-4 py-3 text-center">
                <span className={`text-xs font-medium ${p.allowsUnit ? 'text-emerald-600' : 'text-zinc-300'}`}>
                  {p.allowsUnit ? 'Sí' : 'No'}
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                <span className={`text-xs font-medium ${p.allowsBulk ? 'text-emerald-600' : 'text-zinc-300'}`}>
                  {p.allowsBulk ? 'Sí' : 'No'}
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                <span className="font-mono text-xs text-zinc-500">
                  {p.unitsPerBulk ?? '—'}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={[
                  'inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                  p.status === 'active'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-zinc-200 bg-zinc-100 text-zinc-500',
                ].join(' ')}>
                  {p.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="text-xs text-zinc-400">{formatDate(p.updatedAt)}</span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => { setSelected(p); setShowForm(true) }}
                    className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                    title="Editar"
                  >
                    <Pencil size={13} />
                  </button>
                  {p.status === 'active' ? (
                    <button
                      onClick={() => setConfirm({ product: p, action: 'deactivate' })}
                      className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                      title="Desactivar"
                    >
                      <PowerOff size={13} />
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirm({ product: p, action: 'activate' })}
                      className="rounded p-1 text-zinc-400 hover:bg-emerald-50 hover:text-emerald-600"
                      title="Activar"
                    >
                      <Power size={13} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <OrderableProductFormModal
          product={selectedProduct}
          onClose={() => { setShowForm(false); setSelected(null) }}
          onSuccess={handleFormSuccess}
        />
      )}

      {confirmTarget && (
        <ConfirmDialog
          open
          variant={confirmTarget.action === 'deactivate' ? 'danger' : 'info'}
          title={confirmTarget.action === 'deactivate' ? 'Desactivar producto' : 'Activar producto'}
          description={
            confirmTarget.action === 'deactivate'
              ? `"${confirmTarget.product.name}" dejará de estar disponible para pedidos.`
              : `"${confirmTarget.product.name}" volverá a estar disponible para pedidos.`
          }
          confirmLabel={confirmTarget.action === 'deactivate' ? 'Desactivar' : 'Activar'}
          isLoading={deactivateMutation.isPending || activateMutation.isPending}
          onConfirm={() =>
            confirmTarget.action === 'deactivate'
              ? deactivateMutation.mutate(confirmTarget.product.id)
              : activateMutation.mutate(confirmTarget.product.id)
          }
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  )
}
