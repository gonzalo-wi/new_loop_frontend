import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, User, Lock, AlertCircle, ArrowRight, Truck, Clock } from 'lucide-react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { loginService } from '../services/auth.service'
import { clearSessionExpired, useAuthStore, wasSessionExpired } from '../store/auth.store'
import { ROUTES } from '@/shared/constants'
import { inputClassName } from '@/shared/components/ui'
import { cn } from '@/shared/lib/utils'
import type { AuthOutletContext } from '@/layouts/AuthLayout'

const schema = z.object({
  username: z.string().min(2, 'Mínimo 2 caracteres'),
  password: z.string().min(4, 'Mínimo 4 caracteres'),
})

type FormData = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const { depart } = useOutletContext<AuthOutletContext>()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [sessionExpired] = useState(wasSessionExpired)
  // Cleared after reading (not while rendering, which StrictMode runs twice), so a reload doesn't repeat it.
  useEffect(clearSessionExpired, [])
  // Sessions now end every night: the next user in this tab must not see the previous one's cached data.
  const queryClient = useQueryClient()
  useEffect(() => queryClient.clear(), [queryClient])
  const [departing, setDeparting] = useState(false)

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
      setDeparting(true)
      depart(() => {
        setAuth(response.user, response.token)
        navigate(ROUTES.DASHBOARD, { replace: true })
      })
    } catch (err: unknown) {
      // Try to extract backend error message
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string }
      const msg =
        axiosErr?.response?.data?.message ??
        (err instanceof Error ? err.message : 'Error al iniciar sesión')
      setServerError(msg)
    }
  }

  const busy = isSubmitting || departing
  const fieldClass = cn(inputClassName, 'h-11 pl-10')

  return (
    <div>
      <div className="mb-8">
        <img src="/logoLoop.png" alt="LOOP" className="mb-6 h-12 w-12 object-contain lg:hidden" />
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Bienvenido</h1>
        <p className="mt-1.5 text-sm text-zinc-500">Ingresá con tu usuario para gestionar la operación.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div>
          <label htmlFor="username" className="mb-1.5 block text-[13px] font-medium text-zinc-700">
            Usuario
          </label>
          <div className="relative">
            <User size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              id="username"
              type="text"
              autoComplete="username"
              autoFocus
              placeholder="usuario"
              disabled={busy}
              className={fieldClass}
              {...register('username')}
            />
          </div>
          {errors.username && (
            <p className="mt-1.5 text-xs text-red-600">{errors.username.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-zinc-700">
            Contraseña
          </label>
          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              disabled={busy}
              className={cn(fieldClass, 'pr-10')}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              tabIndex={-1}
              title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        {sessionExpired && !serverError && (
          <div role="status" className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-800">
            <Clock size={16} className="mt-0.5 shrink-0" />
            <span>Tu sesión venció. Volvé a ingresar.</span>
          </div>
        )}

        {serverError && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className={cn(
            'group flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium text-white shadow-card transition-colors disabled:cursor-not-allowed',
            departing ? 'bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700 disabled:opacity-70'
          )}
        >
          {departing ? (
            <>
              <Truck size={16} />
              Despachando…
            </>
          ) : isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Verificando…
            </>
          ) : (
            <>
              Ingresar
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>
    </div>
  )
}
