import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchAuditLogs } from '../services/audits.service'
import type { AuditLog, AuditEventType } from '../types'
import {
  PageHeader,
  ActionBar,
  SearchInput,
  FilterBar,
  DataTable,
  StatusBadge,
  SectionHeader,
  AuditTimeline,
} from '@/shared/components/ui'
import type { AuditEntry } from '@/shared/components/ui'
import type { TableColumn } from '@/shared/types'
import { formatDateTime } from '@/shared/lib/utils'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { ROLE_LABELS } from '@/shared/constants'

const EVENT_TYPE_LABELS: Partial<Record<AuditEventType, string>> = {
  stock_entry:       'Entrada stock',
  stock_exit:        'Salida stock',
  stock_transfer:    'Transferencia',
  stock_adjustment:  'Ajuste stock',
  delivery_created:  'Reparto creado',
  delivery_completed:'Reparto completado',
  delivery_cancelled:'Reparto cancelado',
  branch_created:    'Sucursal creada',
  branch_updated:    'Sucursal actualizada',
  product_created:   'Producto creado',
  product_updated:   'Producto actualizado',
  user_login:        'Inicio sesión',
  user_created:      'Usuario creado',
}

function toTimelineEntry(log: AuditLog): AuditEntry {
  const typeMap: Record<AuditEventType, AuditEntry['type']> = {
    stock_entry:       'create',
    stock_exit:        'update',
    stock_transfer:    'update',
    stock_adjustment:  'update',
    delivery_created:  'create',
    delivery_completed:'status_change',
    delivery_cancelled:'status_change',
    branch_created:    'create',
    branch_updated:    'update',
    product_created:   'create',
    product_updated:   'update',
    user_login:        'info',
    user_created:      'create',
  }
  return {
    id: log.id,
    action: log.action,
    description: log.description,
    user: `${log.userName} (${ROLE_LABELS[log.userRole as keyof typeof ROLE_LABELS] ?? log.userRole})`,
    timestamp: log.createdAt,
    type: typeMap[log.eventType],
  }
}

export function AuditsPage() {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({ eventType: '', userRole: '' })
  const [view, setView] = useState<'table' | 'timeline'>('table')

  const debouncedSearch = useDebounce(search)

  const { data: logs = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['audits'],
    queryFn: fetchAuditLogs,
    refetchInterval: 30_000,
  })

  const filtered = logs.filter((l) => {
    const matchesSearch =
      !debouncedSearch ||
      l.action.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      l.entityLabel.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      l.userName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      l.description.toLowerCase().includes(debouncedSearch.toLowerCase())
    const matchesType = !filters.eventType || l.eventType === filters.eventType
    const matchesRole = !filters.userRole || l.userRole === filters.userRole
    return matchesSearch && matchesType && matchesRole
  })

  const columns: TableColumn<AuditLog>[] = [
    {
      key: 'timestamp',
      header: 'Fecha / Hora',
      width: '140px',
      render: (l) => <span className="text-xs text-zinc-500 tabular-nums">{formatDateTime(l.createdAt)}</span>,
    },
    {
      key: 'eventType',
      header: 'Evento',
      width: '140px',
      render: (l) => (
        <span className="text-xs font-medium text-zinc-700">
          {EVENT_TYPE_LABELS[l.eventType] ?? l.eventType}
        </span>
      ),
    },
    {
      key: 'entity',
      header: 'Entidad',
      width: '170px',
      render: (l) => (
        <div>
          <p className="text-xs font-medium text-zinc-600 uppercase tracking-wide">{l.entityType}</p>
          <p className="text-xs text-zinc-800 font-mono">{l.entityLabel}</p>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Acción / Descripción',
      render: (l) => (
        <div>
          <p className="text-sm font-medium text-zinc-900">{l.action}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{l.description}</p>
        </div>
      ),
    },
    {
      key: 'user',
      header: 'Usuario',
      width: '150px',
      render: (l) => (
        <div>
          <p className="text-xs font-medium text-zinc-800">{l.userName}</p>
          <p className="text-[10px] uppercase tracking-wide text-zinc-400">
            {ROLE_LABELS[l.userRole as keyof typeof ROLE_LABELS] ?? l.userRole}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      width: '90px',
      render: (l) => <StatusBadge status={l.status} />,
    },
  ]

  const uniqueRoles = [...new Set(logs.map((l) => l.userRole))]
  const uniqueTypes = [...new Set(logs.map((l) => l.eventType))]

  return (
    <div>
      <PageHeader
        title="Auditoría"
        description="Registro completo de eventos y operaciones del sistema."
        actions={
          <div className="flex items-center rounded-sm border border-zinc-200 overflow-hidden">
            <button
              onClick={() => setView('table')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                view === 'table'
                  ? 'bg-zinc-900 text-white'
                  : 'bg-white text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              Tabla
            </button>
            <button
              onClick={() => setView('timeline')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors border-l border-zinc-200 ${
                view === 'timeline'
                  ? 'bg-zinc-900 text-white'
                  : 'bg-white text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              Timeline
            </button>
          </div>
        }
      />

      <ActionBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar en auditoría..."
          className="w-64"
        />
        <FilterBar
          filters={[
            {
              key: 'eventType',
              label: 'Tipo de evento',
              options: uniqueTypes.map((t) => ({
                value: t,
                label: EVENT_TYPE_LABELS[t] ?? t,
              })),
            },
            {
              key: 'userRole',
              label: 'Rol',
              options: uniqueRoles.map((r) => ({
                value: r,
                label: ROLE_LABELS[r as keyof typeof ROLE_LABELS] ?? r,
              })),
            },
          ]}
          activeFilters={filters}
          onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
          onClearAll={() => setFilters({ eventType: '', userRole: '' })}
        />
        <span className="ml-auto text-xs text-zinc-400">
          {filtered.length} evento{filtered.length !== 1 ? 's' : ''}
        </span>
      </ActionBar>

      {view === 'table' ? (
        <div className="border-b border-zinc-200">
          <DataTable
            columns={columns}
            data={filtered}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
            getRowKey={(l) => l.id}
            emptyTitle="Sin registros"
            emptyDescription="No hay eventos de auditoría que coincidan con los filtros."
          />
        </div>
      ) : (
        <div className="p-6">
          <SectionHeader title="Línea de tiempo" className="mb-4" />
          {isLoading ? (
            <p className="text-sm text-zinc-400">Cargando...</p>
          ) : (
            <AuditTimeline entries={filtered.map(toTimelineEntry)} />
          )}
        </div>
      )}
    </div>
  )
}
