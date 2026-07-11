import { describe, expect, it } from 'vitest'
import { renderMarkdown, sanitizeHtml } from '../../app/utils/markdown'

describe('renderMarkdown', () => {
  it('renders headings with stable ids and returns an h2 TOC', () => {
    const { html, toc } = renderMarkdown('## Key Findings\n\ntext\n\n## Methodology')
    expect(html).toContain('<h2 id="key-findings">')
    expect(toc).toEqual([
      { id: 'key-findings', text: 'Key Findings', depth: 2 },
      { id: 'methodology', text: 'Methodology', depth: 2 },
    ])
  })

  it('de-duplicates colliding heading ids', () => {
    const { toc } = renderMarkdown('## Results\n\n## Results')
    expect(toc.map(t => t.id)).toEqual(['results', 'results-2'])
  })

  it('strips script tags and event-handler attributes (stored XSS)', () => {
    const { html } = renderMarkdown('hello <script>alert(1)</script> <img src="x" onerror="alert(1)">')
    expect(html).not.toContain('<script')
    expect(html).not.toContain('onerror')
  })

  it('neutralizes javascript: links', () => {
    const { html } = renderMarkdown('[click](javascript:alert(1))')
    expect(html).not.toContain('javascript:')
  })

  it('adds rel="noopener noreferrer" to target=_blank links', () => {
    const { html } = sanitizeAndWrap('<a href="https://example.gov" target="_blank">x</a>')
    expect(html).toContain('noopener')
  })

  it('renders footnotes', () => {
    const { html } = renderMarkdown('Claim.[^1]\n\n[^1]: Source note.')
    expect(html).toContain('footnote')
  })

  it('survives hand-wrapped footnote definitions (CMS content shape)', () => {
    // Definition 1 wraps onto a flush-left continuation line; without
    // normalization every later definition dies and its refs leak literally.
    const md = 'A.[^1] B.[^2]\n\n[^1]: First citation\nhttps://example.gov/report\n[^2]: Second citation'
    const { html } = renderMarkdown(md)
    expect(html).not.toContain('[^')
    expect(html).toContain('id="footnote-1"')
    expect(html).toContain('id="footnote-2"')
    expect(html).toContain('https://example.gov/report')
  })

  it('leaves footnote-like lines inside code fences alone', () => {
    const md = 'Text.\n\n```\n[^1]: not a footnote\n```\n'
    const { html } = renderMarkdown(md)
    expect(html).toContain('[^1]: not a footnote')
  })

  it('wraps tables in a full-width scroll container', () => {
    const { html } = renderMarkdown('| a | b |\n|---|---|\n| 1 | 2 |')
    expect(html).toContain('<div class="table-wrap"><table>')
    expect(html).toContain('</table></div>')
  })

  it('absolutizes CMS-relative /uploads media against the CMS origin', () => {
    const { html } = renderMarkdown('![chart](/uploads/chart_abc123.png)\n\n[report](/uploads/report.pdf)')
    expect(html).toContain('src="https://v2.hub.icjia-api.cloud/uploads/chart_abc123.png"')
    expect(html).toContain('href="https://v2.hub.icjia-api.cloud/uploads/report.pdf"')
  })

  it('returns empty output for empty input', () => {
    expect(renderMarkdown('')).toEqual({ html: '', toc: [] })
  })
})

function sanitizeAndWrap(fragment: string) {
  return { html: sanitizeHtml(fragment) }
}

describe('sanitizeHtml', () => {
  it('keeps benign inline markup (citations use <em>)', () => {
    expect(sanitizeHtml('Research and Analysis Unit. <em>ICJIA Update</em>.'))
      .toContain('<em>ICJIA Update</em>')
  })

  it('strips scripts from CMS-authored fragments', () => {
    expect(sanitizeHtml('<em>ok</em><script>alert(1)</script>')).toBe('<em>ok</em>')
  })
})
