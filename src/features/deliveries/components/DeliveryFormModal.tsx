import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2 } from 'lucide-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { Delivery, DeliveryFormData } from '../types'
import { createDelivery, updateDelivery } from '../services/deliveries.service'
import { fetchBranches } from '@/features/branches/services/branches.service'
import { fetchUsers } from '@/features/users/services/users.service'
import {
  FormSection,
  FormField,
  inputClassName,
  selectClassName,
  textareaClassName,
  Combobox,
} from '@/shared/components/ui'

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
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
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
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
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
            <FormSection title="Identificación">
              <FormField
                label="Código"
                htmlFor="code"
                required
                error={errors.code?.message}
                hint="Solo números (ej: 1, 2, 9). Debe ser único."
              >
                <input
                  id="code"
                  className={inputClassName}
                  inputMode="numeric"
                  placeholder="1"
                  {...register('code')}
                />
              </FormField>
              <FormField
                label="Sucursal"
                htmlFor="branchId"
                required
                error={errors.branchId?.message}
              >
                <select
                  id="branchId"
                  className={selectClassName}
                  disabled={loadingBranches}
                  {...register('branchId')}
                >
                  <option value="">
                    {loadingBranches ? 'Cargando...' : 'Seleccionar sucursal...'}
                  </option>
                  {activeBranches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </FormField>
            </FormSection>

            <FormSection title="Conductor y vehículo">
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

              <FormField
                label="Conductor (libre)"
                htmlFor="driver"
                error={errors.driver?.message}
                hint="Nombre manual si no está en el sistema"
              >
                <input id="driver" className={inputClassName} {...register('driver')} />
              </FormField>
              <FormField
                label="Patente"
                htmlFor="truckPlate"
                error={errors.truckPlate?.message}
                hint="Ej: ABC 123"
              >
                <input
                  id="truckPlate"
                  className={inputClassName}
                  style={{ textTransform: 'uppercase' }}
                  {...register('truckPlate')}
                />
              </FormField>
            </FormSection>

            <FormSection title="Observaciones">
              <FormField
                label="Observaciones"
                htmlFor="observations"
                error={errors.observations?.message}
                fullWidth
              >
                <textarea
                  id="observations"
                  rows={3}
                  className={textareaClassName}
                  {...register('observations')}
                />
              </FormField>
            </FormSection>
          </div>

          {/* Footer */}
          <div className="border-t border-zinc-200 px-6 py-4">
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
                className="flex h-9 items-center gap-2 rounded-sm bg-blue-600 px-5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
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
