import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, Package, Tag, Layers, Recycle, Trash2, Hash } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import type { Product, ProductFormData } from '../types'
import { createProduct, updateProduct } from '../services/products.service'
import { FormSection, FormField } from '@/shared/components/ui'
import { PRODUCT_TYPES } from '@/shared/constants'

// Premium input treatment for this form — same language introduced in the
// Deliveries modal: soft resting background, larger focus "glow", softer corners.
const fancyInput =
  'h-10 w-full rounded-md border border-zinc-200 bg-zinc-50/60 px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition-all duration-150 hover:border-zinc-300 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 disabled:bg-zinc-100 disabled:text-zinc-400'

const fancyTextarea =
  'w-full rounded-md border border-zinc-200 bg-zinc-50/60 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition-all duration-150 hover:border-zinc-300 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 disabled:bg-zinc-100 disabled:text-zinc-400 resize-none'

const TYPE_ICON = { returnable: Recycle, disposable: Trash2 } as const

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
    control,
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
      <div className="absolute inset-0 bg-black/25" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-zinc-900 text-white">
              <Package size={16} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">
                {isEditing ? 'Editar producto' : 'Nuevo producto'}
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                {isEditing ? `Modificando ${product.name}` : 'Complete los datos del nuevo producto'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-700"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            <FormSection title="Identificación" icon={Tag}>
              <FormField
                label="Código"
                htmlFor="code"
                required
                error={errors.code?.message}
                hint={isEditing ? 'No se puede modificar' : undefined}
              >
                <div className="relative">
                  <Hash size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    id="code"
                    className={`${fancyInput} pl-9`}
                    readOnly={isEditing}
                    disabled={isEditing}
                    {...register('code')}
                  />
                </div>
              </FormField>
              <FormField label="Nombre" htmlFor="name" required error={errors.name?.message}>
                <input id="name" className={fancyInput} {...register('name')} />
              </FormField>
              <FormField label="Descripción" htmlFor="description" error={errors.description?.message} fullWidth>
                <textarea
                  id="description"
                  rows={2}
                  className={fancyTextarea}
                  {...register('description')}
                />
              </FormField>
            </FormSection>

            <FormSection title="Clasificación" icon={Layers}>
              <FormField label="Tipo" required error={errors.type?.message} fullWidth>
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-2">
                      {PRODUCT_TYPES.map((t) => {
                        const Icon = TYPE_ICON[t.value as keyof typeof TYPE_ICON]
                        const active = field.value === t.value
                        return (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => field.onChange(t.value)}
                            className={`flex items-center gap-2.5 rounded-md border px-3.5 py-2.5 text-sm font-medium transition-all ${
                              active
                                ? 'border-blue-500 bg-blue-50 text-blue-700 ring-4 ring-blue-500/10'
                                : 'border-zinc-200 bg-zinc-50/60 text-zinc-600 hover:border-zinc-300'
                            }`}
                          >
                            <Icon size={15} className={active ? 'text-blue-600' : 'text-zinc-400'} />
                            {t.label}
                          </button>
                        )
                      })}
                    </div>
                  )}
                />
              </FormField>
              <FormField
                label="Unidad"
                htmlFor="unit"
                error={errors.unit?.message}
                hint="Ej: unidad, 1.5L, kg, rollo"
              >
                <input id="unit" className={fancyInput} {...register('unit')} />
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
                  className={fancyInput}
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
                  className={fancyInput}
                  {...register('packQuantity')}
                />
              </FormField>
            </FormSection>
          </div>

          <div className="border-t border-zinc-200 bg-zinc-50/60 px-6 py-4">
            {errors.root && (
              <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {errors.root.message}
              </p>
            )}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={mutation.isPending}
                className="h-9 rounded-md border border-zinc-200 bg-white px-5 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="flex h-9 items-center gap-2 rounded-md bg-blue-600 px-5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 hover:shadow disabled:opacity-50"
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
