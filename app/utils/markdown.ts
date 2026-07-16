/**
 * The one markdown pipeline. CMS markdown becomes sanitized HTML plus a
 * table of contents here and nowhere else — no raw `v-html` of CMS strings
 * anywhere in the app (predecessor defect S6), no divergent copies of the
 * footnote/slug/TOC logic (defect P8).
 */
import { Marked } from 'marked'
import markedFootnote from 'marked-footnote'
import DOMPurify from 'isomorphic-dompurify'
import { hub } from '../../hub.config.mjs'

export interface TocEntry {
  id: string
  text: string
  depth: number
}

export interface RenderedMarkdown {
  html: string
  toc: TocEntry[]
}

/**
 * CMS footnote definitions are often hand-wrapped: a definition's citation
 * spills onto flush-left continuation lines. After such a lazy continuation,
 * marked-footnote stops recognizing every later `[^n]:` line — one wrapped
 * definition silently killed footnotes 6–59 on a real article. Definitions
 * also appear indented 1–3 spaces (legal block start, but the extension only
 * matches column 0). Normalize: dedent each definition to column 0,
 * blank-line-separate it, and join its continuation lines in.
 */
function normalizeFootnoteDefinitions(markdown: string): string {
  if (!markdown.includes('[^')) return markdown
  const out: string[] = []
  let inFence = false
  let prevWasDefinition = false
  for (let line of markdown.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence
      out.push(line)
      prevWasDefinition = false
      continue
    }
    if (inFence) {
      out.push(line)
      continue
    }
    // Whitespace-only lines (CMS content uses tab-only "blank" lines) are
    // semantically blank but marked treats them as paragraph continuations,
    // which swallows a following definition.
    if (line.trim() === '') line = ''
    if (/^ {0,3}\[\^[^\]]+\]:/.test(line)) {
      if (out.length && out[out.length - 1]!.trim() !== '') out.push('')
      out.push(line.trimStart())
      prevWasDefinition = true
      continue
    }
    if (prevWasDefinition && line.trim() !== '' && !/^\s{4,}/.test(line)) {
      out[out.length - 1] += ` ${line.trim()}`
      continue
    }
    prevWasDefinition = false
    out.push(line)
  }
  return out.join('\n')
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

// Tables get a scroll wrapper: full container width for narrow tables,
// internal horizontal scroll (never page overflow) for wide ones —
// `display:block` alone shrinks tables to content width.
DOMPurify.addHook('afterSanitizeElements', (node) => {
  if (node.nodeType !== 1 || !node.ownerDocument) return
  const el = node as Element
  if (el.tagName === 'TABLE' && el.parentElement?.className !== 'table-wrap') {
    const wrapper = node.ownerDocument.createElement('div')
    wrapper.className = 'table-wrap'
    el.parentNode?.insertBefore(wrapper, el)
    wrapper.appendChild(el)
  }
})

// External links opened in a new tab must not leak an opener handle, and
// CMS-relative media paths (/uploads/…) must be absolutized against the
// CMS origin — served from this site they would 404 (and images would
// violate the CSP once broken references were "fixed" by hand).
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    const href = node.getAttribute('href')
    // Every link out of the article opens in a new tab (user request), so a
    // reference never navigates the reader away from what they were reading.
    // Same-page anchors — footnote refs/back-refs and section links (href
    // starts with '#') — must stay in-page.
    if (href && !href.startsWith('#')) {
      node.setAttribute('target', '_blank')
      node.setAttribute('rel', 'noopener noreferrer')
    }
    else if (node.getAttribute('target') === '_blank') {
      node.setAttribute('rel', 'noopener noreferrer')
    }
  }
  for (const attr of ['src', 'href'] as const) {
    const value = node.getAttribute?.(attr)
    if (value?.startsWith('/uploads/')) {
      node.setAttribute(attr, `${hub.cms.origin}${value}`)
    }
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

  const rendered = marked.parse(normalizeFootnoteDefinitions(markdown), { async: false })

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
