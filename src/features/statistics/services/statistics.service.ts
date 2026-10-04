import { isAxiosError } from 'axios'
import { eachDayOfInterval, format, parseISO } from 'date-fns'
import { api } from '@/shared/lib/api'
import { fetchDispenserMovements } from '@/features/dispensers/services/dispensers.service'
import type { DispenserMovement } from '@/features/dispensers/types'
import type {
  DispenserIssue,
  DispenserIssueKind,
  DispenserStats,
  DispenserStatsRange,
  DispenserUserStats,
} from '../types'

// Stats come from GET /dispenser-movements/stats (aggregated in SQL). Older backends
// don't have it: they route "stats" to GET /{id} and fail parsing it as a UUID
// (500), or answer 404/400. In that case we fall back to fetching the raw movements
// and aggregating here. Remove the fallback once every environment runs the new backend.
const LEGACY_BACKEND_STATUSES = [400, 404, 500]

type ApiResponse<T> = { data: T; message: string }

export const MAX_RANGE_DAYS = 92
const PAGE_SIZE = 200
// Gaps longer than this between two movements of the same user count as a break,
// not as working pace.
const SHIFT_GAP_MINUTES = 60
const NO_USER = 'Sin usuario'

async function fetchAllMovements(range: DispenserStatsRange): Promise<DispenserMovement[]> {
  const first = await fetchDispenserMovements({ ...range, page: 0, size: PAGE_SIZE })
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, i) =>
      fetchDispenserMovements({ ...range, page: i + 1, size: PAGE_SIZE })
    )
  )
  return [first, ...rest].flatMap((p) => p.content)
}

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function issueKinds(m: DispenserMovement): DispenserIssueKind[] {
  const kinds: DispenserIssueKind[] = []
  if (m.status === 'SKIPPED_UNREGISTERED') kinds.push('skipped')
  if (m.status === 'AGUAS_ERROR') kinds.push('aguas_error')
  if (m.odooStatus === 'ERROR') kinds.push('odoo_error')
  if ((m.excludedSerials?.length ?? 0) > 0) kinds.push('excluded')
  return kinds
}

function userStats(user: string, list: DispenserMovement[]): DispenserUserStats {
  const count = (pred: (m: DispenserMovement) => boolean) => list.filter(pred).length
  const rate = (n: number) => (list.length ? n / list.length : 0)

  const gaps: number[] = []
  const sorted = [...list].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  for (let i = 1; i < sorted.length; i++) {
    const minutes = (Date.parse(sorted[i].createdAt) - Date.parse(sorted[i - 1].createdAt)) / 60_000
    if (minutes > 0 && minutes <= SHIFT_GAP_MINUTES) gaps.push(minutes)
  }

  return {
    user,
    movements: list.length,
    installMovements: count((m) => m.type === 'LOAD'),
    withdrawalMovements: count((m) => m.type === 'UNLOAD'),
    dispensers: list.reduce((sum, m) => sum + m.serials.length, 0),
    skippedRate: rate(count((m) => m.status === 'SKIPPED_UNREGISTERED')),
    errorRate: rate(count((m) => m.status === 'AGUAS_ERROR' || m.odooStatus === 'ERROR')),
    excludedRate: rate(count((m) => (m.excludedSerials?.length ?? 0) > 0)),
    medianGapMinutes: median(gaps),
  }
}

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const k = key(item)
    const bucket = map.get(k)
    if (bucket) bucket.push(item)
    else map.set(k, [item])
  }
  return map
}

export function computeDispenserStats(
  range: DispenserStatsRange,
  movements: DispenserMovement[]
): DispenserStats {
  const active = movements.filter((m) => m.status !== 'CANCELLED')
  const installs = active.filter((m) => m.type === 'LOAD')
  const withdrawals = active.filter((m) => m.type === 'UNLOAD')
  const serialsOf = (list: DispenserMovement[]) => list.reduce((sum, m) => sum + m.serials.length, 0)

  const installedDispensers = serialsOf(installs)
  const withdrawnDispensers = serialsOf(withdrawals)

  // ── Daily volume (every day in range, zero-filled) ──────────────────────────
  const byDate = groupBy(active, (m) => m.movementDate)
  const daily = eachDayOfInterval({ start: parseISO(range.from), end: parseISO(range.to) }).map((day) => {
    const date = format(day, 'yyyy-MM-dd')
    const list = byDate.get(date) ?? []
    const dayInstalls = list.filter((m) => m.type === 'LOAD')
    const dayWithdrawals = list.filter((m) => m.type === 'UNLOAD')
    return {
      date,
      installed: serialsOf(dayInstalls),
      withdrawn: serialsOf(dayWithdrawals),
      installMovements: dayInstalls.length,
      withdrawalMovements: dayWithdrawals.length,
    }
  })

  // ── Weekday × hour heatmap (by registration time) ───────────────────────────
  const heat = new Map<string, number>()
  for (const m of active) {
    const d = new Date(m.createdAt)
    const weekday = (d.getDay() + 6) % 7
    const key = `${weekday}-${d.getHours()}`
    heat.set(key, (heat.get(key) ?? 0) + 1)
  }
  const heatmap = Array.from(heat, ([key, movementsCount]) => {
    const [weekday, hour] = key.split('-').map(Number)
    return { weekday, hour, movements: movementsCount }
  })

  // ── Per user (who registered it) ────────────────────────────────────────────
  const users = Array.from(groupBy(active, (m) => m.registeredByUsername ?? NO_USER))
    .map(([user, list]) => userStats(user, list))
    .sort((a, b) => b.movements - a.movements)

  // ── Per technician (driver delivering / collecting) ─────────────────────────
  const technicians = Array.from(groupBy(active, (m) => m.technician?.trim() || 'Sin técnico'))
    .map(([technician, list]) => ({
      technician,
      routes: new Set(list.map((m) => m.routeCode)).size,
      installed: serialsOf(list.filter((m) => m.type === 'LOAD')),
      withdrawn: serialsOf(list.filter((m) => m.type === 'UNLOAD')),
      movements: list.length,
    }))
    .sort((a, b) => b.installed + b.withdrawn - (a.installed + a.withdrawn))

  // ── Integration quality ─────────────────────────────────────────────────────
  const issues: DispenserIssue[] = active
    .map((m) => ({ m, kinds: issueKinds(m) }))
    .filter(({ kinds }) => kinds.length > 0)
    .map(({ m, kinds }) => ({
      id: m.id,
      createdAt: m.createdAt,
      type: m.type,
      routeCode: m.routeCode,
      technician: m.technician,
      user: m.registeredByUsername ?? NO_USER,
      kinds,
      excludedCount: m.excludedSerials?.length ?? 0,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const serialCounts = active.map((m) => m.serials.length)

  return {
    range,
    volume: {
      installMovements: installs.length,
      withdrawalMovements: withdrawals.length,
      installedDispensers,
      withdrawnDispensers,
      netDispensers: installedDispensers - withdrawnDispensers,
      withdrawalsPer100: installedDispensers ? (withdrawnDispensers / installedDispensers) * 100 : null,
      avgSerialsPerMovement: active.length ? serialsOf(active) / active.length : null,
      maxSerialsPerMovement: serialCounts.length ? Math.max(...serialCounts) : 0,
    },
    daily,
    heatmap,
    users,
    technicians,
    quality: {
      activeMovements: active.length,
      cancelledMovements: movements.length - active.length,
      sentToAguas: active.filter((m) => m.status === 'SENT_TO_AGUAS').length,
      skippedUnregistered: active.filter((m) => m.status === 'SKIPPED_UNREGISTERED').length,
      aguasErrors: active.filter((m) => m.status === 'AGUAS_ERROR').length,
      odooErrors: active.filter((m) => m.odooStatus === 'ERROR').length,
      withExcludedSerials: active.filter((m) => (m.excludedSerials?.length ?? 0) > 0).length,
      withoutUser: active.filter((m) => !m.registeredByUsername).length,
      issues,
    },
  }
}

export async function fetchDispenserStats(range: DispenserStatsRange): Promise<DispenserStats> {
  try {
    const { data } = await api.get<ApiResponse<DispenserStats>>('/dispenser-movements/stats', {
      params: range,
    })
    return data.data
  } catch (err) {
    const status = isAxiosError(err) ? err.response?.status : undefined
    if (!status || !LEGACY_BACKEND_STATUSES.includes(status)) throw err
    console.warn(`Stats endpoint unavailable (${status}); aggregating movements in the browser`)
    const movements = await fetchAllMovements(range)
    return computeDispenserStats(range, movements)
  }
}
