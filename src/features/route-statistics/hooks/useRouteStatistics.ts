import { useQuery } from '@tanstack/react-query'
import { fetchRouteStatistics, RouteStatisticsRequestError } from '../services/route-statistics.service'
import type { RouteStatisticsFilters } from '../types'

const STALE_MS = 60_000

export function useRouteStatistics(filters: RouteStatisticsFilters, enabled: boolean) {
  return useQuery({
    queryKey: ['route-statistics', filters],
    queryFn: () => fetchRouteStatistics(filters),
    enabled,
    staleTime: STALE_MS,
    // A 403/400 will not fix itself by retrying.
    retry: (count, error) => !(error instanceof RouteStatisticsRequestError) && count < 2,
  })
}

export function routeStatisticsErrorMessage(error: unknown): string | undefined {
  return error instanceof RouteStatisticsRequestError ? error.message : undefined
}
