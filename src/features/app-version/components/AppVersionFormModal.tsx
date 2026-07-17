import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { X, Loader2, UploadCloud, FileArchive } from 'lucide-react'
import type { AppVersion } from '../types'
import { publishAppVersion } from '../services/app-version.service'
import { FormSection, FormField, inputClassName, textareaClassName } from '@/shared/components/ui'

const schema = z.object({
  version: z
    .string()
    .min(1, 'Requerido')
    .regex(/^\d+\.\d+\.\d+$/, 'Formato inválido. Usá x.y.z (ej: 1.1.0)'),
  mandatory: z.boolean(),
  notes: z.string().max(1000).optional(),
  file: z
    .custom<FileList>()
    .refine((f) => f instanceof FileList && f.length === 1, 'Seleccioná un archivo .apk')
    .refine(
      (f) => !!f?.[0] && f[0].name.toLowerCase().endsWith('.apk'),
      'El archivo debe ser un .apk'
    ),
})

type FormData = z.infer<typeof schema>

type Props = {
  onClose: () => void
  onSuccess: (published: AppVersion) => void
}

export function AppVersionFormModal({ onClose, onSuccess }: Props) {
  const [progress, setProgress] = useState(0)

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { version: '', mandatory: false, notes: '' },
  })

  const fileList = watch('file')
  const selectedFile = fileList?.[0]

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      publishAppVersion(
        {
          version: data.version,
          mandatory: data.mandatory,
          notes: data.notes || undefined,
          file: data.file[0],
        },
        setProgress
      ),
    onSuccess,
    onError: (err) => {
      setProgress(0)
      setError('root', { message: err instanceof Error ? err.message : 'Error inesperado' })
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Publicar nueva versión</h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Subí el APK que recibirán los repartidores en la app móvil.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={mutation.isPending}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-40"
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
            <FormSection title="Datos de la versión">
              <FormField
                label="Versión"
                htmlFor="version"
                required
                error={errors.version?.message}
                hint="Formato semántico x.y.z"
              >
                <input
                  id="version"
                  className={inputClassName}
                  placeholder="1.1.0"
                  {...register('version')}
                />
              </FormField>

              <FormField label="Obligatoria" fullWidth error={errors.mandatory?.message}>
                <label className="flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                    {...register('mandatory')}
                  />
                  <span className="text-sm text-zinc-600">
                    Forzar actualización. Los repartidores no podrán seguir usando la app
                    hasta instalar esta versión.
                  </span>
                </label>
              </FormField>

              <FormField
                label="Notas"
                htmlFor="notes"
                fullWidth
                error={errors.notes?.message}
                hint="Changelog o detalle de la versión (opcional)"
              >
                <textarea
                  id="notes"
                  rows={3}
                  className={textareaClassName}
                  {...register('notes')}
                />
              </FormField>
            </FormSection>

            <FormSection title="Archivo APK">
              <FormField label="Archivo" fullWidth required error={errors.file?.message}>
                <label
                  className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed px-4 py-6 text-center transition-colors ${
                    selectedFile
                      ? 'border-blue-300 bg-blue-50/50'
                      : 'border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50'
                  }`}
                >
                  {selectedFile ? (
                    <>
                      <FileArchive size={20} className="text-blue-600" />
                      <span className="text-sm font-medium text-zinc-800">
                        {selectedFile.name}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {formatBytes(selectedFile.size)} · Tocá para cambiar
                      </span>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={20} className="text-zinc-400" />
                      <span className="text-sm text-zinc-600">
                        Seleccionar archivo <span className="font-mono">.apk</span>
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".apk"
                    className="sr-only"
                    disabled={mutation.isPending}
                    {...register('file')}
                  />
                </label>
              </FormField>

              {mutation.isPending && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>Subiendo…</span>
                    <span className="font-mono">{progress}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
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
                {mutation.isPending ? 'Publicando…' : 'Publicar versión'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(0)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}
