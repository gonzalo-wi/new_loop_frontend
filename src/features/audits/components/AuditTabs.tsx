import { cn } from '@/shared/lib/utils'

export type AuditTabKey = 'events' | 'corrections' | 'performance'

const TABS: { key: AuditTabKey; label: string }[] = [
  { key: 'events',      label: 'Log de eventos' },
  { key: 'corrections', label: 'Correcciones de controles' },
  { key: 'performance', label: 'Rendimiento de pedidos' },
]

type Props = {
  active: AuditTabKey
  onChange: (key: AuditTabKey) => void
}

export function AuditTabs({ active, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 border-b border-zinc-200 bg-white px-6">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            'relative px-3 py-2.5 text-xs font-semibold transition-colors',
            active === tab.key ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-700'
          )}
        >
          {tab.label}
          {active === tab.key && (
            <span className="absolute inset-x-0 -bottom-px h-[2px] bg-blue-600" />
          )}
        </button>
      ))}
    </div>
  )
}
