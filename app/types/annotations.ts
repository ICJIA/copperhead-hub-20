// Manager-annotation domain model + the storage seam. Ported from
// copperhead-studio-20 (types/annotations.ts) with the studio's
// (contentType, documentId) keying collapsed to a single pagePath and all
// auth-derived attribution reduced to a required authorName.

export const ANNOTATION_COLORS = ['orange', 'violet', 'teal', 'lime'] as const
export type AnnotationColor = (typeof ANNOTATION_COLORS)[number]

/** W3C-style text-quote anchor over the container's concatenated text-node content. */
export interface AnnotationAnchor {
  exact: string // the highlighted text (≤ 1000 chars)
  prefix: string // ≤ 32 chars of container text before `exact`
  suffix: string // ≤ 32 chars after
  offset: number // char offset of `exact` at capture time (disambiguation hint)
}

export interface AnnotationComment {
  id: string
  body: string // plain text — rendered via Vue interpolation ONLY
  authorName: string // required ("name or initials")
  createdAt: string // ISO 8601
}

export interface PageAnnotation {
  id: string
  pagePath: string // normalized route path, e.g. '/articles/foo'
  anchor: AnnotationAnchor
  color: AnnotationColor
  resolved: boolean
  createdAt: string
  authorName: string // thread creator = comments[0].authorName
  comments: AnnotationComment[] // comments[0] is the initial note; the rest are replies
}

/** PageAnnotation minus the server-assigned fields. */
export type NewPageAnnotation = Omit<PageAnnotation, 'id' | 'createdAt'>

/** Storage seam (studio parity): one adapter — Supabase PostgREST. */
export interface AnnotationStore {
  list(pagePath: string): Promise<PageAnnotation[]>
  create(a: NewPageAnnotation): Promise<PageAnnotation>
  addComment(id: string, c: AnnotationComment): Promise<PageAnnotation>
  setResolved(id: string, resolved: boolean): Promise<PageAnnotation>
  remove(id: string): Promise<void>
}

/** A rail entry: an annotation plus its resolution state in the CURRENT render.
 *  (Lives here, not in the SFC — `<script setup>` cannot have named exports.) */
export interface RailThread {
  annotation: PageAnnotation
  orphan: boolean // quote no longer found in the rendered text
  start: number | null // resolved char offset (document order); null when orphaned
}
