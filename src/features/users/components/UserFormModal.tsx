import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, Eye, EyeOff } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import type { User, UserFormData } from '../types'
import { createUser, updateUser } from '../services/users.service'
import {
  FormSection,
  FormField,
  inputClassName,
  selectClassName,
} from '@/shared/components/ui'
import { ROLE_LABELS } from '@/shared/constants'
import type { UserRole } from '@/shared/types'

const USER_ROLES = [
  'admin', 'controller', 'delivery_driver', 'picker', 'loader', 'supervisor',
] as const

const ROLE_OPTIONS = (Object.entries(ROLE_LABELS) as [UserRole, string][]).map(
  ([value, label]) => ({ value, label })
)

const schema = z.object({
  name:     z.string().min(2, 'Mínimo 2 caracteres').max(150),
  username: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  password: z.string().optional(),
  role:     z.enum(USER_ROLES),
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

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: user
      ? { name: user.name, username: user.username, role: user.role, password: '' }
      : { role: 'controller', password: '' },
  })

  useEffect(() => {
    reset(
      user
        ? { name: user.name, username: user.username, role: user.role, password: '' }
        : { role: 'controller', password: '' }
    )
    setShowPassword(false)
  }, [user, reset])

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const formData: UserFormData = {
        name:     data.name,
        username: data.username,
        role:     data.role as UserRole,
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
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
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
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
            <FormSection title="Datos personales">
              <FormField
                label="Nombre completo"
                htmlFor="name"
                required
                error={errors.name?.message}
                fullWidth
              >
                <input id="name" className={inputClassName} {...register('name')} />
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
                  className={inputClassName}
                  autoComplete="off"
                  readOnly={isEditing}
                  disabled={isEditing}
                  {...register('username')}
                />
              </FormField>
              <FormField
                label="Rol"
                htmlFor="role"
                required
                error={errors.role?.message}
              >
                <select id="role" className={selectClassName} {...register('role')}>
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </FormSection>

            <FormSection title="Contraseña">
              <FormField
                label={isEditing ? 'Nueva contraseña' : 'Contraseña'}
                htmlFor="password"
                required={!isEditing}
                hint={isEditing ? 'Dejar vacío para no modificar' : 'Mínimo 8 caracteres'}
                error={errors.password?.message}
                fullWidth
              >
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={inputClassName + ' pr-9'}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
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
                    : 'Crear usuario'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
