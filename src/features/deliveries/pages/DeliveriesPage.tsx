import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, PowerOff, Power } from 'lucide-react'
import { fetchDeliveries, deactivateDelivery, activateDelivery } from '../services/deliveries.service'
import type { Delivery } from '../types'
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
import { DeliveryFormModal } from '../components/DeliveryFormModal'

type ConfirmTarget = { delivery: Delivery; action: 'activate' | 'deactivate' }

export function DeliveriesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch]           = useState('')
  const [filters, setFilters]         = useState<Record<string, string>>({ status: '' })
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)
  const [showForm, setShowForm]       = useState(false)
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null)

  const debouncedSearch = useDebounce(search)

  const { data: deliveries = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['deliveries'],
    queryFn: fetchDeliveries,
  })

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivateDelivery(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] })
      setConfirmTarget(null)
    },
  })

  const activateMutation = useMutation({
    mutationFn: (id: string) => activateDelivery(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] })
      setConfirmTarget(null)
    },
  })

  const filtered = deliveries.filter((d) => {
    const matchesSearch =
      !debouncedSearch ||
      d.code.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (d.driver ?? '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (d.truckPlate ?? '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      d.branchName.toLowerCase().includes(debouncedSearch.toLowerCase())
    const matchesStatus = !filters.status || d.status === filters.status
    return matchesSearch && matchesStatus
  })

  const columns: TableColumn<Delivery>[] = [
    {
      key: 'code',
      header: 'Código',
      width: '110px',
      render: (d) => (
        <span className="font-mono text-xs font-medium text-zinc-600">{d.code}</span>
      ),
    },
    {
      key: 'branch',
      header: 'Sucursal',
      width: '180px',
      render: (d) => (
        <div>
          <p className="text-sm font-medium text-zinc-900">{d.branchName}</p>
          <p className="font-mono text-[10px] text-zinc-400">{d.branchCode}</p>
        </div>
      ),
    },
    {
      key: 'driver',
      header: 'Conductor / Vehículo',
      render: (d) => (
        <div>
          <p className="text-sm text-zinc-800">{d.driver ?? <span className="text-zinc-300">—</span>}</p>
          {d.truckPlate && (
            <p className="font-mono text-xs text-zinc-400 uppercase">{d.truckPlate}</p>
          )}
        </div>
      ),
    },
    {
      key: 'observations',
      header: 'Observaciones',
      render: (d) => (
        <span className="text-xs text-zinc-500 line-clamp-1">
          {d.observations ?? '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      width: '90px',
      render: (d) => <StatusBadge status={d.status} />,
    },
    {
      key: 'updatedAt',
      header: 'Actualización',
      width: '120px',
      render: (d) => (
        <span className="text-xs text-zinc-400">{formatDate(d.updatedAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '80px',
      render: (d) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setSelectedDelivery(d)
              setShowForm(true)
            }}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            title="Editar"
          >
            <Pencil size={13} />
          </button>
          {d.status === 'active' ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setConfirmTarget({ delivery: d, action: 'deactivate' })
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
                setConfirmTarget({ delivery: d, action: 'activate' })
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

  return (
    <div>
      <PageHeader
        title="Repartos"
        description="Rutas de distribución por sucursal."
        actions={
          <ActionButton
            variant="primary"
            icon={<Plus size={14} />}
            onClick={() => {
              setSelectedDelivery(null)
              setShowForm(true)
            }}
          >
            Nuevo reparto
          </ActionButton>
        }
      />

      <ActionBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por código, conductor, patente o sucursal..."
          className="w-80"
        />
        <FilterBar
          filters={[
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
          onClearAll={() => setFilters({ status: '' })}
        />
        <span className="ml-auto text-xs text-zinc-400">
          {filtered.length} reparto{filtered.length !== 1 ? 's' : ''}
        </span>
      </ActionBar>

      <div className="border-b border-zinc-200">
        <DataTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          getRowKey={(d) => d.id}
          emptyTitle="Sin repartos"
          emptyDescription="No hay repartos que coincidan con los filtros."
          emptyAction={
            !debouncedSearch && !filters.status ? (
              <ActionButton
                variant="primary"
                size="sm"
                icon={<Plus size={13} />}
                onClick={() => setShowForm(true)}
              >
                Nuevo reparto
              </ActionButton>
            ) : undefined
          }
        />
      </div>

      {showForm && (
        <DeliveryFormModal
          delivery={selectedDelivery}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['deliveries'] })
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
            deactivateMutation.mutate(confirmTarget.delivery.id)
          } else {
            activateMutation.mutate(confirmTarget.delivery.id)
          }
        }}
        isLoading={deactivateMutation.isPending || activateMutation.isPending}
        title={
          confirmTarget?.action === 'deactivate' ? 'Desactivar reparto' : 'Activar reparto'
        }
        description={
          confirmTarget?.action === 'deactivate'
            ? `¿Desactivás el reparto "${confirmTarget?.delivery.code}"? No podrá usarse en controles.`
            : `¿Reactivás el reparto "${confirmTarget?.delivery.code}"?`
        }
        confirmLabel={confirmTarget?.action === 'deactivate' ? 'Desactivar' : 'Activar'}
        variant={confirmTarget?.action === 'deactivate' ? 'danger' : 'info'}
      />
    </div>
  )
}
