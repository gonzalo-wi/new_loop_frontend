import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, Route, Hash, Truck, FileText } from 'lucide-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { Delivery, DeliveryFormData } from '../types'
import { createDelivery, updateDelivery } from '../services/deliveries.service'
import { fetchBranches } from '@/features/branches/services/branches.service'
import { fetchUsers } from '@/features/users/services/users.service'
import {
  FormSection,
  FormField,
  Combobox,
} from '@/shared/components/ui'

// Premium input treatment for this form: soft resting background, larger
// focus ring "glow" and softer corners — a step up from the standard
// shared inputClassName used across other forms.
const fancyInput =
  'h-10 w-full rounded-md border border-zinc-200 bg-zinc-50/60 px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition-all duration-150 hover:border-zinc-300 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 disabled:bg-zinc-100 disabled:text-zinc-400'

const fancyTextarea =
  'w-full rounded-md border border-zinc-200 bg-zinc-50/60 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition-all duration-150 hover:border-zinc-300 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 disabled:bg-zinc-100 disabled:text-zinc-400 resize-none'

const schema = z.object({
  // Numbers only: the code becomes the delivery_id sent to Aguas, and Aguas
  // rejects anything with letters (legacy codes like "rto1" must be migrated).
  code: z
    .string()
    .min(1, 'Requerido')
    .max(50)
    .regex(/^\d+$/, 'Solo números, sin letras (ej: 1, 2, 9). Aguas rechaza códigos con letras.'),
  branchId:     z.string().min(1, 'Seleccionar una sucursal'),
  driverId:     z.string().optional(),
  driver:       z.string().max(150).optional(),
  truckPlate:   z.string().max(20).optional(),
  observations: z.string().max(500).optional(),
})

type FormData = z.infer<typeof schema>

type Props = {
  delivery: Delivery | null
  onClose: () => void
  onSuccess: () => void
}

export function DeliveryFormModal({ delivery, onClose, onSuccess }: Props) {
  const isEditing = !!delivery

  const { data: branches = [], isLoading: loadingBranches } = useQuery({
    queryKey: ['branches'],
    queryFn: fetchBranches,
  })

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  })

  const activeBranches = branches.filter((b) => b.status === 'active')
  const driverUsers    = users.filter((u) => u.status === 'active' && u.role === 'delivery_driver')

  function buildDefaults(d: Delivery | null) {
    return d
      ? {
          code:         d.code,
          branchId:     d.branchId,
          driverId:     d.driverId ?? '',
          driver:       d.driver ?? '',
          truckPlate:   d.truckPlate ?? '',
          observations: d.observations ?? '',
        }
      : { code: '', branchId: '', driverId: '', driver: '', truckPlate: '', observations: '' }
  }

  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: buildDefaults(delivery),
  })

  useEffect(() => { reset(buildDefaults(delivery)) }, [delivery]) // eslint-disable-line

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const formData: DeliveryFormData = {
        code:         data.code,
        branchId:     data.branchId,
        driverId:     data.driverId     || undefined,
        driver:       data.driver       || undefined,
        truckPlate:   data.truckPlate   || undefined,
        observations: data.observations || undefined,
      }
      return isEditing ? updateDelivery(delivery.id, formData) : createDelivery(formData)
    },
    onSuccess,
    onError: (err) => {
      setError('root', { message: err instanceof Error ? err.message : 'Error inesperado' })
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/25" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-zinc-900 text-white">
              <Route size={16} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">
                {isEditing ? 'Editar reparto' : 'Nuevo reparto'}
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                {isEditing
                  ? `Modificando ${delivery.code}`
                  : 'Complete los datos del nuevo reparto'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-sm p-1.5 text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-700"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
            <FormSection title="Identificación" icon={Hash}>
              <FormField
                label="Código"
                htmlFor="code"
                required
                error={errors.code?.message}
                hint="Solo números (ej: 1, 2, 9). Debe ser único."
              >
                <div className="relative">
                  <Hash size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    id="code"
                    className={`${fancyInput} pl-9`}
                    inputMode="numeric"
                    placeholder="1"
                    {...register('code')}
                  />
                </div>
              </FormField>
              <FormField
                label="Sucursal"
                htmlFor="branchId"
                required
                error={errors.branchId?.message}
              >
                <Controller
                  control={control}
                  name="branchId"
                  render={({ field }) => (
                    <Combobox
                      value={field.value}
                      onChange={field.onChange}
                      disabled={loadingBranches}
                      placeholder={loadingBranches ? 'Cargando...' : 'Seleccionar sucursal...'}
                      searchPlaceholder="Nombre o código..."
                      options={activeBranches.map((b) => ({
                        value:    b.id,
                        label:    b.name,
                        sublabel: `${b.code} · ${b.city}`,
                      }))}
                    />
                  )}
                />
              </FormField>
            </FormSection>

            <FormSection title="Conductor y vehículo" icon={Truck}>
              <FormField
                label="Usuario repartidor"
                error={errors.driverId?.message}
                hint="Vincula el reparto a un usuario del sistema"
                fullWidth
              >
                <Controller
                  control={control}
                  name="driverId"
                  render={({ field }) => (
                    <Combobox
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      placeholder="Buscar repartidor..."
                      searchPlaceholder="Nombre o usuario..."
                      options={driverUsers.map((u) => ({
                        value:    u.id,
                        label:    u.name,
                        sublabel: `@${u.username}`,
                      }))}
                    />
                  )}
                />
              </FormField>

              <div className="flex items-center gap-3 sm:col-span-2">
                <span className="h-px flex-1 bg-zinc-100" />
                <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-300">o</span>
                <span className="h-px flex-1 bg-zinc-100" />
              </div>

              <FormField
                label="Conductor (libre)"
                htmlFor="driver"
                error={errors.driver?.message}
                hint="Nombre manual si no está en el sistema"
              >
                <input id="driver" className={fancyInput} {...register('driver')} />
              </FormField>
              <FormField
                label="Patente"
                htmlFor="truckPlate"
                error={errors.truckPlate?.message}
                hint="Ej: ABC 123"
              >
                <input
                  id="truckPlate"
                  className={`${fancyInput} font-mono uppercase tracking-[0.15em]`}
                  placeholder="ABC 123"
                  style={{ textTransform: 'uppercase' }}
                  {...register('truckPlate')}
                />
              </FormField>
            </FormSection>

            <FormSection title="Observaciones" icon={FileText}>
              <FormField
                label="Observaciones"
                htmlFor="observations"
                error={errors.observations?.message}
                fullWidth
              >
                <textarea
                  id="observations"
                  rows={3}
                  className={fancyTextarea}
                  {...register('observations')}
                />
              </FormField>
            </FormSection>
          </div>

          {/* Footer */}
          <div className="border-t border-zinc-200 bg-zinc-50/60 px-6 py-4">
            {errors.root && (
              <p className="mb-3 rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {errors.root.message}
              </p>
            )}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={mutation.isPending}
                className="h-9 rounded-sm border border-zinc-200 bg-white px-5 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="flex h-9 items-center gap-2 rounded-sm bg-blue-600 px-5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 hover:shadow disabled:opacity-50"
              >
                {mutation.isPending && <Loader2 size={13} className="animate-spin" />}
                {mutation.isPending
                  ? 'Guardando...'
                  : isEditing
                    ? 'Guardar cambios'
                    : 'Crear reparto'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
