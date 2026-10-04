import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { fetchOrders } from '@/features/orders/services/orders.service'
import type { Order } from '@/features/orders/types'
import { MetricBlock, DataTable, DatePicker, Panel } from '@/shared/components/ui'
import { formatDuration } from '@/shared/lib/utils'
import type { TableColumn } from '@/shared/types'

const today = new Date()
const DEFAULT_FROM = new Date(today.getTime() - 7 * 24 * 3_600_000).toISOString().split('T')[0]
const DEFAULT_TO   = today.toISOString().split('T')[0]
const PAGE_SIZE    = 300

type UserStats = {
  name: string
  takenCount: number
  takenDeltas: number[]
  completedCount: number
  completeDeltas: number[]
}

function avg(values: number[]): number | null {
  return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null
}

function buildUserStats(orders: Order[]): UserStats[] {
  const byName = new Map<string, UserStats>()

  function bucket(name: string): UserStats {
    let stats = byName.get(name)
    if (!stats) {
      stats = { name, takenCount: 0, takenDeltas: [], completedCount: 0, completeDeltas: [] }
      byName.set(name, stats)
    }
    return stats
  }

  for (const o of orders) {
    if (o.startedAt && o.startedByName) {
      const stats = bucket(o.startedByName)
      stats.takenCount += 1
      stats.takenDeltas.push(new Date(o.startedAt).getTime() - new Date(o.createdAt).getTime())
    }
    if (o.startedAt && o.completedAt && o.completedByName) {
      const stats = bucket(o.completedByName)
      stats.completedCount += 1
      stats.completeDeltas.push(new Date(o.completedAt).getTime() - new Date(o.startedAt).getTime())
    }
  }

  return Array.from(byName.values()).sort((a, b) => b.takenCount + b.completedCount - (a.takenCount + a.completedCount))
}

export function OrderPerformanceTab() {
  const [from, setFrom] = useState(DEFAULT_FROM)
  const [to, setTo]     = useState(DEFAULT_TO)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['orders', 'performance', { from, to }],
    queryFn: () => fetchOrders({ from, to, page: 0, size: PAGE_SIZE }),
  })

  const orders    = data?.content ?? []
  const truncated = (data?.totalElements ?? 0) > orders.length

  const ordersStarted   = useMemo(() => orders.filter((o) => o.startedAt), [orders])
  const ordersCompleted = useMemo(() => orders.filter((o) => o.startedAt && o.completedAt), [orders])

  const avgTakeMs     = avg(ordersStarted.map((o) => new Date(o.startedAt!).getTime() - new Date(o.createdAt).getTime()))
  const avgCompleteMs = avg(ordersCompleted.map((o) => new Date(o.completedAt!).getTime() - new Date(o.startedAt!).getTime()))

  const userStats = useMemo(() => buildUserStats(orders), [orders])

  const columns: TableColumn<UserStats>[] = [
    { key: 'name', header: 'Usuario', render: (r) => <span className="font-medium text-zinc-800">{r.name}</span> },
    { key: 'taken', header: 'Pedidos tomados', align: 'right', render: (r) => <span className="tabular-nums">{r.takenCount}</span> },
    {
      key: 'avgTake',
      header: 'Tiempo promedio en tomar',
      align: 'right',
      render: (r) => <span className="tabular-nums">{avg(r.takenDeltas) !== null ? formatDuration(avg(r.takenDeltas)!) : '—'}</span>,
    },
    { key: 'completed', header: 'Pedidos completados', align: 'right', render: (r) => <span className="tabular-nums">{r.completedCount}</span> },
    {
      key: 'avgComplete',
      header: 'Tiempo promedio en completar',
      align: 'right',
      render: (r) => <span className="tabular-nums">{avg(r.completeDeltas) !== null ? formatDuration(avg(r.completeDeltas)!) : '—'}</span>,
    },
  ]

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 px-6 pb-5">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-500">Desde</span>
          <DatePicker value={from} onChange={setFrom} placeholder="Fecha inicio" className="w-40" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-500">Hasta</span>
          <DatePicker value={to} onChange={setTo} placeholder="Fecha fin" className="w-40" />
        </div>
        {truncated && (
          <span className="ml-auto flex items-center gap-1.5 self-end pb-0.5 text-xs text-amber-600">
            <AlertTriangle size={12} />
            Hay más pedidos en el rango de los que se muestran — acotá las fechas.
          </span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4 px-6">
        <MetricBlock label="Pedidos en el rango" value={orders.length} />
        <MetricBlock label="Pedidos completados" value={ordersCompleted.length} accent="green" />
        <MetricBlock
          label="Tiempo promedio en tomar"
          value={avgTakeMs !== null ? formatDuration(avgTakeMs) : '—'}
          note="desde que se creó el pedido"
        />
        <MetricBlock
          label="Tiempo promedio en completar"
          value={avgCompleteMs !== null ? formatDuration(avgCompleteMs) : '—'}
          note="desde que se tomó el pedido"
        />
      </div>

      <Panel className="mx-6 mt-5">
        <DataTable
          columns={columns}
          data={userStats}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          getRowKey={(r) => r.name}
          emptyTitle="Sin actividad de usuarios"
          emptyDescription="No hay pedidos tomados o completados en el rango seleccionado."
        />
      </Panel>
    </div>
  )
}
