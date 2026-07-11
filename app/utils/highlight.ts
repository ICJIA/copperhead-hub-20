/**
 * Split text into segments for search-term highlighting. Pure text
 * segmentation — rendering happens via text nodes (never v-html), so
 * highlighting is inherently XSS-safe.
 */
export interface TextSegment {
  text: string
  hit: boolean
}

export function segmentText(text: string, term: string): TextSegment[] {
  const needle = term.trim().toLowerCase()
  if (!text) return []
  if (!needle) return [{ text, hit: false }]

  const haystack = text.toLowerCase()
  const segments: TextSegment[] = []
  let cursor = 0

  for (;;) {
    const index = haystack.indexOf(needle, cursor)
    if (index === -1) {
      if (cursor < text.length) segments.push({ text: text.slice(cursor), hit: false })
      break
    }
    if (index > cursor) segments.push({ text: text.slice(cursor, index), hit: false })
    segments.push({ text: text.slice(index, index + needle.length), hit: true })
    cursor = index + needle.length
  }

  return segments
}
