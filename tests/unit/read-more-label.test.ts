import { describe, expect, it } from 'vitest'
import { readMoreLabel } from '../../app/utils/readMoreLabel'

describe('readMoreLabel', () => {
  it('leaves a short title untruncated: visible equals full', () => {
    const { visible, full, truncated } = readMoreLabel('Opioid Trends')
    expect(full).toBe('Read more about Opioid Trends')
    expect(visible).toBe('Read more about Opioid Trends')
    expect(truncated).toBe(false)
  })

  it('truncates a long title on a word boundary and keeps the full title complete', () => {
    const title = 'Reducing Recidivism Through Evidence-Based Community Supervision Programs'
    const { visible, full, truncated } = readMoreLabel(title)

    expect(truncated).toBe(true)
    // Full accessible name carries the whole title (WCAG 2.4.4 link purpose).
    expect(full).toBe(`Read more about ${title}`)
    // Visible text is a shorter, word-boundary prefix of the full name — the
    // invariant WCAG 2.5.3 (Label in Name) needs: accessible name starts with
    // the visible text, and the cut lands at a space (never mid-word).
    expect(full.startsWith(visible)).toBe(true)
    expect(visible.length).toBeLessThan(full.length)
    expect(full.startsWith(`${visible} `)).toBe(true)
  })

  it('honors a custom verb for non-article CTAs', () => {
    const { visible, full, truncated } = readMoreLabel('Justice Counts', 'Learn more about')
    expect(visible).toBe('Learn more about Justice Counts')
    expect(full).toBe('Learn more about Justice Counts')
    expect(truncated).toBe(false)
  })

  it('collapses and trims surrounding whitespace in the title', () => {
    const { visible, full } = readMoreLabel('  Opioid   Trends  ')
    expect(visible).toBe('Read more about Opioid Trends')
    expect(full).toBe('Read more about Opioid Trends')
  })

  it('keeps at least the first word even when it alone exceeds the budget', () => {
    const { visible, full, truncated } = readMoreLabel('Deinstitutionalizationdynamics matter greatly here today')
    expect(visible).toBe('Read more about Deinstitutionalizationdynamics')
    expect(truncated).toBe(true)
    expect(full).toContain('greatly here today')
  })

  it('is deterministic — identical input yields identical output', () => {
    const title = 'Community Supervision and Pretrial Practices in Illinois Counties'
    expect(readMoreLabel(title)).toEqual(readMoreLabel(title))
  })

  it('degrades gracefully on an empty title (no dangling "about" trailing space)', () => {
    const { visible, full, truncated } = readMoreLabel('   ')
    expect(visible).toBe('Read more about')
    expect(full).toBe('Read more about')
    expect(truncated).toBe(false)
  })
})
