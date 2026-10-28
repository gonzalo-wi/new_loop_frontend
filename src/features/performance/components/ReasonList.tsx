import type { ReasonCount } from '../types'

const KIND_LABEL: Record<ReasonCount['kind'], string> = {
  REJECTION: 'Rechazo',
  CORRECTION: 'Corrección',
}

const KIND_CLASS: Record<ReasonCount['kind'], string> = {
  REJECTION: 'bg-red-50 text-red-700',
  CORRECTION: 'bg-amber-50 text-amber-700',
}

type Props = {
  reasons: ReasonCount[]
  // Who wrote it (driver or supervisor) is only worth showing when the list mixes people.
  showAuthor?: boolean
  emptyText: string
}

export function ReasonList({ reasons, showAuthor = false, emptyText }: Props) {
  if (reasons.length === 0) {
    return <p className="px-5 py-8 text-center text-sm text-zinc-500">{emptyText}</p>
  }
  return (
    <ul className="divide-y divide-zinc-100">
      {reasons.map((r, i) => (
        <li key={`${r.kind}-${r.userId ?? 'none'}-${i}`} className="flex items-center gap-3 px-5 py-2.5 text-sm">
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${KIND_CLASS[r.kind]}`}>
            {KIND_LABEL[r.kind]}
          </span>
          <span className="min-w-0 flex-1 truncate text-zinc-800" title={r.reason}>{r.reason}</span>
          {showAuthor && <span className="shrink-0 text-xs text-zinc-500">{r.username ?? 'Sin usuario'}</span>}
          <span className="w-8 shrink-0 text-right font-semibold tabular-nums text-zinc-900">{r.count}</span>
        </li>
      ))}
    </ul>
  )
}
