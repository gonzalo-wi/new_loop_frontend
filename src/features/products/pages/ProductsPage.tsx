import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, PowerOff, Power, GripVertical, ArrowUpDown, Loader2 } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  fetchProducts,
  deleteProduct,
  activateProduct,
  patchProductOrder,
} from '../services/products.service'
import type { Product } from '../types'
import {
  PageHeader,
  ActionBar,
  ActionButton,
  SearchInput,
  FilterBar,
  DataTable,
  StatusBadge,
  ConfirmDialog,
} from '@/shared/components/ui'
import type { TableColumn } from '@/shared/types'
import { formatDate } from '@/shared/lib/utils'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { ProductFormModal } from '../components/ProductFormModal'

const TYPE_LABEL: Record<string, string> = {
  returnable: 'Retornable',
  disposable: 'Descartable',
}

const TYPE_STYLE: Record<string, string> = {
  returnable: 'text-blue-700 bg-blue-50 border border-blue-200',
  disposable: 'text-zinc-600 bg-zinc-100 border border-zinc-200',
}

type ConfirmTarget = { product: Product; action: 'activate' | 'deactivate' }

// ── Sortable row ──────────────────────────────────────────────────────────────

function SortableRow({ product, index }: { product: Product; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: product.id })

  return (
    <tr
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
        position: isDragging ? 'relative' : undefined,
      }}
      className={`border-b border-zinc-100 ${isDragging ? 'bg-zinc-50 shadow-sm' : 'bg-white'}`}
    >
      <td className="w-8 px-3 py-2.5">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none text-zinc-300 hover:text-zinc-500 active:cursor-grabbing"
        >
          <GripVertical size={14} />
        </button>
      </td>
      <td className="w-10 px-3 py-2.5 text-right">
        <span className="font-mono text-xs text-zinc-300">{index + 1}</span>
      </td>
      <td className="w-28 px-3 py-2.5">
        <span className="font-mono text-xs font-medium text-zinc-600">{product.code}</span>
      </td>
      <td className="px-3 py-2.5">
        <p className="text-sm font-medium text-zinc-900">{product.name}</p>
        {product.description && (
          <p className="mt-0.5 text-xs text-zinc-400">{product.description}</p>
        )}
      </td>
      <td className="w-28 px-3 py-2.5">
        <span
          className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${TYPE_STYLE[product.type]}`}
        >
          {TYPE_LABEL[product.type]}
        </span>
      </td>
      <td className="w-24 px-3 py-2.5">
        <StatusBadge status={product.status} />
      </td>
    </tr>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function ProductsPage() {
  const queryClient = useQueryClient()

  // Normal mode state
  const [search, setSearch]     = useState('')
  const [filters, setFilters]   = useState<Record<string, string>>({ type: '', status: '' })
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null)

  // Reorder mode state
  const [reorderMode, setReorderMode] = useState(false)
  const [reorderList, setReorderList] = useState<Product[]>([])
  const [isSaving, setIsSaving]       = useState(false)
  const [saveError, setSaveError]     = useState<string | null>(null)

  const debouncedSearch = useDebounce(search)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const { data: products = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  })

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setConfirmTarget(null)
    },
  })

  const activateMutation = useMutation({
    mutationFn: (id: string) => activateProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setConfirmTarget(null)
    },
  })

  // ── Reorder handlers ─────────────────────────────────────────────────────────

  function enterReorderMode() {
    setReorderList([...products])
    setSaveError(null)
    setReorderMode(true)
  }

  function cancelReorder() {
    setReorderMode(false)
    setSaveError(null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setReorderList((items) => {
      const oldIndex = items.findIndex((p) => p.id === active.id)
      const newIndex = items.findIndex((p) => p.id === over.id)
      return arrayMove(items, oldIndex, newIndex)
    })
  }

  async function saveOrder() {
    setIsSaving(true)
    setSaveError(null)
    try {
      await Promise.all(
        reorderList.map((p, i) => patchProductOrder(p.id, i + 1))
      )
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      setReorderMode(false)
    } catch {
      setSaveError('No se pudo guardar el orden. Intentá de nuevo.')
    } finally {
      setIsSaving(false)
    }
  }

  // ── Normal table ─────────────────────────────────────────────────────────────

  const filtered = products.filter((p) => {
    const matchesSearch =
      !debouncedSearch ||
      p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      p.code.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (p.description ?? '').toLowerCase().includes(debouncedSearch.toLowerCase())
    const matchesType   = !filters.type   || p.type   === filters.type
    const matchesStatus = !filters.status || p.status === filters.status
    return matchesSearch && matchesType && matchesStatus
  })

  const columns: TableColumn<Product>[] = [
    {
      key: 'code',
      header: 'Código',
      width: '100px',
      render: (p) => (
        <span className="font-mono text-xs font-medium text-zinc-600">{p.code}</span>
      ),
    },
    {
      key: 'name',
      header: 'Producto',
      render: (p) => (
        <div>
          <p className="font-medium text-zinc-900">{p.name}</p>
          {p.description && (
            <p className="mt-0.5 text-xs text-zinc-400">{p.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Tipo',
      width: '110px',
      render: (p) => (
        <span
          className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${TYPE_STYLE[p.type]}`}
        >
          {TYPE_LABEL[p.type]}
        </span>
      ),
    },
    {
      key: 'unit',
      header: 'Unidad',
      width: '80px',
      render: (p) => <span className="text-sm text-zinc-500">{p.unit ?? '—'}</span>,
    },
    {
      key: 'packQuantity',
      header: 'Pack',
      width: '60px',
      render: (p) => <span className="text-sm text-zinc-500">{p.packQuantity ?? '—'}</span>,
    },
    {
      key: 'displayOrder',
      header: 'Orden',
      width: '60px',
      render: (p) => (
        <span className="font-mono text-xs text-zinc-400">{p.displayOrder}</span>
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
      header: 'Actualización',
      width: '120px',
      render: (p) => (
        <span className="text-xs text-zinc-400">{formatDate(p.updatedAt)}</span>
      ),
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
              setSelectedProduct(p)
              setShowForm(true)
            }}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            title="Editar"
          >
            <Pencil size={13} />
          </button>
          {p.status === 'active' ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setConfirmTarget({ product: p, action: 'deactivate' })
              }}
              className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-500"
              title="Desactivar"
            >
              <PowerOff size={13} />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setConfirmTarget({ product: p, action: 'activate' })
              }}
              className="rounded p-1 text-zinc-400 hover:bg-emerald-50 hover:text-emerald-600"
              title="Activar"
            >
              <Power size={13} />
            </button>
          )}
        </div>
      ),
    },
  ]

  // ── Render ───────────────────────────────────────────────────────────────────

  if (reorderMode) {
    return (
      <div>
        <PageHeader
          title="Reordenar productos"
          description="Arrastrá las filas para cambiar el orden de visualización."
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={cancelReorder}
                disabled={isSaving}
                className="h-9 rounded-sm border border-zinc-200 bg-white px-4 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={saveOrder}
                disabled={isSaving}
                className="flex h-9 items-center gap-2 rounded-sm bg-blue-600 px-5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving && <Loader2 size={13} className="animate-spin" />}
                {isSaving ? 'Guardando...' : 'Guardar orden'}
              </button>
            </div>
          }
        />

        {saveError && (
          <div className="mx-6 mb-4 rounded-sm border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
            {saveError}
          </div>
        )}

        <div className="border-b border-zinc-200">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="w-8 px-3 py-2.5" />
                <th className="w-10 px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  #
                </th>
                <th className="w-28 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Código
                </th>
                <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Producto
                </th>
                <th className="w-28 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Tipo
                </th>
                <th className="w-24 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Estado
                </th>
              </tr>
            </thead>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={reorderList.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <tbody>
                  {reorderList.map((product, index) => (
                    <SortableRow key={product.id} product={product} index={index} />
                  ))}
                </tbody>
              </SortableContext>
            </DndContext>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Productos"
        description="Catálogo de productos retornables y descartables."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={enterReorderMode}
              disabled={products.length === 0}
              className="flex h-9 items-center gap-2 rounded-sm border border-zinc-200 bg-white px-4 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
            >
              <ArrowUpDown size={13} />
              Reordenar
            </button>
            <ActionButton
              variant="primary"
              icon={<Plus size={14} />}
              onClick={() => {
                setSelectedProduct(null)
                setShowForm(true)
              }}
            >
              Nuevo producto
            </ActionButton>
          </div>
        }
      />

      <ActionBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre, código o descripción..."
          className="w-72"
        />
        <FilterBar
          filters={[
            {
              key: 'type',
              label: 'Tipo',
              options: [
                { value: 'returnable', label: 'Retornable' },
                { value: 'disposable', label: 'Descartable' },
              ],
            },
            {
              key: 'status',
              label: 'Estado',
              options: [
                { value: 'active',   label: 'Activo' },
                { value: 'inactive', label: 'Inactivo' },
              ],
            },
          ]}
          activeFilters={filters}
          onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
          onClearAll={() => setFilters({ type: '', status: '' })}
        />
        <span className="ml-auto text-xs text-zinc-400">
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
        </span>
      </ActionBar>

      <div className="border-b border-zinc-200">
        <DataTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          getRowKey={(p) => p.id}
          emptyTitle="Sin productos"
          emptyDescription="No hay productos que coincidan con los filtros."
        />
      </div>

      {showForm && (
        <ProductFormModal
          product={selectedProduct}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['products'] })
            setShowForm(false)
          }}
        />
      )}

      <ConfirmDialog
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => {
          if (!confirmTarget) return
          if (confirmTarget.action === 'deactivate') {
            deactivateMutation.mutate(confirmTarget.product.id)
          } else {
            activateMutation.mutate(confirmTarget.product.id)
          }
        }}
        isLoading={deactivateMutation.isPending || activateMutation.isPending}
        title={confirmTarget?.action === 'deactivate' ? 'Desactivar producto' : 'Activar producto'}
        description={
          confirmTarget?.action === 'deactivate'
            ? `¿Desactivás "${confirmTarget?.product.name}"? No aparecerá en nuevas operaciones.`
            : `¿Reactivás "${confirmTarget?.product.name}"?`
        }
        confirmLabel={confirmTarget?.action === 'deactivate' ? 'Desactivar' : 'Activar'}
        variant={confirmTarget?.action === 'deactivate' ? 'danger' : 'info'}
      />
    </div>
  )
}
