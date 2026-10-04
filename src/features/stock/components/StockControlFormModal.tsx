import { useEffect, useState } from 'react'
import { useForm, useFieldArray, useWatch, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, ArrowDownToLine, ArrowUpFromLine, ClipboardCheck, Truck, Eraser } from 'lucide-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { StockControl, StockControlType } from '../types'
import { createStockControl, updateStockControl } from '../services/stock-controls.service'
import { fetchBranches } from '@/features/branches/services/branches.service'
import { fetchDeliveries } from '@/features/deliveries/services/deliveries.service'
import { fetchProducts } from '@/features/products/services/products.service'
import {
  FormSection,
  FormField,
  Combobox,
  DatePicker,
  SearchInput,
} from '@/shared/components/ui'

// Premium input treatment — same language introduced in the Products/Deliveries
// modals: soft resting background, larger focus "glow", softer corners.
const fancySelect =
  'select-chevron h-10 w-full rounded-md border border-zinc-200 bg-zinc-50/60 pl-3.5 pr-8 text-sm text-zinc-900 appearance-none transition-all duration-150 hover:border-zinc-300 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 disabled:bg-zinc-100 disabled:text-zinc-400'

const fancyTextarea =
  'w-full rounded-md border border-zinc-200 bg-zinc-50/60 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition-all duration-150 hover:border-zinc-300 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 disabled:bg-zinc-100 disabled:text-zinc-400 resize-none'

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

type QuantityField = 'totalQuantity' | 'fullQuantity' | 'exchangeQuantity'

export function StockControlFormModal({ type, control, onClose, onSuccess }: Props) {
  const isEditing = !!control
  const [productSearch, setProductSearch] = useState('')

  // Exits only track the total; full/exchange are an entry-side concept and are
  // sent as 0 so the backend contract stays unchanged.
  const isExit = type === 'EXIT'
  const quantityFields: readonly QuantityField[] = isExit
    ? ['totalQuantity']
    : ['totalQuantity', 'fullQuantity', 'exchangeQuantity']

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
    getValues,
    setError,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: buildDefaultValues() })

  const { fields, update } = useFieldArray({ control: formControl, name: 'items' })
  const watchedItems = useWatch({ control: formControl, name: 'items' })

  // Re-populate whenever products finish loading or we switch between create/edit
  useEffect(() => {
    if (!productsLoading) reset(buildDefaultValues())
  }, [control, productsLoading, activeProducts.length]) // eslint-disable-line

  const loadedCount = (watchedItems ?? []).filter((i) => Number(i?.totalQuantity) > 0).length
  const totalUnits  = (watchedItems ?? []).reduce((sum, i) => sum + (Number(i?.totalQuantity) || 0), 0)

  function clearQuantities() {
    fields.forEach((_, index) => {
      update(index, {
        ...getValues(`items.${index}`),
        totalQuantity: 0, fullQuantity: 0, exchangeQuantity: 0,
      })
    })
  }

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      // On exits the hidden fields are always zeroed, even when editing a
      // control that was created before this rule.
      const items = data.items.map((item) => ({
        ...item,
        fullQuantity:     isExit ? 0 : item.fullQuantity,
        exchangeQuantity: isExit ? 0 : item.exchangeQuantity,
      }))

      if (isEditing) {
        return updateStockControl(control.id, {
          controlDate:  data.controlDate  || undefined,
          observations: data.observations || undefined,
          truckOrdered: data.truckOrdered,
          items,
        })
      }
      return createStockControl({
        type,
        branchId:     data.branchId,
        routeId:      data.routeId,
        controlDate:  data.controlDate  || undefined,
        observations: data.observations || undefined,
        truckOrdered: data.truckOrdered,
        items,
      })
    },
    onSuccess,
    onError: (err) =>
      setError('root', { message: err instanceof Error ? err.message : 'Error inesperado' }),
  })

  const typeLabel = type === 'EXIT' ? 'salida' : 'entrada'
  const TypeIcon = type === 'EXIT' ? ArrowUpFromLine : ArrowDownToLine

  const visibleIndexes = fields
    .map((_, index) => index)
    .filter((index) => {
      if (!productSearch) return true
      const product = activeProducts[index]
      const q = productSearch.toLowerCase()
      return product?.name.toLowerCase().includes(q) || product?.code.toLowerCase().includes(q)
    })

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/25" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-2xl flex-col bg-white shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-zinc-900 text-white">
              <TypeIcon size={16} />
            </span>
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
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-700"
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
            {/* Control info */}
            <FormSection title="Control" icon={ClipboardCheck}>
              <FormField label="Sucursal" htmlFor="branchId" required error={errors.branchId?.message}>
                <select id="branchId" className={fancySelect} disabled={isEditing} {...register('branchId')}>
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
                <textarea id="observations" rows={2} className={fancyTextarea} {...register('observations')} />
              </FormField>

              {/* Truck ordered — full width, rendered outside the 2-col grid via fullWidth */}
              <div className="sm:col-span-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-md border border-zinc-200 bg-zinc-50/60 px-4 py-3 transition-all duration-150 hover:border-zinc-300 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50/40 has-[:checked]:ring-4 has-[:checked]:ring-blue-500/10">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-zinc-400 ring-1 ring-inset ring-zinc-200">
                    <Truck size={14} />
                  </span>
                  <input
                    id="truckOrdered"
                    type="checkbox"
                    className="h-4 w-4 rounded-md border-zinc-300 accent-blue-600"
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
              <div className="mb-3 flex flex-wrap items-end justify-between gap-3 border-b border-zinc-100 pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-800">Cantidades por producto</h3>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    {isExit
                      ? 'Ingresá el total por producto. Los que no se carguen quedan en 0.'
                      : 'Ingresá las cantidades para cada producto. Los que no se carguen quedan en 0.'}
                  </p>
                </div>
                {activeProducts.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-medium text-zinc-600">
                      {loadedCount} de {activeProducts.length} cargados
                    </span>
                    <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-1 font-mono text-[11px] font-bold text-blue-700">
                      {totalUnits} u.
                    </span>
                  </div>
                )}
              </div>

              {productsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={16} className="animate-spin text-zinc-400" />
                  <span className="ml-2 text-sm text-zinc-400">Cargando productos...</span>
                </div>
              ) : activeProducts.length === 0 ? (
                <p className="py-6 text-center text-sm text-zinc-400">No hay productos activos disponibles.</p>
              ) : (
                <>
                  <div className="mb-3 flex items-center gap-2">
                    <SearchInput
                      value={productSearch}
                      onChange={setProductSearch}
                      placeholder="Filtrar por nombre o código..."
                      className="w-64"
                    />
                    {loadedCount > 0 && (
                      <button
                        type="button"
                        onClick={clearQuantities}
                        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-red-600"
                      >
                        <Eraser size={12} />
                        Vaciar cantidades
                      </button>
                    )}
                  </div>

                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50">
                        <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Producto</th>
                        <th className="w-24 px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Total</th>
                        {!isExit && (
                          <>
                            <th className="w-24 px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Llenos</th>
                            <th className="w-24 px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Recambios</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {visibleIndexes.length === 0 && (
                        <tr>
                          <td colSpan={isExit ? 2 : 4} className="px-3 py-6 text-center text-sm text-zinc-400">
                            Sin productos para "{productSearch}"
                          </td>
                        </tr>
                      )}
                      {visibleIndexes.map((index) => {
                        const field      = fields[index]
                        const product    = activeProducts[index]
                        const rowErrors  = errors.items?.[index]
                        const hasError   = quantityFields.some((f) => !!rowErrors?.[f])
                        const rowHasQty  = Number(watchedItems?.[index]?.totalQuantity) > 0

                        return (
                          <tr
                            key={field.id}
                            className={[
                              'border-b border-zinc-100 transition-colors',
                              hasError
                                ? 'bg-red-50'
                                : rowHasQty
                                  ? 'border-l-2 border-l-emerald-400 bg-emerald-50/30'
                                  : 'hover:bg-zinc-50/50',
                            ].join(' ')}
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
                            {quantityFields.map((fieldName) => (
                              <td key={fieldName} className="px-2 py-3">
                                <input
                                  type="number"
                                  min={0}
                                  onFocus={(e) => e.target.select()}
                                  className={[
                                    'h-10 w-full rounded-md border text-center font-mono text-sm tabular-nums transition-all duration-150',
                                    'focus:outline-none focus:ring-4',
                                    '[appearance:textfield]',
                                    '[&::-webkit-inner-spin-button]:appearance-none',
                                    '[&::-webkit-outer-spin-button]:appearance-none',
                                    rowErrors?.[fieldName]
                                      ? 'border-red-300 bg-red-50 text-red-700 focus:border-red-400 focus:ring-red-500/10'
                                      : 'border-zinc-200 bg-zinc-50/60 text-zinc-900 hover:border-zinc-300 focus:border-blue-500 focus:bg-white focus:ring-blue-500/10',
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
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-zinc-200 bg-zinc-50/60 px-6 py-4">
            {errors.root && (
              <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {errors.root.message}
              </p>
            )}
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-zinc-400">
                {loadedCount} producto{loadedCount !== 1 ? 's' : ''} cargado{loadedCount !== 1 ? 's' : ''} · {totalUnits} unidades en total
              </p>
              <div className="flex items-center gap-3">
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
                  disabled={mutation.isPending || productsLoading}
                  className="flex h-9 items-center gap-2 rounded-md bg-blue-600 px-5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 hover:shadow disabled:opacity-50"
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
          </div>
        </form>
      </div>
    </div>
  )
}
