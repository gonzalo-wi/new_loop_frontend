import { useEffect } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2 } from 'lucide-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { StockControl, StockControlType } from '../types'
import { createStockControl, updateStockControl } from '../services/stock-controls.service'
import { fetchBranches } from '@/features/branches/services/branches.service'
import { fetchDeliveries } from '@/features/deliveries/services/deliveries.service'
import { fetchProducts } from '@/features/products/services/products.service'
import {
  FormSection,
  FormField,
  selectClassName,
  textareaClassName,
  Combobox,
  DatePicker,
} from '@/shared/components/ui'

const itemSchema = z.object({
  productId:        z.string(),
  totalQuantity:    z.coerce.number().int().min(0, 'No puede ser negativo'),
  fullQuantity:     z.coerce.number().int().min(0, 'No puede ser negativo'),
  exchangeQuantity: z.coerce.number().int().min(0, 'No puede ser negativo'),
  observations:     z.string().max(500).optional(),
})

const schema = z.object({
  branchId:     z.string().min(1, 'Seleccionar sucursal'),
  routeId:      z.string().min(1, 'Seleccionar reparto'),
  controlDate:  z.string().optional(),
  observations: z.string().max(500).optional(),
  truckOrdered: z.boolean(),
  items:        z.array(itemSchema),
})

type FormData = z.infer<typeof schema>

type Props = {
  type: StockControlType
  control: StockControl | null
  onClose: () => void
  onSuccess: () => void
}

export function StockControlFormModal({ type, control, onClose, onSuccess }: Props) {
  const isEditing = !!control

  const { data: branches   = [] } = useQuery({ queryKey: ['branches'],   queryFn: fetchBranches })
  const { data: deliveries = [] } = useQuery({ queryKey: ['deliveries'], queryFn: fetchDeliveries })
  const { data: products   = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  })

  const activeBranches   = branches.filter((b) => b.status === 'active')
  const activeDeliveries = deliveries.filter((d) => d.status === 'active')
  const activeProducts   = products.filter((p) => p.status === 'active')

  function buildItems(existingItems: StockControl['items'] = []) {
    return activeProducts.map((p) => {
      const existing = existingItems.find((i) => i.productId === p.id)
      return {
        productId:        p.id,
        totalQuantity:    existing?.totalQuantity    ?? 0,
        fullQuantity:     existing?.fullQuantity     ?? 0,
        exchangeQuantity: existing?.exchangeQuantity ?? 0,
        observations:     existing?.observations     ?? '',
      }
    })
  }

  const todayISO = new Date().toISOString().slice(0, 10)

  function buildDefaultValues(): FormData {
    if (control) {
      return {
        branchId:     control.branchId,
        routeId:      control.routeId,
        controlDate:  control.controlDate,
        observations: control.observations ?? '',
        truckOrdered: control.truckOrdered,
        items:        buildItems(control.items),
      }
    }
    return {
      branchId: '', routeId: '', controlDate: type === 'ENTRY' ? todayISO : '',
      observations: '', truckOrdered: true,
      items:    buildItems(),
    }
  }

  const {
    register,
    handleSubmit,
    reset,
    control: formControl,
    setError,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: buildDefaultValues() })

  const { fields } = useFieldArray({ control: formControl, name: 'items' })

  // Re-populate whenever products finish loading or we switch between create/edit
  useEffect(() => {
    if (!productsLoading) reset(buildDefaultValues())
  }, [control, productsLoading, activeProducts.length]) // eslint-disable-line

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      if (isEditing) {
        return updateStockControl(control.id, {
          controlDate:  data.controlDate  || undefined,
          observations: data.observations || undefined,
          truckOrdered: data.truckOrdered,
          items: data.items,
        })
      }
      return createStockControl({
        type,
        branchId:     data.branchId,
        routeId:      data.routeId,
        controlDate:  data.controlDate  || undefined,
        observations: data.observations || undefined,
        truckOrdered: data.truckOrdered,
        items: data.items,
      })
    },
    onSuccess,
    onError: (err) =>
      setError('root', { message: err instanceof Error ? err.message : 'Error inesperado' }),
  })

  const typeLabel = type === 'EXIT' ? 'salida' : 'entrada'

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-2xl flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">
              {isEditing ? `Editar control de ${typeLabel}` : `Nuevo control de ${typeLabel}`}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              {isEditing
                ? `Modificando ${control.routeCode} · ${control.controlDate}`
                : `Completá las cantidades por producto`}
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
            {/* Control info */}
            <FormSection title="Control">
              <FormField label="Sucursal" htmlFor="branchId" required error={errors.branchId?.message}>
                <select id="branchId" className={selectClassName} disabled={isEditing} {...register('branchId')}>
                  <option value="">Seleccionar...</option>
                  {activeBranches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                  ))}
                  {isEditing && (
                    <option value={control.branchId}>{control.branchName}</option>
                  )}
                </select>
              </FormField>

              <FormField label="Reparto" htmlFor="routeId" required error={errors.routeId?.message}>
                <Controller
                  control={formControl}
                  name="routeId"
                  render={({ field }) => (
                    <Combobox
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isEditing}
                      placeholder="Buscar reparto..."
                      searchPlaceholder="Código, conductor..."
                      options={
                        isEditing
                          ? [{ value: control.routeId, label: control.routeCode }]
                          : activeDeliveries.map((d) => ({
                              value: d.id,
                              label: d.code,
                              sublabel: d.driver ?? undefined,
                            }))
                      }
                    />
                  )}
                />
              </FormField>

              <FormField
                label="Fecha de control"
                hint={isEditing || type === 'ENTRY' ? undefined : 'Dejar vacío para usar la fecha por defecto'}
                error={(errors as { controlDate?: { message?: string } }).controlDate?.message}
              >
                <Controller
                  control={formControl}
                  name="controlDate"
                  render={({ field }) => (
                    <DatePicker
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      disabled={isEditing}
                    />
                  )}
                />
              </FormField>

              <FormField label="Observaciones" htmlFor="observations" error={errors.observations?.message} fullWidth>
                <textarea id="observations" rows={2} className={textareaClassName} {...register('observations')} />
              </FormField>

              {/* Truck ordered — full width, rendered outside the 2-col grid via fullWidth */}
              <div className="sm:col-span-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-sm border border-zinc-200 bg-zinc-50 px-4 py-3 hover:bg-zinc-100 has-[:checked]:border-zinc-300 has-[:checked]:bg-white">
                  <input
                    id="truckOrdered"
                    type="checkbox"
                    className="h-4 w-4 rounded-sm border-zinc-300 accent-zinc-900"
                    {...register('truckOrdered')}
                  />
                  <div>
                    <p className="text-sm font-medium text-zinc-900">Camión ordenado</p>
                    <p className="text-xs text-zinc-400">Indica si el camión fue solicitado para este control</p>
                  </div>
                </label>
              </div>
            </FormSection>

            {/* Products table */}
            <div>
              <div className="mb-3 border-b border-zinc-100 pb-3">
                <h3 className="text-sm font-semibold text-zinc-800">
                  Cantidades por producto
                </h3>
                <p className="mt-0.5 text-xs text-zinc-400">
                  Ingresá las cantidades para cada producto. Los que no se carguen quedan en 0.
                </p>
              </div>

              {productsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={16} className="animate-spin text-zinc-400" />
                  <span className="ml-2 text-sm text-zinc-400">Cargando productos...</span>
                </div>
              ) : activeProducts.length === 0 ? (
                <p className="py-6 text-center text-sm text-zinc-400">No hay productos activos disponibles.</p>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50">
                      <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Producto</th>
                      <th className="w-24 px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Total</th>
                      <th className="w-24 px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Llenos</th>
                      <th className="w-24 px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Recambios</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field, index) => {
                      const product   = activeProducts[index]
                      const rowErrors = errors.items?.[index]
                      const hasError  = !!(rowErrors?.totalQuantity || rowErrors?.fullQuantity || rowErrors?.exchangeQuantity)

                      return (
                        <tr
                          key={field.id}
                          className={`border-b border-zinc-100 ${hasError ? 'bg-red-50' : 'hover:bg-zinc-50/50'}`}
                        >
                          <td className="px-3 py-3">
                            <input type="hidden" {...register(`items.${index}.productId`)} />
                            <p className="text-sm font-medium text-zinc-900">
                              {product?.name}
                              {product?.unit ? (
                                <span className="ml-1 font-normal text-zinc-400">({product.unit})</span>
                              ) : null}
                            </p>
                            <p className="font-mono text-[10px] text-zinc-400">{product?.code}</p>
                          </td>
                          {(['totalQuantity', 'fullQuantity', 'exchangeQuantity'] as const).map((fieldName) => (
                            <td key={fieldName} className="px-2 py-3">
                              <input
                                type="number"
                                min={0}
                                onFocus={(e) => e.target.select()}
                                className={[
                                  'h-9 w-full rounded-sm border text-center font-mono text-sm tabular-nums',
                                  'focus:outline-none focus:ring-1',
                                  '[appearance:textfield]',
                                  '[&::-webkit-inner-spin-button]:appearance-none',
                                  '[&::-webkit-outer-spin-button]:appearance-none',
                                  rowErrors?.[fieldName]
                                    ? 'border-red-300 bg-red-50 text-red-700 focus:border-red-400 focus:ring-red-400'
                                    : 'border-zinc-200 bg-white text-zinc-900 focus:border-blue-500 focus:ring-blue-500 hover:border-zinc-300',
                                ].join(' ')}
                                {...register(`items.${index}.${fieldName}`)}
                              />
                              {rowErrors?.[fieldName] && (
                                <p className="mt-0.5 text-center text-[10px] text-red-500">
                                  {rowErrors[fieldName]?.message}
                                </p>
                              )}
                            </td>
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
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
                disabled={mutation.isPending || productsLoading}
                className="flex h-9 items-center gap-2 rounded-sm bg-blue-600 px-5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {mutation.isPending && <Loader2 size={13} className="animate-spin" />}
                {mutation.isPending
                  ? 'Guardando...'
                  : isEditing
                    ? 'Guardar cambios'
                    : `Registrar ${typeLabel}`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
