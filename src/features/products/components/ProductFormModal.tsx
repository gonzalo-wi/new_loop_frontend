import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import type { Product, ProductFormData } from '../types'
import { createProduct, updateProduct } from '../services/products.service'
import {
  FormSection,
  FormField,
  inputClassName,
  selectClassName,
  textareaClassName,
} from '@/shared/components/ui'
import { PRODUCT_TYPES } from '@/shared/constants'

const schema = z.object({
  code:        z.string().min(1, 'Requerido').toUpperCase(),
  name:        z.string().min(2, 'Mínimo 2 caracteres'),
  description: z.string().optional(),
  displayOrder: z.preprocess(
    (v) => (v === '' ? undefined : Number(v)),
    z.number({ invalid_type_error: 'Requerido' }).int().min(1, 'Mínimo 1')
  ),
  packQuantity: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : Number(v)),
    z.number().int().min(1, 'Mínimo 1').optional()
  ),
  type: z.enum(['returnable', 'disposable']),
  unit: z.string().optional(),
})

type FormData = z.infer<typeof schema>

type Props = {
  product: Product | null
  onClose: () => void
  onSuccess: () => void
}

export function ProductFormModal({ product, onClose, onSuccess }: Props) {
  const isEditing = !!product

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: product
      ? {
          code:         product.code,
          name:         product.name,
          description:  product.description ?? '',
          displayOrder: product.displayOrder,
          packQuantity: product.packQuantity,
          type:         product.type,
          unit:         product.unit ?? '',
        }
      : { type: 'returnable', displayOrder: 1 },
  })

  useEffect(() => {
    reset(
      product
        ? {
            code:         product.code,
            name:         product.name,
            description:  product.description ?? '',
            displayOrder: product.displayOrder,
            packQuantity: product.packQuantity,
            type:         product.type,
            unit:         product.unit ?? '',
          }
        : { type: 'returnable', displayOrder: 1 }
    )
  }, [product, reset])

  const mutation = useMutation({
    mutationFn: (data: ProductFormData) =>
      isEditing ? updateProduct(product.id, data) : createProduct(data),
    onSuccess,
    onError: (err) => {
      setError('root', { message: err instanceof Error ? err.message : 'Error inesperado' })
    },
  })

  function onSubmit(data: FormData) {
    mutation.mutate({
      ...data,
      description:  data.description  || undefined,
      unit:         data.unit         || undefined,
      packQuantity: data.packQuantity ?? undefined,
    } as ProductFormData)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">
              {isEditing ? 'Editar producto' : 'Nuevo producto'}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {isEditing ? `Modificando ${product.name}` : 'Complete los datos del nuevo producto'}
            </p>
          </div>
          <button onClick={onClose} className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            <FormSection title="Identificación">
              <FormField
                label="Código"
                htmlFor="code"
                required
                error={errors.code?.message}
                hint={isEditing ? 'No se puede modificar' : undefined}
              >
                <input
                  id="code"
                  className={inputClassName}
                  readOnly={isEditing}
                  disabled={isEditing}
                  {...register('code')}
                />
              </FormField>
              <FormField label="Nombre" htmlFor="name" required error={errors.name?.message}>
                <input id="name" className={inputClassName} {...register('name')} />
              </FormField>
              <FormField label="Descripción" htmlFor="description" error={errors.description?.message} fullWidth>
                <textarea
                  id="description"
                  rows={2}
                  className={textareaClassName}
                  {...register('description')}
                />
              </FormField>
            </FormSection>

            <FormSection title="Clasificación">
              <FormField label="Tipo" htmlFor="type" required error={errors.type?.message}>
                <select id="type" className={selectClassName} {...register('type')}>
                  {PRODUCT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </FormField>
              <FormField
                label="Unidad"
                htmlFor="unit"
                error={errors.unit?.message}
                hint="Ej: unidad, 1.5L, kg, rollo"
              >
                <input id="unit" className={inputClassName} {...register('unit')} />
              </FormField>
              <FormField
                label="Orden"
                htmlFor="displayOrder"
                required
                error={(errors as { displayOrder?: { message?: string } }).displayOrder?.message}
                hint="Posición en catálogos"
              >
                <input
                  id="displayOrder"
                  type="number"
                  min={1}
                  className={inputClassName}
                  {...register('displayOrder')}
                />
              </FormField>
              <FormField
                label="Cantidad por pack"
                htmlFor="packQuantity"
                error={(errors as { packQuantity?: { message?: string } }).packQuantity?.message}
                hint="Opcional"
              >
                <input
                  id="packQuantity"
                  type="number"
                  min={1}
                  className={inputClassName}
                  {...register('packQuantity')}
                />
              </FormField>
            </FormSection>
          </div>

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
                className="flex h-9 items-center gap-2 rounded-sm bg-zinc-900 px-5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
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
