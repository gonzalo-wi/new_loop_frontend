import { ChevronRight } from 'lucide-react'
import { userLabel } from '../lib/summary'
import type { UserPerformance } from '../types'

/** The user's name, with a chevron when the row opens their detail (unknown users have none). */
export function UserCell({ user }: { user: UserPerformance }) {
  return (
    <span className="inline-flex items-center gap-1 font-medium text-zinc-900">
      {userLabel(user)}
      {user.userId !== null && <ChevronRight size={14} className="text-zinc-400" aria-hidden />}
    </span>
  )
}
