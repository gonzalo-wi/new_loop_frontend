import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'

export type ComboboxOption = { value: string; label: string; sublabel?: string }

type Props = {
  options: ComboboxOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  className?: string
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  searchPlaceholder = 'Buscar...',
  disabled,
  className,
}: Props) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')
  const [style, setStyle]   = useState<React.CSSProperties>({})

  const triggerRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)

  const filtered = search
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(search.toLowerCase()) ||
          o.sublabel?.toLowerCase().includes(search.toLowerCase())
      )
    : options

  const openDropdown = useCallback(() => {
    if (disabled) return
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setStyle({
        position: 'fixed',
        top:   rect.bottom + 4,
        left:  rect.left,
        width: rect.width,
        zIndex: 9999,
      })
    }
    setOpen(true)
  }, [disabled])

  useEffect(() => {
    if (!open) setSearch('')
  }, [open])

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      const target = e.target as Node
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        triggerRef.current  && !triggerRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return (
    <div className={`relative ${className ?? ''}`}>
      {/* Trigger */}
      <div
        ref={triggerRef}
        onClick={openDropdown}
        className={[
          'flex h-9 items-center justify-between rounded-sm border px-3 text-sm select-none',
          disabled
            ? 'cursor-not-allowed border-zinc-200 bg-zinc-50 text-zinc-500'
            : 'cursor-pointer border-zinc-200 bg-white text-zinc-900',
          open && !disabled
            ? 'border-blue-500 ring-1 ring-blue-500'
            : '',
        ].join(' ')}
      >
        <span className={selected ? 'text-zinc-900' : 'text-zinc-400'}>
          {selected?.label ?? placeholder}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange('') }}
              className="rounded p-0.5 text-zinc-400 hover:text-zinc-700"
            >
              <X size={12} />
            </button>
          )}
          <ChevronDown
            size={14}
            className={`text-zinc-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Dropdown — rendered at fixed position to escape overflow:hidden parents */}
      {open && (
        <div
          ref={containerRef}
          style={style}
          className="rounded-sm border border-zinc-200 bg-white shadow-lg"
        >
          {/* Search */}
          <div className="border-b border-zinc-100 p-2">
            <div className="flex items-center gap-2 rounded-sm border border-zinc-200 bg-zinc-50 px-2.5">
              <Search size={12} className="shrink-0 text-zinc-400" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="flex-1 bg-transparent py-1.5 text-xs text-zinc-900 outline-none placeholder:text-zinc-400"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} className="text-zinc-400 hover:text-zinc-600">
                  <X size={11} />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs text-zinc-400">Sin resultados para "{search}"</p>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => { onChange(o.value); setOpen(false) }}
                  className={[
                    'w-full px-3 py-2 text-left hover:bg-zinc-50',
                    o.value === value ? 'bg-blue-50' : '',
                  ].join(' ')}
                >
                  <span className={`block text-sm ${o.value === value ? 'font-semibold text-blue-700' : 'text-zinc-700'}`}>
                    {o.label}
                  </span>
                  {o.sublabel && (
                    <span className="block text-xs text-zinc-400">{o.sublabel}</span>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Count */}
          {options.length > 10 && (
            <div className="border-t border-zinc-100 px-3 py-1.5">
              <span className="text-[10px] text-zinc-400">
                {filtered.length} de {options.length}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
