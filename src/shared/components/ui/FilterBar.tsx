import { Filter, X } from 'lucide-react'
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
        <select
          key={group.key}
          value={activeFilters[group.key] ?? ''}
          onChange={(e) => onChange(group.key, e.target.value)}
          className="h-8 rounded-sm border border-zinc-200 bg-white px-2.5 pr-7 text-sm text-zinc-700 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 appearance-none"
        >
          <option value="">{group.label}</option>
          {group.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
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
