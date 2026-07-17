import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays, X } from 'lucide-react'

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

type Props = {
  value: string          // YYYY-MM-DD or ''
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

function toISO(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function parseISO(iso: string): { year: number; month: number; day: number } | null {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  return { year: y, month: m - 1, day: d }
}

function formatDisplay(iso: string) {
  const p = parseISO(iso)
  if (!p) return ''
  return `${String(p.day).padStart(2, '0')}/${String(p.month + 1).padStart(2, '0')}/${p.year}`
}

export function DatePicker({ value, onChange, placeholder = 'Seleccionar fecha', disabled, className }: Props) {
  const today   = new Date()
  const parsed  = parseISO(value)

  const [open, setOpen]       = useState(false)
  const [viewYear, setYear]   = useState(parsed?.year  ?? today.getFullYear())
  const [viewMonth, setMonth] = useState(parsed?.month ?? today.getMonth())
  const [style, setStyle]     = useState<React.CSSProperties>({})

  const triggerRef   = useRef<HTMLDivElement>(null)
  const calendarRef  = useRef<HTMLDivElement>(null)

  const openCalendar = useCallback(() => {
    if (disabled) return
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const calH = 280

      setStyle({
        position: 'fixed',
        left: rect.left,
        width: Math.max(rect.width, 240),
        zIndex: 9999,
        ...(spaceBelow >= calH
          ? { top:    rect.bottom + 4 }
          : { bottom: window.innerHeight - rect.top + 4 }),
      })
    }
    if (parsed) { setYear(parsed.year); setMonth(parsed.month) }
    else         { setYear(today.getFullYear()); setMonth(today.getMonth()) }
    setOpen(true)
  }, [disabled, parsed, today])

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      const target = e.target as Node
      if (
        calendarRef.current && !calendarRef.current.contains(target) &&
        triggerRef.current  && !triggerRef.current.contains(target)
      ) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  function prevMonth() {
    if (viewMonth === 0) { setMonth(11); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setMonth(0); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
  }

  function selectDay(day: number) {
    onChange(toISO(viewYear, viewMonth, day))
    setOpen(false)
  }

  function selectToday() {
    onChange(toISO(today.getFullYear(), today.getMonth(), today.getDate()))
    setOpen(false)
  }

  // Build calendar grid (Monday-first)
  const daysInMonth   = new Date(viewYear, viewMonth + 1, 0).getDate()
  const rawFirstDay   = new Date(viewYear, viewMonth, 1).getDay() // 0=Sun
  const firstDayMon   = (rawFirstDay + 6) % 7                     // shift to Monday=0
  const cells: (number | null)[] = Array(firstDayMon).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const isToday    = (d: number) =>
    d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear()
  const isSelected = (d: number) =>
    !!parsed && d === parsed.day && viewMonth === parsed.month && viewYear === parsed.year

  const displayValue = formatDisplay(value)

  return (
    <div className={`relative ${className ?? ''}`}>
      {/* Trigger */}
      <div
        ref={triggerRef}
        onClick={openCalendar}
        className={[
          'flex h-9 items-center justify-between rounded-sm border px-3 text-sm select-none',
          disabled
            ? 'cursor-not-allowed border-zinc-200 bg-zinc-50 text-zinc-500'
            : 'cursor-pointer border-zinc-200 bg-white',
          open && !disabled ? 'border-blue-500 ring-1 ring-blue-500' : '',
        ].join(' ')}
      >
        <span className={displayValue ? 'text-zinc-900' : 'text-zinc-400'}>
          {displayValue || placeholder}
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
          <CalendarDays size={13} className="text-zinc-400" />
        </div>
      </div>

      {/* Calendar — fixed to escape overflow:hidden */}
      {open && (
        <div
          ref={calendarRef}
          style={style}
          className="rounded-sm border border-zinc-200 bg-white shadow-lg"
        >
          {/* Month navigation */}
          <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2.5">
            <button
              type="button"
              onClick={prevMonth}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-semibold text-zinc-800">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Grid */}
          <div className="p-2">
            {/* Weekday headers */}
            <div className="mb-1 grid grid-cols-7 text-center">
              {WEEKDAYS.map((d) => (
                <span key={d} className="py-1 text-[10px] font-semibold text-zinc-400">{d}</span>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 text-center">
              {cells.map((day, i) => (
                <div key={i} className="flex items-center justify-center p-0.5">
                  {day ? (
                    <button
                      type="button"
                      onClick={() => selectDay(day)}
                      className={[
                        'flex h-7 w-7 items-center justify-center rounded-sm text-xs font-medium transition-colors',
                        isSelected(day)
                          ? 'bg-blue-600 text-white'
                          : isToday(day)
                            ? 'border border-blue-300 text-blue-700 hover:bg-blue-50'
                            : 'text-zinc-700 hover:bg-zinc-100',
                      ].join(' ')}
                    >
                      {day}
                    </button>
                  ) : (
                    <span />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-zinc-100 px-3 py-2">
            <button
              type="button"
              onClick={selectToday}
              className="text-xs text-zinc-500 underline hover:text-zinc-900"
            >
              Hoy
            </button>
            {value && (
              <button
                type="button"
                onClick={() => { onChange(''); setOpen(false) }}
                className="text-xs text-zinc-400 hover:text-zinc-700"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
