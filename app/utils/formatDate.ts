/**
 * Format a date for display (e.g., "July 11, 2026").
 *
 * Date-only strings ("2026-07-11") are formatted in UTC so the calendar date
 * never shifts with the viewer's timezone — the prior codebase formatted them
 * in local time, which rendered evening UTC timestamps a day early in
 * US-Central (plan, Appendix A.5 #4).
 */
/** Humanize CMS type values: "ProgramEvaluationSummary" → "Program Evaluation Summary". */
export function formatTypeLabel(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, c => c.toUpperCase())
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return ''

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const isDateOnly = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(isDateOnly ? { timeZone: 'UTC' } : {}),
  }).format(date)
}
