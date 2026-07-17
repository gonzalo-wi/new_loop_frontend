import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import type { OrderableProduct } from '../types'
import { createOrderableProduct, updateOrderableProduct } from '../services/orderable-products.service'
import {
  FormSection,
  FormField,
  inputClassName,
  textareaClassName,
} from '@/shared/components/ui'

const schema = z
  .object({
    code:         z.string().min(1, 'Requerido').max(50),
    name:         z.string().min(1, 'Requerido'),
    description:  z.string().max(500).optional(),
    allowsUnit:   z.boolean(),
    allowsBulk:   z.boolean(),
    unitsPerBulk: z.coerce.number().int().positive('Debe ser mayor a 0').optional(),
  })
  .refine((d) => !d.allowsBulk || (d.unitsPerBulk !== undefined && d.unitsPerBulk > 0), {
    message: 'Requerido cuando se permite por bulto',
    path:    ['unitsPerBulk'],
  })

type FormData = z.infer<typeof schema>

type Props = {
  product: OrderableProduct | null
  onClose: () => void
  onSuccess: () => void
}

export function OrderableProductFormModal({ product, onClose, onSuccess }: Props) {
  const isEditing = !!product

  const defaultValues: FormData = product
    ? {
        code:         product.code,
        name:         product.name,
        description:  product.description ?? '',
        allowsUnit:   product.allowsUnit,
        allowsBulk:   product.allowsBulk,
        unitsPerBulk: product.unitsPerBulk,
      }
    : { code: '', name: '', description: '', allowsUnit: true, allowsBulk: false, unitsPerBulk: undefined }

  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues })

  const allowsBulk = useWatch({ control, name: 'allowsBulk' })

  useEffect(() => { reset(defaultValues) }, [product]) // eslint-disable-line

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      isEditing
        ? updateOrderableProduct(product.id, data)
        : createOrderableProduct(data),
    onSuccess,
    onError: (err) =>
      setError('root', { message: err instanceof Error ? err.message : 'Error inesperado' }),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">
              {isEditing ? 'Editar producto pedible' : 'Nuevo producto pedible'}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              {isEditing ? product.name : 'Definí el código, nombre y modalidades de pedido'}
            </p>
          </div>
          <button onClick={onClose} className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
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
              <FormField label="Código" htmlFor="code" required error={errors.code?.message}>
                <input
                  id="code"
                  className={inputClassName}
                  placeholder="SAB-POM"
                  disabled={isEditing}
                  {...register('code')}
                  style={{ textTransform: 'uppercase' }}
                  onChange={(e) => {
                    e.target.value = e.target.value.toUpperCase()
                    register('code').onChange(e)
                  }}
                />
                {isEditing && (
                  <p className="text-xs text-zinc-400">El código no se puede modificar</p>
                )}
              </FormField>

              <FormField label="Nombre" htmlFor="name" required error={errors.name?.message}>
                <input id="name" className={inputClassName} placeholder="Saborizada Pomelo" {...register('name')} />
              </FormField>

              <FormField label="Descripción" htmlFor="description" error={errors.description?.message} fullWidth>
                <textarea
                  id="description"
                  rows={2}
                  className={textareaClassName}
                  placeholder="Descripción opcional del producto"
                  {...register('description')}
                />
              </FormField>
            </FormSection>

            <FormSection title="Modalidades de pedido">
              <div className="sm:col-span-2 space-y-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-sm border border-zinc-200 bg-zinc-50 px-4 py-3 hover:bg-zinc-100 has-[:checked]:border-zinc-300 has-[:checked]:bg-white">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded-sm border-zinc-300 accent-zinc-900"
                    {...register('allowsUnit')}
                  />
                  <div>
                    <p className="text-sm font-medium text-zinc-900">Por unidad</p>
                    <p className="text-xs text-zinc-400">El repartidor puede pedir de a una unidad</p>
                  </div>
                </label>

                <label className="flex cursor-pointer items-center gap-3 rounded-sm border border-zinc-200 bg-zinc-50 px-4 py-3 hover:bg-zinc-100 has-[:checked]:border-zinc-300 has-[:checked]:bg-white">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded-sm border-zinc-300 accent-zinc-900"
                    {...register('allowsBulk')}
                  />
                  <div>
                    <p className="text-sm font-medium text-zinc-900">Por bulto</p>
                    <p className="text-xs text-zinc-400">El repartidor puede pedir por caja o bulto</p>
                  </div>
                </label>

                {allowsBulk && (
                  <div className="pl-4 pt-1">
                    <FormField
                      label="Unidades por bulto"
                      htmlFor="unitsPerBulk"
                      required
                      error={errors.unitsPerBulk?.message}
                    >
                      <input
                        id="unitsPerBulk"
                        type="number"
                        min={1}
                        onFocus={(e) => e.target.select()}
                        className={`${inputClassName} w-32 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                        placeholder="6"
                        {...register('unitsPerBulk')}
                      />
                    </FormField>
                  </div>
                )}
              </div>
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
                {mutation.isPending ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear producto'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
