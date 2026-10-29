import { currentWeek, isIsoDay, rangeError, type DateRange } from './dateRange'

// The page address keeps the view so a reload or a copied link shows the same thing (FR-39).
export const PARAM = { from: 'from', to: 'to', branch: 'branch', user: 'user' } as const

export type PageState = {
  range: DateRange
  branchId: string
  userId: string | null
}

/**
 * Reads the page state from the address. Anything unusable falls back to its default (FR-40): a range
 * that is not two real days or that FR-27a rejects becomes the current week, and only admins keep a
 * branch. Whether the branch and the user exist is checked by the page once they are loaded.
 */
export function readPageState(params: URLSearchParams, today: Date, isAdmin: boolean): PageState {
  const from = params.get(PARAM.from) ?? ''
  const to = params.get(PARAM.to) ?? ''
  const rangeOk = isIsoDay(from) && isIsoDay(to) && rangeError(from, to) === null
  return {
    range: rangeOk ? { from, to } : currentWeek(today),
    branchId: isAdmin ? params.get(PARAM.branch) ?? '' : '',
    userId: params.get(PARAM.user) || null,
  }
}

/** The address for a state: empty values are left out. */
export function writePageState(state: PageState): URLSearchParams {
  const params = new URLSearchParams({ [PARAM.from]: state.range.from, [PARAM.to]: state.range.to })
  if (state.branchId) params.set(PARAM.branch, state.branchId)
  if (state.userId) params.set(PARAM.user, state.userId)
  return params
}

export function sameParams(a: URLSearchParams, b: URLSearchParams): boolean {
  const sorted = (p: URLSearchParams) => [...p.entries()].sort(([x], [y]) => x.localeCompare(y)).join('&')
  return sorted(a) === sorted(b)
}
