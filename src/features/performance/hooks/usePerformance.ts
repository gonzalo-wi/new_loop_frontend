import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchBranches } from '@/features/branches/services/branches.service'
import { useAuthStore } from '@/features/auth/store/auth.store'
import type { ID } from '@/shared/types'
import { currentWeek, fitRange, previousPeriod, rangeError } from '../lib/dateRange'
import { readPageState, sameParams, writePageState, type PageState } from '../lib/urlFilters'
import { fetchPerformanceSummary, fetchUserTrend, PerformanceRequestError } from '../services/performance.service'
import type { PerformanceFilters } from '../types'

const STALE_MS = 60_000

// A 403/400 will not fix itself by retrying.
const retryUnlessExplained = (count: number, error: unknown) =>
  !(error instanceof PerformanceRequestError) && count < 2

/**
 * Range (default: this week), branch (admins only) and the open user, all kept in the page address
 * (FR-39). The address is rewritten in place, so fixing an invalid value adds no history entry (FR-40).
 */
export function usePerformanceFilters() {
  const isAdmin = useAuthStore((state) => state.user?.role === 'admin')
  const [params, setParams] = useSearchParams()
  const state = useMemo(() => readPageState(params, new Date(), isAdmin), [params, isAdmin])

  // Leaves in the address only what was understood (e.g. drops a supervisor's branch or a bad date).
  useEffect(() => {
    const clean = writePageState(state)
    if (!sameParams(clean, params)) setParams(clean, { replace: true })
  }, [state, params, setParams])

  const update = (change: Partial<PageState>) => setParams(writePageState({ ...state, ...change }), { replace: true })

  const filters: PerformanceFilters = { ...state.range, branchId: state.branchId || undefined }
  return {
    filters,
    isAdmin,
    error: rangeError(state.range.from, state.range.to),
    setFrom: (from: string) => from && update({ range: fitRange({ ...state.range, from }, 'from') }),
    setTo: (to: string) => to && update({ range: fitRange({ ...state.range, to }, 'to') }),
    resetToThisWeek: () => update({ range: currentWeek(new Date()) }),
    branchId: state.branchId,
    // A different branch shows other users, so the open detail closes.
    setBranchId: (branchId: string) => update({ branchId, userId: null }),
    userId: state.userId,
    setUserId: (userId: ID | null) => update({ userId }),
  }
}

export function useBranchOptions(enabled: boolean) {
  return useQuery({ queryKey: ['branches'], queryFn: fetchBranches, enabled, staleTime: 5 * STALE_MS })
}

export function usePerformanceSummary(filters: PerformanceFilters, enabled: boolean) {
  return useQuery({
    queryKey: ['performance', 'summary', filters],
    queryFn: () => fetchPerformanceSummary(filters),
    enabled,
    staleTime: STALE_MS,
    retry: retryUnlessExplained,
  })
}

/** The summary of the previous period, only to compare the tiles (FR-41); a failure just hides the change. */
export function usePreviousSummary(filters: PerformanceFilters, enabled: boolean) {
  return usePerformanceSummary({ ...filters, ...previousPeriod(filters) }, enabled)
}

export function useUserTrend(userId: ID | null, filters: PerformanceFilters) {
  return useQuery({
    queryKey: ['performance', 'user', userId, filters],
    queryFn: () => {
      // Never runs without a user: the query is disabled until one is picked.
      if (userId === null) throw new Error('No user selected')
      return fetchUserTrend(userId, filters)
    },
    enabled: userId !== null,
    staleTime: STALE_MS,
    retry: retryUnlessExplained,
  })
}

/** The message for a failed request: the explained ones (no branch, invalid range) or the generic one. */
export function requestErrorMessage(error: unknown): string | undefined {
  return error instanceof PerformanceRequestError ? error.message : undefined
}
