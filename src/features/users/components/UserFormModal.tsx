import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, Eye, EyeOff, UserCircle, User as UserIcon, Lock } from 'lucide-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { User, UserFormData } from '../types'
import { BRANCH_REQUIRED_ROLES } from '../types'
import { createUser, updateUser } from '../services/users.service'
import { fetchBranches } from '@/features/branches/services/branches.service'
import { FormSection, FormField, Combobox } from '@/shared/components/ui'
import { ROLE_LABELS } from '@/shared/constants'
import type { UserRole } from '@/shared/types'

// Premium input treatment — same language introduced in the Deliveries modal.
const fancyInput =
  'h-10 w-full rounded-md border border-zinc-200 bg-zinc-50/60 px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition-all duration-150 hover:border-zinc-300 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 disabled:bg-zinc-100 disabled:text-zinc-400'

const USER_ROLES = [
  'admin', 'controller', 'delivery_driver', 'picker', 'loader', 'supervisor',
] as const

const ROLE_OPTIONS = (Object.entries(ROLE_LABELS) as [UserRole, string][]).map(
  ([value, label]) => ({ value, label })
)

const schema = z
  .object({
    name:     z.string().min(2, 'Mínimo 2 caracteres').max(150),
    username: z.string().min(2, 'Mínimo 2 caracteres').max(100),
    password: z.string().optional(),
    role:     z.enum(USER_ROLES),
    branchId: z.string().optional(),
  })
  // Controller/picker must have a branch; enforced here for immediate feedback
  // (the backend also returns 400 if it's missing).
  .superRefine((data, ctx) => {
    if (BRANCH_REQUIRED_ROLES.includes(data.role as UserRole) && !data.branchId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['branchId'],
        message: 'Requerida para este rol',
      })
    }
  })

type FormData = z.infer<typeof schema>

type Props = {
  user: User | null
  onClose: () => void
  onSuccess: () => void
}

export function UserFormModal({ user, onClose, onSuccess }: Props) {
  const isEditing = !!user
  const [showPassword, setShowPassword] = useState(false)

  const { data: branches = [], isLoading: branchesLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: fetchBranches,
  })
  const activeBranches = branches.filter((b) => b.status === 'active')

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    setError,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: user
      ? { name: user.name, username: user.username, role: user.role, branchId: user.branchId ?? '', password: '' }
      : { role: 'controller', branchId: '', password: '' },
  })

  useEffect(() => {
    reset(
      user
        ? { name: user.name, username: user.username, role: user.role, branchId: user.branchId ?? '', password: '' }
        : { role: 'controller', branchId: '', password: '' }
    )
    setShowPassword(false)
  }, [user, reset])

  const selectedRole  = watch('role') as UserRole
  const branchRequired = BRANCH_REQUIRED_ROLES.includes(selectedRole)

  // Keep a stale/inactive branch visible when editing a user already assigned to
  // one, so it doesn't silently drop out of the select.
  const branchOptions =
    user?.branchId && !activeBranches.some((b) => b.id === user.branchId)
      ? [...activeBranches, { id: user.branchId, name: user.branchName ?? 'Sucursal asignada', code: '' }]
      : activeBranches

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const formData: UserFormData = {
        name:     data.name,
        username: data.username,
        role:     data.role as UserRole,
        branchId: data.branchId || undefined,
        status:   'active',
        password: data.password || undefined,
      }
      return isEditing ? updateUser(user.id, formData) : createUser(formData)
    },
    onSuccess,
    onError: (err) => {
      const msg = err instanceof Error ? err.message : 'Error inesperado'
      setError('root', { message: msg })
    },
  })

  function onSubmit(data: FormData) {
    if (!isEditing && (!data.password || data.password.length < 8)) {
      setError('password', { message: 'Mínimo 8 caracteres' })
      return
    }
    if (data.password && data.password.length > 0 && data.password.length < 8) {
      setError('password', { message: 'Mínimo 8 caracteres' })
      return
    }
    mutation.mutate(data)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/25" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-zinc-900 text-white">
              <UserCircle size={16} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">
                {isEditing ? 'Editar usuario' : 'Nuevo usuario'}
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                {isEditing
                  ? `Modificando ${user.name}`
                  : 'Crear un nuevo acceso al sistema'}
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
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
            <FormSection title="Datos personales" icon={UserIcon}>
              <FormField
                label="Nombre completo"
                htmlFor="name"
                required
                error={errors.name?.message}
                fullWidth
              >
                <input id="name" className={fancyInput} {...register('name')} />
              </FormField>
              <FormField
                label="Nombre de usuario"
                htmlFor="username"
                required={!isEditing}
                hint={isEditing ? 'No se puede modificar' : undefined}
                error={errors.username?.message}
              >
                <input
                  id="username"
                  className={fancyInput}
                  autoComplete="off"
                  readOnly={isEditing}
                  disabled={isEditing}
                  {...register('username')}
                />
              </FormField>
              <FormField
                label="Rol"
                required
                error={errors.role?.message}
              >
                <Controller
                  control={control}
                  name="role"
                  render={({ field }) => (
                    <Combobox
                      value={field.value}
                      onChange={(v) => field.onChange(v as UserRole)}
                      placeholder="Seleccionar rol..."
                      searchPlaceholder="Buscar rol..."
                      options={ROLE_OPTIONS}
                    />
                  )}
                />
              </FormField>

              <FormField
                label="Sucursal"
                required={branchRequired}
                error={errors.branchId?.message}
                hint={
                  branchRequired
                    ? 'Obligatoria para controladores y pickers'
                    : 'Opcional para este rol'
                }
              >
                <Controller
                  control={control}
                  name="branchId"
                  render={({ field }) => (
                    <Combobox
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      disabled={branchesLoading}
                      placeholder={branchesLoading ? 'Cargando...' : 'Sin sucursal'}
                      searchPlaceholder="Nombre o código..."
                      options={branchOptions.map((b) => ({
                        value: b.id,
                        label: b.name,
                        sublabel: b.code || undefined,
                      }))}
                    />
                  )}
                />
              </FormField>
            </FormSection>

            <FormSection title="Contraseña" icon={Lock}>
              <FormField
                label={isEditing ? 'Nueva contraseña' : 'Contraseña'}
                htmlFor="password"
                required={!isEditing}
                hint={isEditing ? 'Dejar vacío para no modificar' : 'Mínimo 8 caracteres'}
                error={errors.password?.message}
                fullWidth
              >
                <div className="relative">
                  <Lock size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`${fancyInput} pl-9 pr-9`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
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
                    : 'Crear usuario'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
