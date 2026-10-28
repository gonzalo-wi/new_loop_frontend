import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import type { TableColumn, TableSort } from '@/shared/types'
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
  // Optional: headers of `sortable` columns become buttons. The caller sorts `data`.
  sort?: TableSort | null
  onSortChange?: (key: string) => void
}

function SortIcon({ active, direction }: { active: boolean; direction?: TableSort['direction'] }) {
  if (!active) return <ArrowUpDown size={12} className="text-zinc-300" aria-hidden />
  return direction === 'asc'
    ? <ArrowUp size={12} className="text-zinc-700" aria-hidden />
    : <ArrowDown size={12} className="text-zinc-700" aria-hidden />
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
  sort,
  onSortChange,
}: Props<T>) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full min-w-full table-auto border-collapse">
        <thead>
          <tr className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50">
            {columns.map((col) => {
              const sortable = col.sortable && onSortChange
              const active = sort?.key === col.key
              return (
                <th
                  key={col.key}
                  aria-sort={active ? (sort?.direction === 'asc' ? 'ascending' : 'descending') : undefined}
                  className={cn(
                    'whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right',
                    col.width
                  )}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => onSortChange(col.key)}
                      className={cn(
                        'inline-flex items-center gap-1 uppercase tracking-wider hover:text-zinc-900',
                        active && 'text-zinc-900'
                      )}
                    >
                      {col.header}
                      <SortIcon active={active} direction={sort?.direction} />
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              )
            })}
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
                  'bg-white transition-colors hover:bg-zinc-50/70',
                  onRowClick && 'cursor-pointer',
                  rowClassName?.(row)
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-3.5 text-sm text-zinc-800',
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
