import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, PowerOff, Power, MapPin, Route, UserX } from 'lucide-react'
import { fetchDeliveries, deactivateDelivery, activateDelivery } from '../services/deliveries.service'
import { fetchUsers } from '@/features/users/services/users.service'
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
  MetricBlock,
  Panel,
} from '@/shared/components/ui'
import type { TableColumn } from '@/shared/types'
import { formatDate } from '@/shared/lib/utils'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { DeliveryFormModal } from '../components/DeliveryFormModal'
import { TruckLocationModal } from '../components/TruckLocationModal'

type ConfirmTarget = { delivery: Delivery; action: 'activate' | 'deactivate' }

export function DeliveriesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch]           = useState('')
  const [filters, setFilters]         = useState<Record<string, string>>({ status: '' })
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)
  const [showForm, setShowForm]       = useState(false)
  const [trackTarget, setTrackTarget] = useState<Delivery | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null)

  const debouncedSearch = useDebounce(search)

  const { data: deliveries = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['deliveries'],
    queryFn: fetchDeliveries,
  })

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  })

  const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]))

  const activeCount     = deliveries.filter((d) => d.status === 'active').length
  const withPlateCount  = deliveries.filter((d) => !!d.truckPlate?.trim()).length
  const unassignedCount = deliveries.filter((d) => d.status === 'active' && !d.driverId && !d.driver).length

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

  const filtered = deliveries
    .filter((d) => {
      const matchesSearch =
        !debouncedSearch ||
        d.code.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (d.driver ?? '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (d.truckPlate ?? '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        d.branchName.toLowerCase().includes(debouncedSearch.toLowerCase())
      const matchesStatus = !filters.status || d.status === filters.status
      return matchesSearch && matchesStatus
    })
    // Natural sort so "rto10" lands after "rto9" instead of after "rto1"; the
    // backend's string sort can't do this.
    .sort((a, b) =>
      a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' })
    )

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
      render: (d) => {
        const driverName = (d.driverId ? userMap[d.driverId] : undefined) ?? d.driver
        return (
          <div className="flex items-center gap-2.5">
            {driverName ? (
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold uppercase text-white">
                {driverName.charAt(0)}
              </span>
            ) : (
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-300">
                <UserX size={11} />
              </span>
            )}
            <div className="min-w-0">
              {driverName
                ? <p className="truncate text-sm text-zinc-800">{driverName}</p>
                : <span className="text-sm text-zinc-300">Sin asignar</span>}
              {d.truckPlate && (
                <span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-50 px-1 font-mono text-[10px] uppercase text-zinc-500">
                  {d.truckPlate}
                </span>
              )}
            </div>
          </div>
        )
      },
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
              setTrackTarget(d)
            }}
            className="rounded-md p-1 text-zinc-400 hover:bg-blue-50 hover:text-blue-600"
            title={d.truckPlate ? 'Ver ubicación en el mapa' : 'Sin patente cargada'}
          >
            <MapPin size={13} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setSelectedDelivery(d)
              setShowForm(true)
            }}
            className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
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
              className="rounded-md p-1 text-zinc-400 hover:bg-red-50 hover:text-red-500"
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

      <div className="grid grid-cols-3 gap-4 px-6">
        <MetricBlock
          label="Repartos activos"
          icon={Route}
          accent={activeCount > 0 ? 'green' : 'default'}
          value={activeCount}
          note={`de ${deliveries.length} en total`}
        />
        <MetricBlock
          label="Con GPS cargado"
          icon={MapPin}
          accent="blue"
          value={withPlateCount}
          note="patente asociada a la flota"
        />
        <MetricBlock
          label="Sin conductor asignado"
          icon={UserX}
          accent={unassignedCount > 0 ? 'amber' : 'default'}
          value={unassignedCount}
          note="entre los activos"
        />
      </div>

      <Panel className="mx-6 mt-5">
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

        <div>
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
      </Panel>

      {trackTarget && (
        <TruckLocationModal
          delivery={trackTarget}
          onClose={() => setTrackTarget(null)}
        />
      )}

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
