import { describe, expect, it, vi } from 'vitest'
import { createSupabaseAnnotationStore, annotationFromRow } from '../../app/lib/annotations/store-supabase'
import type { AnnotationRow } from '../../app/lib/annotations/store-supabase'
import type { NewPageAnnotation } from '../../app/types/annotations'

const OPTS = { url: 'https://x.supabase.co', key: 'sb_publishable_test', table: 'copperhead_annotations' }
const ENDPOINT = 'https://x.supabase.co/rest/v1/copperhead_annotations'

const ROW: AnnotationRow = {
  id: 'a1', page_path: '/articles/foo', exact: 'quick brown', prefix: 'The ', suffix: ' fox',
  offset_hint: 4, color: 'teal', resolved: false, author_name: 'CS',
  comments: [{ id: 'c1', body: 'first note', authorName: 'CS', createdAt: '2026-07-21T00:00:00Z' }],
  created_at: '2026-07-21T00:00:00Z',
}

const NEW: NewPageAnnotation = {
  pagePath: '/articles/foo',
  anchor: { exact: 'quick brown', prefix: 'The ', suffix: ' fox', offset: 4 },
  color: 'teal', resolved: false, authorName: 'CS',
  comments: [{ id: 'c1', body: 'first note', authorName: 'CS', createdAt: '2026-07-21T00:00:00Z' }],
}

describe('annotationFromRow', () => {
  it('maps a row to the domain shape', () => {
    const a = annotationFromRow(ROW)
    expect(a).toEqual({
      id: 'a1', pagePath: '/articles/foo',
      anchor: { exact: 'quick brown', prefix: 'The ', suffix: ' fox', offset: 4 },
      color: 'teal', resolved: false, createdAt: '2026-07-21T00:00:00Z', authorName: 'CS',
      comments: [{ id: 'c1', body: 'first note', authorName: 'CS', createdAt: '2026-07-21T00:00:00Z' }],
    })
  })
  it('defaults junk colors to orange and drops malformed comments', () => {
    const a = annotationFromRow({ ...ROW, color: 'plaid', comments: [{ id: 'c1' }, 'nope', null] })
    expect(a.color).toBe('orange')
    expect(a.comments).toEqual([])
  })
})

describe('createSupabaseAnnotationStore', () => {
  it('list() GETs by page_path in created order with the apikey header', async () => {
    const fetcher = vi.fn().mockResolvedValue([ROW])
    const store = createSupabaseAnnotationStore({ ...OPTS, fetcher })
    const out = await store.list('/articles/foo')
    expect(fetcher).toHaveBeenCalledWith(ENDPOINT, {
      headers: { apikey: 'sb_publishable_test' },
      query: { select: '*', page_path: 'eq./articles/foo', order: 'created_at.asc' },
    })
    expect(out).toHaveLength(1)
    expect(out[0]!.id).toBe('a1')
  })
  it('create() POSTs the row and returns the representation', async () => {
    const fetcher = vi.fn().mockResolvedValue([ROW])
    const store = createSupabaseAnnotationStore({ ...OPTS, fetcher })
    const created = await store.create(NEW)
    expect(fetcher).toHaveBeenCalledWith(ENDPOINT, {
      method: 'POST',
      headers: { apikey: 'sb_publishable_test', Prefer: 'return=representation' },
      body: {
        page_path: '/articles/foo', exact: 'quick brown', prefix: 'The ', suffix: ' fox',
        offset_hint: 4, color: 'teal', resolved: false, author_name: 'CS',
        comments: NEW.comments,
      },
    })
    expect(created.id).toBe('a1')
  })
  it('addComment() reads the row, appends, PATCHes the whole thread (last-write-wins)', async () => {
    const reply = { id: 'c2', body: 'a reply', authorName: 'KB', createdAt: '2026-07-21T01:00:00Z' }
    const patched = { ...ROW, comments: [...(ROW.comments as unknown[]), reply] }
    const fetcher = vi.fn()
      .mockResolvedValueOnce([ROW])      // read
      .mockResolvedValueOnce([patched])  // patch
    const store = createSupabaseAnnotationStore({ ...OPTS, fetcher })
    const out = await store.addComment('a1', reply)
    expect(fetcher).toHaveBeenNthCalledWith(1, ENDPOINT, {
      headers: { apikey: 'sb_publishable_test' },
      query: { select: '*', id: 'eq.a1' },
    })
    expect(fetcher).toHaveBeenNthCalledWith(2, ENDPOINT, {
      method: 'PATCH',
      headers: { apikey: 'sb_publishable_test', Prefer: 'return=representation' },
      query: { id: 'eq.a1' },
      body: { comments: [...(ROW.comments as unknown[]), reply] },
    })
    expect(out.comments).toHaveLength(2)
  })
  it('addComment() throws when the thread is gone', async () => {
    const fetcher = vi.fn().mockResolvedValue([])
    const store = createSupabaseAnnotationStore({ ...OPTS, fetcher })
    await expect(store.addComment('gone', { id: 'c', body: 'x', authorName: 'Y', createdAt: 'z' }))
      .rejects.toThrow('not found')
  })
  it('setResolved() PATCHes the flag', async () => {
    const fetcher = vi.fn().mockResolvedValue([{ ...ROW, resolved: true }])
    const store = createSupabaseAnnotationStore({ ...OPTS, fetcher })
    const out = await store.setResolved('a1', true)
    expect(fetcher).toHaveBeenCalledWith(ENDPOINT, {
      method: 'PATCH',
      headers: { apikey: 'sb_publishable_test', Prefer: 'return=representation' },
      query: { id: 'eq.a1' },
      body: { resolved: true },
    })
    expect(out.resolved).toBe(true)
  })
  it('remove() DELETEs by id', async () => {
    const fetcher = vi.fn().mockResolvedValue(undefined)
    const store = createSupabaseAnnotationStore({ ...OPTS, fetcher })
    await store.remove('a1')
    expect(fetcher).toHaveBeenCalledWith(ENDPOINT, {
      method: 'DELETE',
      headers: { apikey: 'sb_publishable_test' },
      query: { id: 'eq.a1' },
    })
  })
  it('propagates network errors', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('offline'))
    const store = createSupabaseAnnotationStore({ ...OPTS, fetcher })
    await expect(store.list('/x')).rejects.toThrow('offline')
  })
})
