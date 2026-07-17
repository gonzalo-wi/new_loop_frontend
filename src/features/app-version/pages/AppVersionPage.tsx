import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Smartphone,
  Upload,
  CheckCircle2,
  Download,
  AlertTriangle,
  X,
} from 'lucide-react'
import {
  PageHeader,
  ActionBar,
  ActionButton,
  LoadingState,
  ErrorState,
  EmptyState,
  StatusBadge,
} from '@/shared/components/ui'
import { formatDateTime } from '@/shared/lib/utils'
import type { AppVersion } from '../types'
import { fetchAppVersion } from '../services/app-version.service'
import { AppVersionFormModal } from '../components/AppVersionFormModal'

export function AppVersionPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [published, setPublished] = useState<AppVersion | null>(null)

  const { data: current, isLoading, isError, refetch } = useQuery({
    queryKey: ['app-version'],
    queryFn: fetchAppVersion,
  })

  const downloadUrl = current?.downloadUrl ?? current?.url

  return (
    <div>
      <PageHeader
        title="Versión de la app"
        description="Publicá y controlá el APK que usan los repartidores en la app móvil."
        actions={
          <ActionButton
            variant="primary"
            icon={<Upload size={14} />}
            onClick={() => setShowForm(true)}
          >
            Publicar nueva versión
          </ActionButton>
        }
      />

      <ActionBar />

      <div className="px-1 py-4">
        {published && (
          <div className="mb-4 flex items-start justify-between gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
              <div>
                <p className="text-sm font-medium text-emerald-800">
                  ¡Publicado! Versión {published.version}
                </p>
                <p className="mt-0.5 text-xs text-emerald-700">
                  Ya es la versión vigente para la app móvil.
                </p>
              </div>
            </div>
            <button
              onClick={() => setPublished(null)}
              className="rounded p-1 text-emerald-600/70 hover:bg-emerald-100 hover:text-emerald-700"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState onRetry={refetch} />
        ) : !current ? (
          <EmptyState
            icon={Smartphone}
            title="Sin versión publicada"
            description="Todavía no se publicó ninguna versión de la app. Subí el primer APK para empezar."
            className="py-20"
          />
        ) : (
          <div className="max-w-2xl rounded-md border border-zinc-200 bg-white">
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Versión vigente
              </span>
              {current.mandatory ? (
                <span className="flex items-center gap-1 rounded-sm bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                  <AlertTriangle size={11} /> Obligatoria
                </span>
              ) : (
                <StatusBadge status="active" label="Opcional" />
              )}
            </div>

            <div className="flex items-center gap-4 px-5 py-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-500">
                <Smartphone size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xl font-semibold text-zinc-900">
                  {current.version}
                </p>
                {current.fileName && (
                  <p className="truncate font-mono text-xs text-zinc-400">
                    {current.fileName}
                  </p>
                )}
              </div>
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 shrink-0 items-center gap-2 rounded-sm border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  <Download size={14} />
                  Descargar
                </a>
              )}
            </div>

            {(current.notes || current.createdAt) && (
              <div className="space-y-2 border-t border-zinc-100 px-5 py-4">
                {current.notes && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-zinc-400">Notas</p>
                    <p className="mt-0.5 whitespace-pre-wrap text-sm text-zinc-700">
                      {current.notes}
                    </p>
                  </div>
                )}
                {current.createdAt && (
                  <p className="text-xs text-zinc-400">
                    Publicada el {formatDateTime(current.createdAt)}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <AppVersionFormModal
          onClose={() => setShowForm(false)}
          onSuccess={(result) => {
            queryClient.invalidateQueries({ queryKey: ['app-version'] })
            setPublished(result)
            setShowForm(false)
          }}
        />
      )}
    </div>
  )
}
