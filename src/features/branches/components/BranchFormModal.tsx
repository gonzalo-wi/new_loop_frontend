import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, Building2, MapPin, Landmark, CircleDot, Hash, CheckCircle2, XCircle } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import type { Branch, BranchFormData } from '../types'
import { createBranch, updateBranch } from '../services/branches.service'
import { FormSection, FormField } from '@/shared/components/ui'
import { useEscapeKey } from '@/shared/hooks/useEscapeKey'

// Premium input treatment — same language introduced in the Deliveries modal.
const fancyInput =
  'h-10 w-full rounded-lg border border-zinc-200 bg-white shadow-card px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition-all duration-150 hover:border-zinc-300 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 disabled:bg-zinc-100 disabled:text-zinc-400'

const schema = z.object({
  code: z.string().min(1, 'Requerido').max(20, 'Máximo 20 caracteres').toUpperCase(),
  name: z.string().min(2, 'Mínimo 2 caracteres').max(80),
  address: z.string().min(3, 'Requerido'),
  city: z.string().min(2, 'Requerido'),
  province: z.string().min(2, 'Requerido'),
  cuit: z
    .string()
    .regex(/^\d{11}$/, 'CUIT debe tener 11 dígitos (sin guiones)'),
  vatCondition: z.string().min(1, 'Requerido'),
  companyName: z.string().max(150).optional(),
  phone: z.string().max(50).optional(),
  status: z.enum(['active', 'inactive']),
})

type FormData = z.infer<typeof schema>

type Props = {
  branch: Branch | null
  onClose: () => void
  onSuccess: () => void
}

export function BranchFormModal({ branch, onClose, onSuccess }: Props) {
  const isEditing = !!branch

  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: branch
      ? {
          code: branch.code,
          name: branch.name,
          address: branch.address,
          city: branch.city,
          province: branch.province,
          cuit: branch.cuit.replace(/\D/g, ''),
          vatCondition: branch.vatCondition,
          companyName: branch.companyName ?? '',
          phone: branch.phone ?? '',
          status: branch.status as 'active' | 'inactive',
        }
      : { status: 'active' },
  })

  useEffect(() => {
    reset(
      branch
        ? {
            code: branch.code,
            name: branch.name,
            address: branch.address,
            city: branch.city,
            province: branch.province,
            cuit: branch.cuit.replace(/\D/g, ''),
            vatCondition: branch.vatCondition,
            companyName: branch.companyName ?? '',
            phone: branch.phone ?? '',
            status: branch.status as 'active' | 'inactive',
          }
        : { status: 'active' }
    )
  }, [branch, reset])

  const mutation = useMutation({
    mutationFn: (data: BranchFormData) =>
      isEditing ? updateBranch(branch.id, data) : createBranch(data),
    onSuccess,
    onError: (err) => {
      const msg = err instanceof Error ? err.message : 'Error inesperado'
      setError('root', { message: msg })
    },
  })

  function onSubmit(data: FormData) {
    mutation.mutate(data as BranchFormData)
  }

  useEscapeKey(onClose)

  return (
    <div className="fixed inset-0 z-50 flex justify-end p-3">
      <div className="absolute inset-0 animate-fade-in bg-zinc-900/30" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-xl animate-drawer-in flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-100">
              <Building2 size={16} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-zinc-900">
                {isEditing ? 'Editar sucursal' : 'Nueva sucursal'}
              </h2>
              <p className="mt-0.5 text-sm text-zinc-500">
                {isEditing ? `Modificando ${branch.name}` : 'Complete los datos de la nueva sucursal'}
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

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            <FormSection title="Identificación" icon={Building2}>
              <FormField label="Código de sucursal" htmlFor="code" required error={errors.code?.message}>
                <div className="relative">
                  <Hash size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input id="code" className={`${fancyInput} pl-9`} {...register('code')} />
                </div>
              </FormField>
              <FormField label="Nombre" htmlFor="name" required error={errors.name?.message} fullWidth>
                <input id="name" className={fancyInput} {...register('name')} />
              </FormField>
            </FormSection>

            <FormSection title="Ubicación" icon={MapPin}>
              <FormField label="Dirección" htmlFor="address" required error={errors.address?.message} fullWidth>
                <input id="address" className={fancyInput} {...register('address')} />
              </FormField>
              <FormField label="Ciudad" htmlFor="city" required error={errors.city?.message}>
                <input id="city" className={fancyInput} {...register('city')} />
              </FormField>
              <FormField label="Provincia" htmlFor="province" required error={errors.province?.message}>
                <input id="province" className={fancyInput} {...register('province')} />
              </FormField>
            </FormSection>

            <FormSection title="Datos fiscales" icon={Landmark}>
              <FormField
                label="CUIT (11 dígitos sin guiones)"
                htmlFor="cuit"
                required
                error={errors.cuit?.message}
              >
                <input id="cuit" className={`${fancyInput} font-mono tracking-wider`} maxLength={11} {...register('cuit')} />
              </FormField>
              <FormField
                label="Condición IVA"
                htmlFor="vatCondition"
                required
                error={errors.vatCondition?.message}
                hint="Ej: 3"
              >
                <input
                  id="vatCondition"
                  className={fancyInput}
                  maxLength={10}
                  {...register('vatCondition')}
                />
              </FormField>
              <FormField
                label="Razón social"
                htmlFor="companyName"
                error={errors.companyName?.message}
                hint="Aparece en el encabezado del remito. Ej: El Jumillano S.A."
              >
                <input
                  id="companyName"
                  className={fancyInput}
                  placeholder="El Jumillano S.A."
                  {...register('companyName')}
                />
              </FormField>
              <FormField
                label="Teléfono"
                htmlFor="phone"
                error={errors.phone?.message}
                hint="Contacto de la sucursal. Ej: 0800-333-3090"
              >
                <input
                  id="phone"
                  className={fancyInput}
                  placeholder="0800-333-3090"
                  {...register('phone')}
                />
              </FormField>
            </FormSection>

            <FormSection title="Estado operativo" icon={CircleDot}>
              <FormField label="Estado" required error={errors.status?.message} fullWidth>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => field.onChange('active')}
                        className={`flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm font-medium transition-all ${
                          field.value === 'active'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-4 ring-emerald-500/10'
                            : 'border-zinc-200 bg-zinc-50/60 text-zinc-600 hover:border-zinc-300'
                        }`}
                      >
                        <CheckCircle2 size={15} className={field.value === 'active' ? 'text-emerald-600' : 'text-zinc-400'} />
                        Activa
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange('inactive')}
                        className={`flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm font-medium transition-all ${
                          field.value === 'inactive'
                            ? 'border-zinc-400 bg-zinc-100 text-zinc-700 ring-4 ring-zinc-400/10'
                            : 'border-zinc-200 bg-zinc-50/60 text-zinc-600 hover:border-zinc-300'
                        }`}
                      >
                        <XCircle size={15} className={field.value === 'inactive' ? 'text-zinc-500' : 'text-zinc-400'} />
                        Inactiva
                      </button>
                    </div>
                  )}
                />
              </FormField>
            </FormSection>
          </div>

          {/* Footer */}
          <div className="border-t border-zinc-100 bg-white px-6 py-4">
            {errors.root && (
              <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                {errors.root.message}
              </p>
            )}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={mutation.isPending}
                className="h-10 rounded-lg border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-700 shadow-card transition-colors hover:bg-zinc-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-medium text-white shadow-card transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {mutation.isPending && <Loader2 size={13} className="animate-spin" />}
                {mutation.isPending ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear sucursal'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
