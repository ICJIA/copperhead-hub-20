import { describe, expect, it } from 'vitest'
import { normalizePagePath } from '../../app/lib/annotations/page-path'

describe('normalizePagePath', () => {
  it('passes through a clean route path', () => {
    expect(normalizePagePath('/articles/foo')).toBe('/articles/foo')
  })
  it('strips the site baseURL when present', () => {
    expect(normalizePagePath('/researchhub/articles/foo')).toBe('/articles/foo')
    expect(normalizePagePath('/researchhub/')).toBe('/')
    expect(normalizePagePath('/researchhub')).toBe('/')
  })
  it('does not strip a lookalike prefix', () => {
    expect(normalizePagePath('/researchhubs/foo')).toBe('/researchhubs/foo')
  })
  it('strips trailing slashes except on root', () => {
    expect(normalizePagePath('/articles/foo/')).toBe('/articles/foo')
    expect(normalizePagePath('/')).toBe('/')
  })
  it('drops query and hash', () => {
    expect(normalizePagePath('/search?q=x#top')).toBe('/search')
  })
  it('coerces empty input to root', () => {
    expect(normalizePagePath('')).toBe('/')
  })
})
