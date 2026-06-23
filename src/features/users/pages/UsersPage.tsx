import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, UserX, UserCheck } from 'lucide-react'
import { fetchUsers, deleteUser, activateUser } from '../services/users.service'
import type { User } from '../types'
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
import { ROLE_LABELS } from '@/shared/constants'
import { useDebounce } from '@/shared/hooks/useDebounce'
import type { UserRole } from '@/shared/types'
import { UserFormModal } from '../components/UserFormModal'

const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))

type ConfirmTarget = { user: User; action: 'activate' | 'deactivate' }

export function UsersPage() {
  const queryClient = useQueryClient()
  const [search, setSearch]         = useState('')
  const [filters, setFilters]       = useState<Record<string, string>>({ role: '', status: '' })
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showForm, setShowForm]     = useState(false)
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null)

  const debouncedSearch = useDebounce(search)

  const { data: users = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  })

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setConfirmTarget(null)
    },
  })

  const activateMutation = useMutation({
    mutationFn: (id: string) => activateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setConfirmTarget(null)
    },
  })

  const filtered = users.filter((u) => {
    const matchesSearch =
      !debouncedSearch ||
      u.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(debouncedSearch.toLowerCase())
    const matchesRole   = !filters.role   || u.role   === filters.role
    const matchesStatus = !filters.status || u.status === filters.status
    return matchesSearch && matchesRole && matchesStatus
  })

  const columns: TableColumn<User>[] = [
    {
      key: 'user',
      header: 'Usuario',
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-zinc-800 text-xs font-semibold uppercase text-white">
            {u.name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900">{u.name}</p>
            <p className="font-mono text-xs text-zinc-400">{u.username}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Rol',
      width: '160px',
      render: (u) => (
        <span className="text-xs font-medium text-zinc-700">
          {ROLE_LABELS[u.role as UserRole]}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      width: '90px',
      render: (u) => <StatusBadge status={u.status} />,
    },
    {
      key: 'createdAt',
      header: 'Alta',
      width: '120px',
      render: (u) => (
        <span className="text-xs text-zinc-400">
          {new Date(u.createdAt).toLocaleDateString('es-AR')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '80px',
      render: (u) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setSelectedUser(u)
              setShowForm(true)
            }}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            title="Editar"
          >
            <Pencil size={13} />
          </button>
          {u.status === 'active' ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setConfirmTarget({ user: u, action: 'deactivate' })
              }}
              className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-500"
              title="Desactivar"
            >
              <UserX size={13} />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setConfirmTarget({ user: u, action: 'activate' })
              }}
              className="rounded p-1 text-zinc-400 hover:bg-emerald-50 hover:text-emerald-600"
              title="Activar"
            >
              <UserCheck size={13} />
            </button>
          )}
        </div>
      ),
    },
  ]

  const isConfirmPending =
    deactivateMutation.isPending || activateMutation.isPending

  return (
    <div>
      <PageHeader
        title="Usuarios"
        description="Personal del sistema con acceso al panel."
        actions={
          <ActionButton
            variant="primary"
            icon={<Plus size={14} />}
            onClick={() => {
              setSelectedUser(null)
              setShowForm(true)
            }}
          >
            Nuevo usuario
          </ActionButton>
        }
      />

      <ActionBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre o usuario..."
          className="w-60"
        />
        <FilterBar
          filters={[
            { key: 'role', label: 'Rol', options: ROLE_OPTIONS },
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
          onClearAll={() => setFilters({ role: '', status: '' })}
        />
        <span className="ml-auto text-xs text-zinc-400">
          {filtered.length} usuario{filtered.length !== 1 ? 's' : ''}
        </span>
      </ActionBar>

      <div className="border-b border-zinc-200">
        <DataTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          getRowKey={(u) => u.id}
          emptyTitle="Sin usuarios"
          emptyDescription="No hay usuarios que coincidan con los filtros."
        />
      </div>

      {showForm && (
        <UserFormModal
          user={selectedUser}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['users'] })
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
            deactivateMutation.mutate(confirmTarget.user.id)
          } else {
            activateMutation.mutate(confirmTarget.user.id)
          }
        }}
        isLoading={isConfirmPending}
        title={
          confirmTarget?.action === 'deactivate'
            ? 'Desactivar usuario'
            : 'Activar usuario'
        }
        description={
          confirmTarget?.action === 'deactivate'
            ? `¿Desactivás a "${confirmTarget?.user.name}"? El usuario no podrá iniciar sesión hasta que sea reactivado.`
            : `¿Reactivás a "${confirmTarget?.user.name}"? Recuperará acceso al sistema.`
        }
        confirmLabel={confirmTarget?.action === 'deactivate' ? 'Desactivar' : 'Activar'}
        variant={confirmTarget?.action === 'deactivate' ? 'danger' : 'info'}
      />
    </div>
  )
}
