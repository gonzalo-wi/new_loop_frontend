import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarOff, Loader2, Plus, Trash2 } from 'lucide-react'
import {
  PageHeader,
  Panel,
  LoadingState,
  ErrorState,
  EmptyState,
  ConfirmDialog,
  DatePicker,
  inputClassName,
} from '@/shared/components/ui'
import { cn, localISODate } from '@/shared/lib/utils'
import { useAuthStore } from '@/features/auth/store/auth.store'
import type { Holiday } from '../types'
import { createHoliday, deleteHoliday, fetchHolidays } from '../services/holidays.service'

const QUERY_KEY = ['holidays']

function formatHolidayDate(date: string): string {
  // "lunes 23/11/2026": the weekday helps spot a wrong date at a glance.
  return format(parseISO(date), "EEEE dd/MM/yyyy", { locale: es })
}

export function HolidaysPage() {
  const queryClient = useQueryClient()
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin')
  const today = localISODate()

  const [date, setDate] = useState(today)
  const [description, setDescription] = useState('')
  const [toDelete, setToDelete] = useState<Holiday | null>(null)

  const { data: holidays, isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchHolidays,
  })

  const create = useMutation({
    mutationFn: createHoliday,
    onSuccess: () => {
      setDescription('')
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })

  const remove = useMutation({
    mutationFn: deleteHoliday,
    onSuccess: () => {
      setToDelete(null)
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!date || create.isPending) return
    create.mutate({ date, description })
  }

  return (
    <div className="pb-8">
      <PageHeader
        title="Feriados"
        description="En estas fechas el remito de salida se imprime sin los datos de la empresa. El control se manda a Aguas igual que cualquier otro día."
      />

      <div className="space-y-5 px-6">
        {isAdmin && (
          <Panel>
            <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 px-4 py-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Fecha</label>
                <DatePicker value={date} onChange={setDate} className="w-40" />
              </div>
              <div className="min-w-[16rem] flex-1">
                <label htmlFor="holiday-description" className="mb-1 block text-xs font-medium text-zinc-500">
                  Descripción (opcional)
                </label>
                <input
                  id="holiday-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={120}
                  placeholder="Ej: Día de la Soberanía Nacional"
                  className={inputClassName}
                />
              </div>
              <button
                type="submit"
                disabled={!date || create.isPending}
                className="flex h-9 items-center gap-1.5 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {create.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Agregar feriado
              </button>
            </form>
            {create.isError && (
              <p role="alert" className="border-t border-zinc-100 px-4 py-2 text-xs text-red-600">
                {create.error.message}
              </p>
            )}
          </Panel>
        )}

        <Panel>
          {isLoading ? (
            <LoadingState />
          ) : isError ? (
            <ErrorState onRetry={refetch} />
          ) : !holidays || holidays.length === 0 ? (
            <EmptyState
              icon={CalendarOff}
              title="Sin feriados cargados"
              description={
                isAdmin
                  ? 'Agregá las fechas feriado para que esos días el remito salga sin los datos de la empresa.'
                  : 'Todavía no hay feriados cargados desde este mes.'
              }
              className="py-16"
            />
          ) : (
            <ul className="divide-y divide-zinc-100">
              {holidays.map((h) => {
                const isToday = h.date === today
                return (
                  <li key={h.id} className="flex items-center gap-4 px-4 py-3">
                    <span
                      className={cn(
                        'w-48 shrink-0 text-sm capitalize tabular-nums',
                        isToday ? 'font-semibold text-blue-700' : 'text-zinc-800'
                      )}
                    >
                      {formatHolidayDate(h.date)}
                    </span>
                    {isToday && (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                        Hoy
                      </span>
                    )}
                    <span className="flex-1 truncate text-sm text-zinc-500">{h.description ?? '—'}</span>
                    {isAdmin && (
                      <button
                        onClick={() => setToDelete(h)}
                        className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                        title="Borrar feriado"
                        aria-label={`Borrar feriado del ${formatHolidayDate(h.date)}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>
      </div>

      {toDelete && (
        <ConfirmDialog
          open
          variant="danger"
          title="Borrar feriado"
          description={
            remove.isError
              ? remove.error.message
              : `El ${formatHolidayDate(toDelete.date)} deja de ser feriado: los remitos de ese día vuelven a salir con los datos de la empresa.`
          }
          confirmLabel="Borrar"
          isLoading={remove.isPending}
          onClose={() => {
            setToDelete(null)
            remove.reset()
          }}
          onConfirm={() => remove.mutate(toDelete.id)}
        />
      )}
    </div>
  )
}
