// Which threads the rail shows, in what order: filter (open/resolved/all),
// then document position; orphans sink to the bottom ordered by creation
// time. Extracted from the rail SFC so the ordering contract is unit-tested.
import type { RailThread } from '~/types/annotations'

export type RailFilter = 'open' | 'resolved' | 'all'

export function orderThreads(threads: RailThread[], filter: RailFilter): RailThread[] {
  const byFilter = threads.filter(t =>
    filter === 'all' ? true : filter === 'resolved' ? t.annotation.resolved : !t.annotation.resolved,
  )
  return [...byFilter].sort((a, b) => {
    if (a.orphan !== b.orphan) return a.orphan ? 1 : -1
    if (!a.orphan) return (a.start ?? 0) - (b.start ?? 0)
    return a.annotation.createdAt.localeCompare(b.annotation.createdAt)
  })
}
