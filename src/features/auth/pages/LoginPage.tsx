import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { loginService } from '../services/auth.service'
import { useAuthStore } from '../store/auth.store'
import { ROUTES } from '@/shared/constants'
import { inputClassName } from '@/shared/components/ui'

const schema = z.object({
  username: z.string().min(2, 'Mínimo 2 caracteres'),
  password: z.string().min(4, 'Mínimo 4 caracteres'),
})

type FormData = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '' },
  })

  async function onSubmit(data: FormData) {
    setServerError(null)
    try {
      const response = await loginService(data)
      setAuth(response.user, response.token)
      navigate(ROUTES.DASHBOARD, { replace: true })
    } catch (err: unknown) {
      // Try to extract backend error message
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string }
      const msg =
        axiosErr?.response?.data?.message ??
        (err instanceof Error ? err.message : 'Error al iniciar sesión')
      setServerError(msg)
    }
  }

  return (
    <div>
      <div className="mb-7">
        <div className="mb-4 flex items-center gap-2 lg:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-zinc-900 text-white">
            <span className="text-xs font-bold">L</span>
          </div>
          <span className="text-base font-semibold text-zinc-900">LOOP</span>
        </div>
        <h1 className="text-xl font-semibold text-zinc-900">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-zinc-500">Acceso restringido al personal autorizado.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <label htmlFor="username" className="mb-1 block text-xs font-medium text-zinc-700">
            Usuario
          </label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            className={inputClassName}
            {...register('username')}
          />
          {errors.username && (
            <p className="mt-1 text-xs text-red-500">{errors.username.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-xs font-medium text-zinc-700">
            Contraseña
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className={inputClassName + ' pr-9'}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        {serverError && (
          <div className="rounded-sm border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
            {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-9 w-full items-center justify-center gap-2 rounded-sm bg-zinc-900 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting && <Loader2 size={14} className="animate-spin" />}
          {isSubmitting ? 'Verificando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}
