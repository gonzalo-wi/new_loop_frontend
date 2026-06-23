import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { fetchBranches, deleteBranch } from '../services/branches.service'
import type { Branch } from '../types'
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
import { formatDate, formatCuit } from '@/shared/lib/utils'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { BranchFormModal } from '../components/BranchFormModal'

const STATUS_FILTER = [
  { value: 'active', label: 'Activa' },
  { value: 'inactive', label: 'Inactiva' },
]

export function BranchesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({ status: '' })
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null)

  const debouncedSearch = useDebounce(search)

  const { data: branches = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['branches'],
    queryFn: fetchBranches,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBranch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] })
      setDeleteTarget(null)
    },
  })

  const filtered = branches.filter((b) => {
    const matchesSearch =
      !debouncedSearch ||
      b.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      b.code.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      b.city.toLowerCase().includes(debouncedSearch.toLowerCase())
    const matchesStatus = !filters.status || b.status === filters.status
    return matchesSearch && matchesStatus
  })

  const columns: TableColumn<Branch>[] = [
    {
      key: 'code',
      header: 'Código',
      render: (b) => (
        <span className="font-mono text-xs font-medium text-zinc-600">{b.code}</span>
      ),
      width: '100px',
    },
    {
      key: 'name',
      header: 'Sucursal',
      render: (b) => <span className="font-medium text-zinc-900">{b.name}</span>,
    },
    {
      key: 'location',
      header: 'Ubicación',
      render: (b) => (
        <span className="text-zinc-600">
          {b.city}, {b.province}
        </span>
      ),
    },
    {
      key: 'cuit',
      header: 'CUIT',
      render: (b) => (
        <span className="font-mono text-xs text-zinc-500">{formatCuit(b.cuit)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (b) => <StatusBadge status={b.status} />,
      width: '90px',
    },
    {
      key: 'updatedAt',
      header: 'Actualización',
      render: (b) => <span className="text-zinc-400 text-xs">{formatDate(b.updatedAt)}</span>,
      width: '120px',
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '80px',
      render: (b) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setSelectedBranch(b)
              setShowForm(true)
            }}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            title="Editar"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setDeleteTarget(b)
            }}
            className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-500"
            title="Eliminar"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Sucursales"
        description="Plantas y puntos operativos del sistema."
        actions={
          <ActionButton
            variant="primary"
            icon={<Plus size={14} />}
            onClick={() => {
              setSelectedBranch(null)
              setShowForm(true)
            }}
          >
            Nueva sucursal
          </ActionButton>
        }
      />

      <ActionBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre, código o ciudad..."
          className="w-64"
        />
        <FilterBar
          filters={[{ key: 'status', label: 'Estado', options: STATUS_FILTER }]}
          activeFilters={filters}
          onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
          onClearAll={() => setFilters({ status: '' })}
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
          getRowKey={(b) => b.id}
          emptyTitle="Sin sucursales"
          emptyDescription="No hay sucursales que coincidan con los filtros."
          emptyAction={
            !debouncedSearch && !filters.status ? (
              <ActionButton
                variant="primary"
                size="sm"
                icon={<Plus size={13} />}
                onClick={() => setShowForm(true)}
              >
                Nueva sucursal
              </ActionButton>
            ) : undefined
          }
        />
      </div>

      {showForm && (
        <BranchFormModal
          branch={selectedBranch}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['branches'] })
            setShowForm(false)
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        isLoading={deleteMutation.isPending}
        title="Eliminar sucursal"
        description={`¿Confirmás la eliminación de "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
      />
    </div>
  )
}
