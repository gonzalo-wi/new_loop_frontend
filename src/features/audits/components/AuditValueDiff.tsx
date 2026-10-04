import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { safeParseJson } from '../constants'
import { formatDateTime, truncate } from '@/shared/lib/utils'

type Props = {
  oldValue: string | null
  newValue: string | null
  /** Resolves an "xxxId" field to a human-readable label (e.g. a user's name). Returns undefined to leave the id as-is. */
  resolveId?: ResolveId
}

type ResolveId = (key: string, id: string) => string | undefined

type PlainRecord = Record<string, unknown>

type Row = {
  key: string
  before: unknown
  after: unknown
  changed: boolean
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/

function isPlainObject(v: unknown): v is PlainRecord {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isItemArray(v: unknown): v is PlainRecord[] {
  return Array.isArray(v) && v.length > 0 && v.every(isPlainObject)
}

function tryParseObject(raw: string | null): PlainRecord | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return isPlainObject(parsed) ? parsed : null
  } catch {
    return null
  }
}

// Turns backend field names ("branchId", "orderDate") into readable labels.
function humanizeKey(key: string): string {
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/_/g, ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

// "xxxId" fields whose sibling "xxxName"/"xxxCode" is already shown are redundant noise.
function shouldHideKey(key: string, siblingKeys: string[]): boolean {
  if (key === 'id') return true
  if (/Id$/.test(key)) {
    const base = key.slice(0, -2)
    if (siblingKeys.includes(`${base}Name`) || siblingKeys.includes(`${base}Code`)) return true
  }
  return false
}

function formatFieldValue(value: unknown, key?: string, resolveId?: ResolveId): string {
  if (value === undefined) return '(sin definir)'
  if (value === null) return '—'
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  if (typeof value === 'string') {
    if (key && /Id$/.test(key)) {
      const resolved = resolveId?.(key, value)
      if (resolved) return resolved
      return value.length > 12 ? `${value.slice(0, 8)}…` : value
    }
    if (ISO_DATE_RE.test(value)) return formatDateTime(value)
    return truncate(value, 80)
  }
  if (typeof value === 'object') return truncate(JSON.stringify(value), 80)
  return truncate(String(value), 80)
}

function diffFields(before: PlainRecord | undefined, after: PlainRecord | undefined): Row[] {
  const keys = Array.from(new Set([...(before ? Object.keys(before) : []), ...(after ? Object.keys(after) : [])]))
  return keys
    .filter((k) => !shouldHideKey(k, keys))
    .map((key) => ({
      key,
      before: before?.[key],
      after: after?.[key],
      changed: JSON.stringify(before?.[key]) !== JSON.stringify(after?.[key]),
    }))
}

function itemLabel(item: PlainRecord): string {
  const name = item.productName ?? item.name
  const code = item.productCode ?? item.code
  if (typeof name === 'string') return typeof code === 'string' ? `${name} (${code})` : name
  return 'Ítem'
}

// Matched by productId (stable across corrections), not the row's own id — the
// backend recreates item rows with new ids on every correction, so matching by
// row id would never line up the "before" and "after" version of the same line.
function itemKey(item: PlainRecord, index: number): string {
  if (typeof item.productId === 'string') return item.productId
  if (typeof item.id === 'string') return item.id
  return String(index)
}

// Renders line-item (products, etc.) changes as grouped diffs instead of one raw JSON blob.
function ItemsDiff({ before, after, resolveId }: { before: unknown; after: unknown; resolveId?: ResolveId }) {
  if (!isItemArray(before) && !isItemArray(after)) return null

  const beforeItems = isItemArray(before) ? before : []
  const afterItems = isItemArray(after) ? after : []
  const beforeMap = new Map(beforeItems.map((it, i) => [itemKey(it, i), it]))
  const afterMap = new Map(afterItems.map((it, i) => [itemKey(it, i), it]))
  const ids = Array.from(new Set([...beforeMap.keys(), ...afterMap.keys()]))

  const entries = ids
    .map((id) => {
      const b = beforeMap.get(id)
      const a = afterMap.get(id)
      const changedFields = diffFields(b, a).filter((f) => f.changed)
      const status: 'added' | 'removed' | 'changed' = !b ? 'added' : !a ? 'removed' : 'changed'
      return { id, item: (a ?? b) as PlainRecord, changedFields, status }
    })
    .filter((e) => e.status !== 'changed' || e.changedFields.length > 0)

  if (entries.length === 0) return null

  return (
    <div className="mt-3">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Ítems</p>
      <div className="space-y-1.5">
        {entries.map((e) => (
          <div key={e.id} className="rounded-md border border-zinc-200 px-3 py-2">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-xs font-medium text-zinc-700">{itemLabel(e.item)}</span>
              {e.status === 'added' && (
                <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">Nuevo</span>
              )}
              {e.status === 'removed' && (
                <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700">Eliminado</span>
              )}
            </div>
            {e.status === 'changed' && (
              <ul className="space-y-0.5">
                {e.changedFields.map((f) => (
                  <li key={f.key} className="text-xs text-zinc-500">
                    {humanizeKey(f.key)}:{' '}
                    <span className="text-red-700 line-through decoration-red-300">
                      {formatFieldValue(f.before, f.key, resolveId)}
                    </span>
                    {' → '}
                    <span className="font-medium text-emerald-700">{formatFieldValue(f.after, f.key, resolveId)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Raw side-by-side JSON fallback for non-object payloads (arrays, primitives,
// or values that failed to parse) where a field-level diff isn't possible.
function RawValueDiff({ oldValue, newValue }: Pick<Props, 'oldValue' | 'newValue'>) {
  const hasOld = oldValue !== null
  const hasNew = newValue !== null

  return (
    <div className={`grid gap-3 ${hasOld && hasNew ? 'grid-cols-2' : 'grid-cols-1 max-w-xl'}`}>
      {hasOld && (
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Antes</p>
          <pre className="overflow-auto rounded-md border border-zinc-200 bg-white p-3 text-[11px] leading-relaxed text-zinc-600 max-h-48">
            {safeParseJson(oldValue)}
          </pre>
        </div>
      )}
      {hasNew && (
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Después</p>
          <pre className="overflow-auto rounded-md border border-zinc-200 bg-white p-3 text-[11px] leading-relaxed text-zinc-600 max-h-48">
            {safeParseJson(newValue)}
          </pre>
        </div>
      )}
    </div>
  )
}

export function AuditValueDiff({ oldValue, newValue, resolveId }: Props) {
  const [showUnchanged, setShowUnchanged] = useState(false)

  if (oldValue === null && newValue === null) return null

  const oldObj = tryParseObject(oldValue)
  const newObj = tryParseObject(newValue)

  // Fall back to raw JSON when either side isn't a plain object we can diff field by field.
  const oldIsObject = oldValue === null || oldObj !== null
  const newIsObject = newValue === null || newObj !== null
  if (!oldIsObject || !newIsObject) {
    return <RawValueDiff oldValue={oldValue} newValue={newValue} />
  }

  const rows = diffFields(oldObj ?? undefined, newObj ?? undefined).filter((r) => r.key !== 'items')
  const changedRows = rows.filter((r) => r.changed)
  const unchangedRows = rows.filter((r) => !r.changed)
  const visibleRows = showUnchanged ? rows : changedRows

  const hasItems = 'items' in (oldObj ?? {}) || 'items' in (newObj ?? {})

  if (rows.length === 0 && !hasItems) return null

  return (
    <div>
      {changedRows.length === 0 ? (
        <p className="text-xs text-zinc-400">No se detectaron cambios en los campos.</p>
      ) : (
        <table className="w-full max-w-2xl border-collapse text-xs">
          <thead>
            <tr className="border-b border-zinc-200">
              <th className="py-1.5 pr-3 text-left text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                Campo
              </th>
              <th className="py-1.5 px-3 text-left text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                Antes
              </th>
              <th className="w-6" />
              <th className="py-1.5 pl-3 text-left text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                Después
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {visibleRows.map((row) => (
              <tr key={row.key}>
                <td className="py-1.5 pr-3 font-medium text-zinc-600">{humanizeKey(row.key)}</td>
                {row.changed ? (
                  <>
                    <td className="py-1.5 px-3">
                      <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-red-700 line-through decoration-red-300">
                        {formatFieldValue(row.before, row.key, resolveId)}
                      </span>
                    </td>
                    <td className="text-zinc-300">
                      <ArrowRight size={12} />
                    </td>
                    <td className="py-1.5 pl-3">
                      <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-700">
                        {formatFieldValue(row.after, row.key, resolveId)}
                      </span>
                    </td>
                  </>
                ) : (
                  <td colSpan={3} className="py-1.5 px-3 text-zinc-400">
                    {formatFieldValue(row.after, row.key, resolveId)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {unchangedRows.length > 0 && (
        <button
          onClick={() => setShowUnchanged((v) => !v)}
          className="mt-2 text-[11px] text-zinc-400 underline hover:text-zinc-700"
        >
          {showUnchanged ? 'Ocultar' : 'Ver'} {unchangedRows.length} campo{unchangedRows.length !== 1 ? 's' : ''} sin cambios
        </button>
      )}
      {hasItems && <ItemsDiff before={oldObj?.items} after={newObj?.items} resolveId={resolveId} />}
    </div>
  )
}
