import { describe, expect, it } from 'vitest'
import { formatDate } from '../../app/utils/formatDate'

describe('formatDate', () => {
  it('formats a date-only string without timezone shift', () => {
    // Parsed as UTC midnight; local-time formatting would show July 10
    // in US-Central. This is the regression the old codebase shipped.
    expect(formatDate('2026-07-11')).toBe('July 11, 2026')
  })

  it('formats an ISO datetime string', () => {
    expect(formatDate('2026-03-17T15:30:00Z')).toMatch(/March 1[67], 2026/)
  })

  it('formats a Date object', () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe('January 5, 2026')
  })

  it('returns an empty string for null, undefined, and empty input', () => {
    expect(formatDate(null)).toBe('')
    expect(formatDate(undefined)).toBe('')
    expect(formatDate('')).toBe('')
  })

  it('returns an empty string for unparseable input', () => {
    expect(formatDate('not-a-date')).toBe('')
  })
})
