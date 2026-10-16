import { useEffect, useState, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, Plus, Trash2, Droplets, ArrowLeftRight, ClipboardList, Settings2, Hash, ShoppingBag } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { DispenserMovement, DispenserMovementFormData, DispenserMovementType } from '../types'
import {
  fetchAguasLocations,
  fetchAguasStates,
  createDispenserMovement,
  updateDispenserMovement,
} from '../services/dispensers.service'
import { baggedSerialsToSend, isBagged, toggleBagged } from '../bagged'
import {
  FormSection,
  FormField,
  inputClassName,
  selectClassName,
  DatePicker,
} from '@/shared/components/ui'
import { useEscapeKey } from '@/shared/hooks/useEscapeKey'
import { localISODate } from '@/shared/lib/utils'

const TODAY = localISODate()

const schema = z.object({
  type:         z.enum(['LOAD', 'UNLOAD']),
  routeCode:    z.string().min(1, 'Ingresar código de reparto'),
  technician:   z.string().min(1, 'Ingresar técnico'),
  locationId:   z.coerce.number().optional(),
  stateId:      z.coerce.number().optional(),
  movementDate: z.string().min(1, 'Seleccionar fecha'),
  serials:      z.array(z.string()).min(1, 'Ingresar al menos un serial'),
  // Unload only; also carried on edit so updating an unload (cancel + recreate) does not drop the marks.
  baggedSerials: z.array(z.string()),
})

type FormData = z.infer<typeof schema>

type Props = {
  movement: DispenserMovement | null
  onClose: () => void
  onSuccess: () => void
}

const TYPE_DEFAULTS: Record<DispenserMovementType, { locationId: number; stateId: number }> = {
  LOAD:   { locationId: 2,  stateId: 2 },
  UNLOAD: { locationId: 49, stateId: 4 },
}

function buildDefaults(movement: DispenserMovement | null): FormData {
  if (movement) {
    return {
      type:         movement.type,
      routeCode:    movement.routeCode,
      technician:   movement.technician,
      locationId:   movement.locationId,
      stateId:      movement.stateId,
      movementDate: movement.movementDate,
      serials:      movement.serials,
      baggedSerials: movement.baggedSerials ?? [],
    }
  }
  return {
    type:         'LOAD',
    routeCode:    '',
    technician:   '',
    locationId:   TYPE_DEFAULTS.LOAD.locationId,
    stateId:      TYPE_DEFAULTS.LOAD.stateId,
    movementDate: TODAY,
    serials:      [],
    baggedSerials: [],
  }
}

function BaggedToggle({ serial, checked, onToggle }: { serial: string; checked: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={`Embolsado ${serial}`}
      title={checked ? 'Volvió embolsado: no necesita pasar por reparación' : 'Marcar como embolsado'}
      onClick={onToggle}
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-px text-[10px] font-medium uppercase tracking-wide transition-colors ${
        checked
          ? 'border-amber-300 bg-amber-50 text-amber-700'
          : 'border-zinc-200 bg-white text-zinc-400 hover:border-amber-200 hover:text-amber-700'
      }`}
    >
      <ShoppingBag size={10} />
      Embolsado
    </button>
  )
}

export function DispenserMovementFormModal({ movement, onClose, onSuccess }: Props) {
  const isEditing = !!movement
  const queryClient = useQueryClient()

  const [serialInput, setSerialInput] = useState('')
  const serialRef = useRef<HTMLInputElement>(null)

  const { data: locations } = useQuery({
    queryKey: ['aguas-locations'],
    queryFn: fetchAguasLocations,
    staleTime: 10 * 60_000,
  })

  const { data: states } = useQuery({
    queryKey: ['aguas-states'],
    queryFn: fetchAguasStates,
    staleTime: 10 * 60_000,
  })

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: buildDefaults(movement),
  })

  const type     = watch('type')
  const serials  = watch('serials')
  const bagged   = watch('baggedSerials')

  // When type changes, reset location/state to sensible defaults (only on new)
  useEffect(() => {
    if (!isEditing) {
      setValue('locationId', TYPE_DEFAULTS[type].locationId)
      setValue('stateId',    TYPE_DEFAULTS[type].stateId)
    }
  }, [type, isEditing, setValue])

  const locationOptions =
    type === 'LOAD'
      ? (locations?.salida_camion ?? [])
      : (locations?.vuelta_camion ?? [])

  const stateOptions =
    type === 'LOAD'
      ? (states?.salida_camion ?? [])
      : (states?.vuelta_camion ?? [])

  const { mutate: save, isPending, error } = useMutation({
    mutationFn: (data: DispenserMovementFormData) =>
      isEditing
        ? updateDispenserMovement(movement!.id, data)
        : createDispenserMovement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispenser-movements'] })
      onSuccess()
    },
  })

  function onSubmit(data: FormData) {
    save({ ...data, baggedSerials: baggedSerialsToSend(data.type, data.serials, data.baggedSerials) } as DispenserMovementFormData)
  }

  function addSerial() {
    const val = serialInput.trim().toUpperCase()
    if (!val) return
    const current = serials ?? []
    if (!current.includes(val)) {
      setValue('serials', [...current, val], { shouldValidate: true })
    }
    setSerialInput('')
    serialRef.current?.focus()
  }

  function removeSerial(s: string) {
    setValue('serials', (serials ?? []).filter((x) => x !== s), { shouldValidate: true })
    // So a removed serial does not come back already marked if it is added again.
    setValue('baggedSerials', (bagged ?? []).filter((b) => b.toUpperCase() !== s.toUpperCase()))
  }

  function handleSerialKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSerial()
    }
  }

  useEscapeKey(onClose)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16">
      <div className="absolute inset-0 animate-fade-in bg-zinc-900/30" onClick={onClose} />
      <div className="relative w-full max-w-xl animate-dialog-in overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-100">
              <Droplets size={16} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-zinc-900">
                {isEditing ? 'Editar movimiento' : 'Nuevo movimiento'}
              </h2>
              <p className="mt-0.5 text-sm text-zinc-500">
                {isEditing ? 'Corrección — cancela el anterior en Aguas' : 'Carga o descarga de dispensers'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="-mr-2 -mt-1 rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-6">

            {/* Type toggle */}
            <FormSection title="Tipo de movimiento" icon={ArrowLeftRight}>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <div className="flex gap-2 sm:col-span-2">
                    {(['LOAD', 'UNLOAD'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => field.onChange(t)}
                        className={[
                          'flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors',
                          field.value === t
                            ? t === 'LOAD'
                              ? 'border-blue-500 bg-blue-50 text-blue-700 ring-4 ring-blue-500/10'
                              : 'border-amber-500 bg-amber-50 text-amber-700 ring-4 ring-amber-500/10'
                            : 'border-zinc-200 bg-white text-zinc-500 shadow-card hover:border-zinc-300 hover:text-zinc-800',
                        ].join(' ')}
                      >
                        {t === 'LOAD' ? 'Carga (Salida)' : 'Descarga (Vuelta)'}
                      </button>
                    ))}
                  </div>
                )}
              />
            </FormSection>

            {/* Route & Technician */}
            <FormSection title="Datos del movimiento" icon={ClipboardList}>
              <div className="grid grid-cols-2 gap-4 sm:col-span-2">
                <FormField label="Código de reparto" error={errors.routeCode?.message}>
                  <input
                    {...register('routeCode')}
                    placeholder="Ej: R001"
                    className={inputClassName}
                  />
                </FormField>

                <FormField label="Técnico" error={errors.technician?.message}>
                  <input
                    {...register('technician')}
                    placeholder="Nombre del técnico"
                    className={inputClassName}
                  />
                </FormField>

                <FormField label="Fecha" error={errors.movementDate?.message}>
                  <Controller
                    control={control}
                    name="movementDate"
                    render={({ field }) => (
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Seleccionar fecha"
                        className="w-full"
                      />
                    )}
                  />
                </FormField>
              </div>
            </FormSection>

            {/* Location & State from Aguas */}
            <FormSection title="Configuración Aguas" icon={Settings2}>
              <div className="grid grid-cols-2 gap-4 sm:col-span-2">
                <FormField label="Ubicación" error={errors.locationId?.message}>
                  <select
                    {...register('locationId')}
                    className={selectClassName}
                    disabled={locationOptions.length === 0}
                  >
                    {locationOptions.length === 0 && (
                      <option value="">Cargando...</option>
                    )}
                    {locationOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.descripcion}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Estado" error={errors.stateId?.message}>
                  <select
                    {...register('stateId')}
                    className={selectClassName}
                    disabled={stateOptions.length === 0}
                  >
                    {stateOptions.length === 0 && (
                      <option value="">Cargando...</option>
                    )}
                    {stateOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.descripcion}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
            </FormSection>

            {/* Serials */}
            <FormSection title="Seriales" icon={Hash}>
              <div className="space-y-2 sm:col-span-2">
                <div className="flex gap-2">
                  <input
                    ref={serialRef}
                    value={serialInput}
                    onChange={(e) => setSerialInput(e.target.value)}
                    onKeyDown={handleSerialKeyDown}
                    placeholder="Ingresar serial y presionar Enter"
                    className={`${inputClassName} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={addSerial}
                    className="flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 text-sm font-medium text-zinc-700 shadow-card hover:border-zinc-300 hover:bg-zinc-50"
                  >
                    <Plus size={13} />
                    Agregar
                  </button>
                </div>

                {errors.serials && (
                  <p className="text-[11px] text-red-600">{errors.serials.message}</p>
                )}

                {serials && serials.length > 0 && (
                  <div className="max-h-40 overflow-y-auto rounded-md border border-zinc-100 bg-zinc-50">
                    {serials.map((s) => (
                      <div
                        key={s}
                        className="flex items-center justify-between border-b border-zinc-100 px-3 py-1.5 last:border-0"
                      >
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-xs text-zinc-700">{s}</span>
                          {type === 'UNLOAD' && (
                            <BaggedToggle
                              serial={s}
                              checked={isBagged(s, bagged ?? [])}
                              onToggle={() => setValue('baggedSerials', toggleBagged(s, bagged ?? []))}
                            />
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeSerial(s)}
                          className="rounded-md p-0.5 text-zinc-300 hover:text-red-500"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-[11px] text-zinc-400">
                  {serials?.length ?? 0} serial{(serials?.length ?? 0) !== 1 ? 'es' : ''} ingresado{(serials?.length ?? 0) !== 1 ? 's' : ''}
                </p>
              </div>
            </FormSection>
          </div>

          {/* Footer */}
          {error && (
            <div className="mx-6 mb-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5">
              <p className="text-sm text-red-700">{(error as Error).message}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-zinc-100 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-lg border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-700 shadow-card transition-colors hover:bg-zinc-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-medium text-white shadow-card transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending && <Loader2 size={12} className="animate-spin" />}
              {isEditing ? 'Guardar corrección' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
