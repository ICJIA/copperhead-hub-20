import { describe, expect, it } from 'vitest'
import { annotationsToDocx, annotationsToJson, annotationsToMarkdown, parseAnnotationsImport } from '../../app/lib/annotations/export'
import type { PageAnnotation } from '../../app/types/annotations'

const SAMPLE: PageAnnotation[] = [
  {
    id: 'a1', pagePath: '/', color: 'orange', resolved: false,
    createdAt: '2026-07-22T10:00:00.000Z', authorName: 'JW',
    anchor: { exact: 'impartial, rigorous', prefix: 'delivers ', suffix: ' and', offset: 30 },
    comments: [
      { id: 'c1', body: 'Great phrase', authorName: 'JW', createdAt: '2026-07-22T10:00:00.000Z' },
      { id: 'c2', body: 'Agreed', authorName: 'CS', createdAt: '2026-07-22T10:05:00.000Z' },
    ],
  },
  {
    id: 'a2', pagePath: '/articles/foo', color: 'teal', resolved: true,
    createdAt: '2026-07-22T11:00:00.000Z', authorName: 'CS',
    anchor: { exact: 'penal institution', prefix: '', suffix: '', offset: 5 },
    comments: [{ id: 'c3', body: 'Check this', authorName: 'CS', createdAt: '2026-07-22T11:00:00.000Z' }],
  },
]

describe('annotationsToJson', () => {
  it('wraps annotations with metadata and round-trips through JSON.parse', () => {
    const parsed = JSON.parse(annotationsToJson(SAMPLE, '2026-07-22T12:00:00.000Z'))
    expect(parsed.format).toBe('copperhead-annotations')
    expect(parsed.count).toBe(2)
    expect(parsed.annotations).toHaveLength(2)
    expect(parsed.annotations[0].id).toBe('a1')
  })
})

describe('annotationsToMarkdown', () => {
  it('groups by page and lists highlighted text and comments', () => {
    const md = annotationsToMarkdown(SAMPLE, '2026-07-22T12:00:00.000Z')
    expect(md).toContain('# ICJIA Research Hub — Manager Annotations')
    expect(md).toContain('## Page: `/`')
    expect(md).toContain('## Page: `/articles/foo`')
    expect(md).toContain('> impartial, rigorous')
    expect(md).toContain('**JW**')
    expect(md).toContain('Great phrase')
    expect(md).toContain('resolved') // a2 is resolved
  })
})

describe('annotationsToDocx', () => {
  it('produces a non-empty Word document blob', async () => {
    const blob = await annotationsToDocx(SAMPLE, '2026-07-22T12:00:00.000Z')
    // A real .docx is a zip; even a two-annotation doc is well over 1 KB.
    expect(blob.size).toBeGreaterThan(1000)
  })
})

describe('parseAnnotationsImport', () => {
  it('parses the wrapped export shape and preserves comments', () => {
    const back = parseAnnotationsImport(annotationsToJson(SAMPLE, '2026-07-22T12:00:00.000Z'))
    expect(back).toHaveLength(2)
    expect(back[0]!.id).toBe('a1')
    expect(back[0]!.comments).toHaveLength(2)
    expect(back[1]!.resolved).toBe(true)
  })
  it('parses a bare array too', () => {
    expect(parseAnnotationsImport(JSON.stringify(SAMPLE))).toHaveLength(2)
  })
  it('drops invalid entries and defaults an unknown color to orange', () => {
    const dirty = JSON.stringify([
      { id: 'x', pagePath: '/', anchor: { exact: 'hi' }, comments: [{ body: 'ok' }], color: 'chartreuse' },
      { nope: true },
    ])
    const back = parseAnnotationsImport(dirty)
    expect(back).toHaveLength(1)
    expect(back[0]!.color).toBe('orange')
    expect(back[0]!.comments[0]!.body).toBe('ok')
  })
  it('throws when there is no annotations array or the text is not JSON', () => {
    expect(() => parseAnnotationsImport('{"foo":1}')).toThrow()
    expect(() => parseAnnotationsImport('not json')).toThrow()
  })
})
