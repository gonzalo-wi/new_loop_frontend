import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchBranches } from '@/features/branches/services/branches.service'
import { useAuthStore } from '@/features/auth/store/auth.store'
import type { ID } from '@/shared/types'
import { currentWeek, rangeError } from '../lib/dateRange'
import { fetchPerformanceSummary, fetchUserTrend, PerformanceRequestError } from '../services/performance.service'
import type { PerformanceFilters } from '../types'

const STALE_MS = 60_000

// A 403/400 will not fix itself by retrying.
const retryUnlessExplained = (count: number, error: unknown) =>
  !(error instanceof PerformanceRequestError) && count < 2

/** Range (default: this week) and, for admins only, the branch. */
export function usePerformanceFilters() {
  const isAdmin = useAuthStore((state) => state.user?.role === 'admin')
  const [range, setRange] = useState(() => currentWeek(new Date()))
  const [branchId, setBranchId] = useState('')

  const filters: PerformanceFilters = { ...range, branchId: isAdmin && branchId ? branchId : undefined }
  return {
    filters,
    isAdmin,
    error: rangeError(range.from, range.to),
    setFrom: (from: string) => setRange((r) => ({ ...r, from })),
    setTo: (to: string) => setRange((r) => ({ ...r, to })),
    resetToThisWeek: () => setRange(currentWeek(new Date())),
    branchId,
    setBranchId,
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
