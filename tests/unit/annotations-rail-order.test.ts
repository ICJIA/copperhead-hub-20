import { describe, expect, it } from 'vitest'
import { orderThreads } from '../../app/lib/annotations/rail-order'
import type { RailThread } from '../../app/types/annotations'

function thread(id: string, opts: { start: number | null, resolved?: boolean, createdAt?: string }): RailThread {
  return {
    annotation: {
      id,
      pagePath: '/p',
      anchor: { exact: 'x', prefix: '', suffix: '', offset: 0 },
      color: 'orange',
      resolved: opts.resolved ?? false,
      createdAt: opts.createdAt ?? '2026-07-21T00:00:00Z',
      authorName: 'CS',
      comments: [],
    },
    orphan: opts.start === null,
    start: opts.start,
  }
}

describe('orderThreads', () => {
  it('sorts anchored threads by document position', () => {
    const out = orderThreads([thread('b', { start: 50 }), thread('a', { start: 10 })], 'all')
    expect(out.map(t => t.annotation.id)).toEqual(['a', 'b'])
  })
  it('puts orphans last, ordered by createdAt', () => {
    const out = orderThreads([
      thread('orphan-late', { start: null, createdAt: '2026-07-21T02:00:00Z' }),
      thread('anchored', { start: 99 }),
      thread('orphan-early', { start: null, createdAt: '2026-07-21T01:00:00Z' }),
    ], 'all')
    expect(out.map(t => t.annotation.id)).toEqual(['anchored', 'orphan-early', 'orphan-late'])
  })
  it('filters by open / resolved / all', () => {
    const threads = [thread('open1', { start: 1 }), thread('done1', { start: 2, resolved: true })]
    expect(orderThreads(threads, 'open').map(t => t.annotation.id)).toEqual(['open1'])
    expect(orderThreads(threads, 'resolved').map(t => t.annotation.id)).toEqual(['done1'])
    expect(orderThreads(threads, 'all')).toHaveLength(2)
  })
})
