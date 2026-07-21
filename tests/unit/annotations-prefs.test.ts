import { describe, expect, it } from 'vitest'
import { createAnnotationPrefs } from '../../app/lib/annotations/prefs'

function fakeStorage(): Storage {
  const m = new Map<string, string>()
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => { m.set(k, v) },
    removeItem: (k: string) => { m.delete(k) },
    clear: () => m.clear(),
    key: () => null,
    get length() { return m.size },
  } as Storage
}

function throwingStorage(): Storage {
  return {
    getItem: () => { throw new Error('denied') },
    setItem: () => { throw new Error('quota') },
    removeItem: () => {}, clear: () => {}, key: () => null, length: 0,
  } as unknown as Storage
}

describe('annotation prefs', () => {
  it('round-trips the name through storage', () => {
    const s = fakeStorage()
    createAnnotationPrefs(s).setName('CS')
    expect(createAnnotationPrefs(s).getName()).toBe('CS')
  })
  it('round-trips a valid color and rejects junk', () => {
    const s = fakeStorage()
    const prefs = createAnnotationPrefs(s)
    prefs.setColor('violet')
    expect(prefs.getColor()).toBe('violet')
    s.setItem('copperhead-annotations-ui-v1:color', 'chartreuse')
    expect(prefs.getColor()).toBeNull()
  })
  it('degrades to in-memory when storage throws (private windows)', () => {
    const prefs = createAnnotationPrefs(throwingStorage())
    prefs.setName('KB')
    expect(prefs.getName()).toBe('KB')
  })
  it('works with no storage at all (SSR)', () => {
    const prefs = createAnnotationPrefs(null)
    expect(prefs.getName()).toBe('')
    prefs.setName('X')
    expect(prefs.getName()).toBe('X')
  })
})
