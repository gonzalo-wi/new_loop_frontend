import { cn } from '@/shared/lib/utils'

export type AuditTabKey = 'integrations' | 'serials' | 'events' | 'corrections' | 'performance'

const TABS: { key: AuditTabKey; label: string }[] = [
  { key: 'integrations', label: 'Integraciones' },
  { key: 'serials',     label: 'Trazabilidad de dispensers' },
  { key: 'events',      label: 'Actividad' },
  { key: 'corrections', label: 'Correcciones de controles' },
  { key: 'performance', label: 'Rendimiento de pedidos' },
]

type Props = {
  active: AuditTabKey
  onChange: (key: AuditTabKey) => void
}

export function AuditTabs({ active, onChange }: Props) {
  return (
    <div className="mx-6 mb-5 inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1 shadow-card">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            'rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors',
            active === tab.key ? 'bg-blue-50 text-blue-700' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
