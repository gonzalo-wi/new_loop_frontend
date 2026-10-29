import { ChevronRight } from 'lucide-react'
import { userLabel } from '../lib/summary'
import type { UserPerformance } from '../types'

/**
 * The user's name, with a chevron when the row opens their detail (unknown users have none). It is a
 * button so the row can be reached with the keyboard and focus returns to it when the detail closes;
 * the click itself bubbles to the row.
 */
export function UserCell({ user }: { user: UserPerformance }) {
  if (user.userId === null) return <span className="font-medium text-zinc-900">{userLabel(user)}</span>
  return (
    <button type="button" className="inline-flex items-center gap-1 rounded font-medium text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
      {userLabel(user)}
      <ChevronRight size={14} className="text-zinc-400" aria-hidden />
    </button>
  )
}
