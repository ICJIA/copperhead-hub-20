/**
 * Build the text for a card's "Read more" call-to-action so it reflects the
 * item's title instead of a bare "Read More".
 *
 * Returns two strings and a flag:
 *  - `full`    — the complete accessible name ("Read more about {whole title}"),
 *                bound to the link's `aria-label` so screen readers and voice
 *                control get the entire title (WCAG 2.4.4 Link Purpose).
 *  - `visible` — a shorter, word-boundary prefix shown on screen. It is always
 *                a prefix of `full`, so the accessible name contains the visible
 *                text (WCAG 2.5.3 Label in Name). The truncation ellipsis is
 *                added in CSS, never here, so it stays out of that comparison.
 *  - `truncated` — true when `visible` dropped words from the title (the UI
 *                appends the ellipsis only then).
 *
 * Deterministic: the same title and verb always produce the same result.
 */

/** Visible title budget, in characters, before we clip on a word boundary. */
const VISIBLE_TITLE_MAX_CHARS = 32

export interface ReadMoreLabel {
  visible: string
  full: string
  truncated: boolean
}

export function readMoreLabel(title: string, verb = 'Read more about'): ReadMoreLabel {
  const clean = (title ?? '').trim().replace(/\s+/g, ' ')
  if (!clean) return { visible: verb, full: verb, truncated: false }

  const words = clean.split(' ')
  let short = ''
  for (const word of words) {
    const next = short ? `${short} ${word}` : word
    // Always keep the first word; only stop once we already have something.
    if (short && next.length > VISIBLE_TITLE_MAX_CHARS) break
    short = next
  }

  const truncated = short.length < clean.length
  return {
    visible: `${verb} ${short}`,
    full: `${verb} ${clean}`,
    truncated,
  }
}
