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
      <span className="flex items-center gap-1 text-xs font-medium text-zinc-500 uppercase tracking-wide">
        <Filter size={11} />
        Filtros
      </span>

      {filters.map((group) => (
        <div key={group.key} className="relative">
          <select
            value={activeFilters[group.key] ?? ''}
            onChange={(e) => onChange(group.key, e.target.value)}
            className="h-8 appearance-none rounded-sm border border-zinc-200 bg-white pl-2.5 pr-7 text-sm text-zinc-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
          />
        </div>
      ))}

      {hasActiveFilters && (
        <button
          onClick={onClearAll}
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 underline underline-offset-2"
        >
          <X size={11} />
          Limpiar
        </button>
      )}
    </div>
  )
}
