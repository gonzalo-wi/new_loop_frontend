import { ChevronDown, Filter, X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

type FilterOption = {
  value: string
  label: string
}

type FilterGroup = {
  key: string
  label: string
  options: FilterOption[]
}

type ActiveFilter = Record<string, string>

type Props = {
  filters: FilterGroup[]
  activeFilters: ActiveFilter
  onChange: (key: string, value: string) => void
  onClearAll: () => void
  className?: string
}

export function FilterBar({ filters, activeFilters, onChange, onClearAll, className }: Props) {
  const hasActiveFilters = Object.values(activeFilters).some((v) => v !== '')

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
        <Filter size={13} />
        Filtros
      </span>

      {filters.map((group) => (
        <div key={group.key} className="relative">
          <select
            value={activeFilters[group.key] ?? ''}
            onChange={(e) => onChange(group.key, e.target.value)}
            className="h-9 appearance-none rounded-md border border-zinc-200 bg-white pl-3 pr-8 text-sm text-zinc-700 shadow-card focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
          >
            <option value="">{group.label}</option>
            {group.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={12}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
          />
        </div>
      ))}

      {hasActiveFilters && (
        <button
          onClick={onClearAll}
          className="flex h-9 items-center gap-1 rounded-md px-2 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
        >
          <X size={11} />
          Limpiar
        </button>
      )}
    </div>
  )
}
