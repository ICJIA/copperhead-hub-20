/**
 * The one markdown pipeline. CMS markdown becomes sanitized HTML plus a
 * table of contents here and nowhere else — no raw `v-html` of CMS strings
 * anywhere in the app (predecessor defect S6), no divergent copies of the
 * footnote/slug/TOC logic (defect P8).
 */
import { Marked } from 'marked'
import markedFootnote from 'marked-footnote'
import DOMPurify from 'isomorphic-dompurify'

export interface TocEntry {
  id: string
  text: string
  depth: number
}

export interface RenderedMarkdown {
  html: string
  toc: TocEntry[]
}

/** Heading text → URL-safe id. Collision-proofed by the caller's counter. */
function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/<[^>]+>/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// External links opened in a new tab must not leak an opener handle.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
    node.setAttribute('rel', 'noopener noreferrer')
  }
})

export function renderMarkdown(markdown: string): RenderedMarkdown {
  if (!markdown) return { html: '', toc: [] }

  const toc: TocEntry[] = []
  const seenIds = new Map<string, number>()

  // A fresh instance per render keeps heading-id state document-local and
  // registers the footnote extension exactly once per pipeline.
  const marked = new Marked({ gfm: true })
  marked.use(markedFootnote())
  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const inline = this.parser.parseInline(tokens)
        const plain = inline.replace(/<[^>]+>/g, '').trim()
        let id = slugifyHeading(plain) || 'section'
        const seen = seenIds.get(id) ?? 0
        seenIds.set(id, seen + 1)
        if (seen > 0) id = `${id}-${seen + 1}`
        if (depth === 2) toc.push({ id, text: plain, depth })
        return `<h${depth} id="${id}">${inline}</h${depth}>\n`
      },
    },
  })

  const rendered = marked.parse(markdown, { async: false })

  const html = DOMPurify.sanitize(rendered, {
    ADD_ATTR: ['target'],
  })

  return { html, toc }
}

/** Sanitize a CMS-authored HTML fragment (citations, funding notes). */
export function sanitizeHtml(fragment: string): string {
  if (!fragment) return ''
  return DOMPurify.sanitize(fragment, { ADD_ATTR: ['target'] })
}
