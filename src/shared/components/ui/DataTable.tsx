import type { TableColumn } from '@/shared/types'
import { cn } from '@/shared/lib/utils'
import { LoadingState } from './LoadingState'
import { ErrorState } from './ErrorState'
import { EmptyState } from './EmptyState'

type Props<T> = {
  columns: TableColumn<T>[]
  data: T[]
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  onRowClick?: (row: T) => void
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: React.ReactNode
  className?: string
  rowClassName?: (row: T) => string | undefined
  getRowKey: (row: T) => string
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  isError,
  onRetry,
  onRowClick,
  emptyTitle,
  emptyDescription,
  emptyAction,
  className,
  rowClassName,
  getRowKey,
}: Props<T>) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full min-w-full table-auto border-collapse">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-zinc-500 whitespace-nowrap',
                  col.align === 'center' && 'text-center',
                  col.align === 'right' && 'text-right',
                  col.width
                )}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length}>
                <LoadingState size="sm" />
              </td>
            </tr>
          ) : isError ? (
            <tr>
              <td colSpan={columns.length}>
                <ErrorState onRetry={onRetry} />
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <EmptyState
                  title={emptyTitle}
                  description={emptyDescription}
                  action={emptyAction}
                />
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={getRowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'bg-white transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-zinc-50',
                  rowClassName?.(row)
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-3 text-sm text-zinc-800',
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right'
                    )}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
