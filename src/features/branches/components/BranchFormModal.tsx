import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import type { Branch, BranchFormData } from '../types'
import { createBranch, updateBranch } from '../services/branches.service'
import {
  FormSection,
  FormField,
  inputClassName,
  selectClassName,
} from '@/shared/components/ui'

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

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">
              {isEditing ? 'Editar sucursal' : 'Nueva sucursal'}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {isEditing ? `Modificando ${branch.name}` : 'Complete los datos de la nueva sucursal'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 rounded p-1 hover:bg-zinc-100"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            <FormSection title="Identificación">
              <FormField label="Código de sucursal" htmlFor="code" required error={errors.code?.message}>
                <input id="code" className={inputClassName} {...register('code')} />
              </FormField>
              <FormField label="Nombre" htmlFor="name" required error={errors.name?.message} fullWidth>
                <input id="name" className={inputClassName} {...register('name')} />
              </FormField>
            </FormSection>

            <FormSection title="Ubicación">
              <FormField label="Dirección" htmlFor="address" required error={errors.address?.message} fullWidth>
                <input id="address" className={inputClassName} {...register('address')} />
              </FormField>
              <FormField label="Ciudad" htmlFor="city" required error={errors.city?.message}>
                <input id="city" className={inputClassName} {...register('city')} />
              </FormField>
              <FormField label="Provincia" htmlFor="province" required error={errors.province?.message}>
                <input id="province" className={inputClassName} {...register('province')} />
              </FormField>
            </FormSection>

            <FormSection title="Datos fiscales">
              <FormField
                label="CUIT (11 dígitos sin guiones)"
                htmlFor="cuit"
                required
                error={errors.cuit?.message}
              >
                <input id="cuit" className={inputClassName} maxLength={11} {...register('cuit')} />
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
                  className={inputClassName}
                  maxLength={10}
                  {...register('vatCondition')}
                />
              </FormField>
            </FormSection>

            <FormSection title="Estado operativo">
              <FormField label="Estado" htmlFor="status" required error={errors.status?.message}>
                <select id="status" className={selectClassName} {...register('status')}>
                  <option value="active">Activa</option>
                  <option value="inactive">Inactiva</option>
                </select>
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
                {mutation.isPending ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear sucursal'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
