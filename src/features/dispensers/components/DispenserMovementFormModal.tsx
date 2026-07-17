import { useEffect, useState, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, Plus, Trash2 } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { DispenserMovement, DispenserMovementFormData, DispenserMovementType } from '../types'
import {
  fetchAguasLocations,
  fetchAguasStates,
  createDispenserMovement,
  updateDispenserMovement,
} from '../services/dispensers.service'
import {
  FormSection,
  FormField,
  selectClassName,
  DatePicker,
} from '@/shared/components/ui'

const TODAY = new Date().toISOString().split('T')[0]

const schema = z.object({
  type:         z.enum(['LOAD', 'UNLOAD']),
  routeCode:    z.string().min(1, 'Ingresar código de reparto'),
  technician:   z.string().min(1, 'Ingresar técnico'),
  locationId:   z.coerce.number().optional(),
  stateId:      z.coerce.number().optional(),
  movementDate: z.string().min(1, 'Seleccionar fecha'),
  serials:      z.array(z.string()).min(1, 'Ingresar al menos un serial'),
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
  }
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
    save(data as DispenserMovementFormData)
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
  }

  function handleSerialKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSerial()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-16">
      <div className="w-full max-w-xl rounded-sm border border-zinc-200 bg-white shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3.5">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">
              {isEditing ? 'Editar movimiento' : 'Nuevo movimiento'}
            </h2>
            <p className="mt-0.5 text-[11px] text-zinc-400">
              {isEditing ? 'Corrección — cancela el anterior en Aguas' : 'Carga o descarga de dispensers'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:text-zinc-700"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="max-h-[70vh] overflow-y-auto px-5 py-4 space-y-5">

            {/* Type toggle */}
            <FormSection title="Tipo de movimiento">
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <div className="flex gap-2">
                    {(['LOAD', 'UNLOAD'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => field.onChange(t)}
                        className={[
                          'flex-1 rounded-sm border py-2 text-xs font-semibold uppercase tracking-wide transition-colors',
                          field.value === t
                            ? t === 'LOAD'
                              ? 'border-blue-300 bg-blue-50 text-blue-700'
                              : 'border-amber-300 bg-amber-50 text-amber-700'
                            : 'border-zinc-200 bg-white text-zinc-400 hover:border-zinc-300 hover:text-zinc-600',
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
            <FormSection title="Datos del movimiento">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Código de reparto" error={errors.routeCode?.message}>
                  <input
                    {...register('routeCode')}
                    placeholder="Ej: R001"
                    className="h-8 w-full rounded-sm border border-zinc-200 px-2.5 text-xs text-zinc-900 focus:border-zinc-400 focus:outline-none"
                  />
                </FormField>

                <FormField label="Técnico" error={errors.technician?.message}>
                  <input
                    {...register('technician')}
                    placeholder="Nombre del técnico"
                    className="h-8 w-full rounded-sm border border-zinc-200 px-2.5 text-xs text-zinc-900 focus:border-zinc-400 focus:outline-none"
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
            <FormSection title="Configuración Aguas">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Ubicación" error={errors.locationId?.message}>
                  <select
                    {...register('locationId')}
                    className={`${selectClassName} h-8 w-full text-xs`}
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
                    className={`${selectClassName} h-8 w-full text-xs`}
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
            <FormSection title="Seriales">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    ref={serialRef}
                    value={serialInput}
                    onChange={(e) => setSerialInput(e.target.value)}
                    onKeyDown={handleSerialKeyDown}
                    placeholder="Ingresar serial y presionar Enter"
                    className="h-8 flex-1 rounded-sm border border-zinc-200 px-2.5 text-xs text-zinc-900 focus:border-zinc-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addSerial}
                    className="flex h-8 items-center gap-1.5 rounded-sm border border-zinc-200 bg-white px-3 text-xs text-zinc-600 hover:border-zinc-300 hover:text-zinc-900"
                  >
                    <Plus size={13} />
                    Agregar
                  </button>
                </div>

                {errors.serials && (
                  <p className="text-[11px] text-red-600">{errors.serials.message}</p>
                )}

                {serials && serials.length > 0 && (
                  <div className="max-h-40 overflow-y-auto rounded-sm border border-zinc-100 bg-zinc-50">
                    {serials.map((s) => (
                      <div
                        key={s}
                        className="flex items-center justify-between border-b border-zinc-100 px-3 py-1.5 last:border-0"
                      >
                        <span className="font-mono text-xs text-zinc-700">{s}</span>
                        <button
                          type="button"
                          onClick={() => removeSerial(s)}
                          className="rounded p-0.5 text-zinc-300 hover:text-red-500"
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
            <div className="border-t border-red-100 bg-red-50 px-5 py-2.5">
              <p className="text-xs text-red-700">{(error as Error).message}</p>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-zinc-200 px-5 py-3.5">
            <button
              type="button"
              onClick={onClose}
              className="h-8 rounded-sm border border-zinc-200 bg-white px-4 text-xs text-zinc-700 hover:border-zinc-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex h-8 items-center gap-1.5 rounded-sm bg-blue-600 px-4 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
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
