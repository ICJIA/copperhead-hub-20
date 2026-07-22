// Export/import of manager annotations. JSON + Markdown are pure string
// builders; the Word (.docx) builder dynamic-imports the `docx` library so it
// only loads when a Word export is actually requested (and tree-shakes with
// the whole layer when the kill switch is off). Import accepts the JSON export
// only — Markdown and Word are one-way, human-readable snapshots.
import type { Paragraph as DocxParagraph } from 'docx'
import type { AnnotationComment, PageAnnotation } from '~/types/annotations'
import { ANNOTATION_COLORS } from '~/types/annotations'

function ts(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString()
}

/** Group annotations by page path, preserving document order within each. */
function groupByPage(annotations: PageAnnotation[]): [string, PageAnnotation[]][] {
  const map = new Map<string, PageAnnotation[]>()
  for (const a of annotations) {
    const list = map.get(a.pagePath) ?? []
    list.push(a)
    map.set(a.pagePath, list)
  }
  return [...map.entries()]
}

export function annotationsToJson(annotations: PageAnnotation[], exportedAt: string): string {
  return JSON.stringify(
    { format: 'copperhead-annotations', version: 1, exportedAt, count: annotations.length, annotations },
    null,
    2,
  )
}

export function annotationsToMarkdown(annotations: PageAnnotation[], exportedAt: string): string {
  const pages = groupByPage(annotations)
  const out: string[] = [
    '# ICJIA Research Hub — Manager Annotations',
    '',
    `_Exported ${ts(exportedAt)} · ${annotations.length} annotation${annotations.length === 1 ? '' : 's'} across ${pages.length} page${pages.length === 1 ? '' : 's'}._`,
  ]
  for (const [page, anns] of pages) {
    out.push('', `## Page: \`${page}\``)
    anns.forEach((a, i) => {
      out.push('', `### ${i + 1}. ${a.color}${a.resolved ? ' · resolved' : ''}`, '', `> ${a.anchor.exact.replace(/\s*\n+\s*/g, ' ')}`, '')
      for (const c of a.comments) {
        out.push(`- **${c.authorName}** _(${ts(c.createdAt)})_: ${c.body.replace(/\s*\n+\s*/g, ' ')}`)
      }
    })
  }
  out.push('')
  return out.join('\n')
}

export async function annotationsToDocx(annotations: PageAnnotation[], exportedAt: string): Promise<Blob> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx')
  const pages = groupByPage(annotations)
  const children: DocxParagraph[] = [
    new Paragraph({ text: 'ICJIA Research Hub — Manager Annotations', heading: HeadingLevel.TITLE }),
    new Paragraph({ children: [new TextRun({ text: `Exported ${ts(exportedAt)} · ${annotations.length} annotation(s) across ${pages.length} page(s).`, italics: true })] }),
  ]
  for (const [page, anns] of pages) {
    children.push(new Paragraph({ text: `Page: ${page}`, heading: HeadingLevel.HEADING_1 }))
    anns.forEach((a, i) => {
      children.push(new Paragraph({ text: `${i + 1}. ${a.color}${a.resolved ? ' · resolved' : ''}`, heading: HeadingLevel.HEADING_2 }))
      children.push(new Paragraph({ children: [new TextRun({ text: a.anchor.exact, italics: true })], indent: { left: 360 } }))
      for (const c of a.comments) {
        children.push(new Paragraph({
          children: [new TextRun({ text: `${c.authorName} (${ts(c.createdAt)}): `, bold: true }), new TextRun(c.body)],
          bullet: { level: 0 },
        }))
      }
    })
  }
  return Packer.toBlob(new Document({ sections: [{ children }] }))
}

/** Parse a JSON export back into annotations, tolerating a bare array or the
 *  wrapped `{ annotations: [...] }` shape. Throws on anything unrecognizable. */
export function parseAnnotationsImport(text: string): PageAnnotation[] {
  const data: unknown = JSON.parse(text)
  const arr = Array.isArray(data) ? data : (data as { annotations?: unknown } | null)?.annotations
  if (!Array.isArray(arr)) throw new Error('No annotations array found')
  const out = arr.filter(isAnnotationLike).map(coerceAnnotation)
  if (out.length === 0) throw new Error('No valid annotations found')
  return out
}

function isAnnotationLike(v: unknown): v is Record<string, unknown> {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  return typeof o.id === 'string' && typeof o.pagePath === 'string'
    && typeof o.anchor === 'object' && o.anchor !== null && Array.isArray(o.comments)
}

function coerceAnnotation(o: Record<string, unknown>): PageAnnotation {
  const anchor = o.anchor as Record<string, unknown>
  const color = (ANNOTATION_COLORS as readonly string[]).includes(o.color as string)
    ? (o.color as PageAnnotation['color'])
    : 'orange'
  return {
    id: o.id as string,
    pagePath: o.pagePath as string,
    anchor: {
      exact: String(anchor.exact ?? ''),
      prefix: String(anchor.prefix ?? ''),
      suffix: String(anchor.suffix ?? ''),
      offset: typeof anchor.offset === 'number' ? anchor.offset : 0,
    },
    color,
    resolved: !!o.resolved,
    createdAt: typeof o.createdAt === 'string' ? o.createdAt : new Date().toISOString(),
    authorName: typeof o.authorName === 'string' ? o.authorName : '',
    comments: (o.comments as unknown[]).flatMap(coerceComment),
  }
}

function coerceComment(c: unknown): AnnotationComment[] {
  if (typeof c !== 'object' || c === null) return []
  const o = c as Record<string, unknown>
  if (typeof o.body !== 'string') return []
  return [{
    id: typeof o.id === 'string' ? o.id : crypto.randomUUID(),
    body: o.body,
    authorName: typeof o.authorName === 'string' ? o.authorName : '',
    createdAt: typeof o.createdAt === 'string' ? o.createdAt : new Date().toISOString(),
  }]
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function downloadText(text: string, filename: string, mime: string): void {
  downloadBlob(new Blob([text], { type: `${mime};charset=utf-8` }), filename)
}
