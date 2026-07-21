// @vitest-environment happy-dom
import { describe, expect, it, beforeEach } from 'vitest'
import { paintOffsets, clearAnnotations } from '~/lib/annotations/paint'
import { textContentOf } from '~/lib/annotations/anchor'

let container: HTMLElement

beforeEach(() => {
  container = document.createElement('div')
  container.innerHTML = '<p>The quick <strong>brown</strong> fox jumps.</p>'
  document.body.appendChild(container)
})

describe('paintOffsets', () => {
  it('wraps the span in mark elements with id, color, and a11y attributes', () => {
    const text = textContentOf(container)
    const start = text.indexOf('quick brown')
    const marks = paintOffsets(container, start, start + 'quick brown'.length, 'a1', 'teal')
    expect(marks.length).toBeGreaterThan(0)
    for (const m of marks) {
      expect(m.tagName).toBe('MARK')
      expect(m.className).toBe('ann ann--teal')
      expect(m.dataset.annId).toBe('a1')
      expect(m.getAttribute('tabindex')).toBe('0')
      expect(m.getAttribute('role')).toBe('button')
    }
    expect(container.querySelectorAll('mark[data-ann-id="a1"]').length).toBe(marks.length)
  })
  it('never changes the container text', () => {
    const before = textContentOf(container)
    paintOffsets(container, 4, 15, 'a1', 'orange')
    expect(textContentOf(container)).toBe(before)
  })
})

describe('clearAnnotations', () => {
  it('paint → clear restores the original DOM text and removes all marks', () => {
    const before = textContentOf(container)
    paintOffsets(container, 4, 15, 'a1', 'lime')
    clearAnnotations(container)
    expect(container.querySelectorAll('mark[data-ann-id]').length).toBe(0)
    expect(textContentOf(container)).toBe(before)
  })
  it('paint → clear → paint at the same offsets works (idempotence)', () => {
    const text = textContentOf(container)
    const start = text.indexOf('fox')
    paintOffsets(container, start, start + 3, 'a1', 'violet')
    clearAnnotations(container)
    const marks = paintOffsets(container, start, start + 3, 'a2', 'violet')
    expect(marks.length).toBe(1)
    expect(marks[0]!.textContent).toBe('fox')
  })
})
