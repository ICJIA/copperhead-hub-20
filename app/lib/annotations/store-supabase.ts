// PostgREST adapter for the AnnotationStore seam. Deliberately SDK-free:
// five REST calls via the injectable fetcher (Nuxt's $fetch at runtime).
// Auth is the publishable key in the `apikey` header; the table's RLS
// policies are intentionally open (dev-preview tool, removed at go-live).
// Concurrency: addComment/setResolved are read-modify-write over the whole
// comments array — LAST WRITE WINS (studio's documented trade-off; fine at
// manager-review scale).
import type { AnnotationColor, AnnotationComment, AnnotationStore, NewPageAnnotation, PageAnnotation } from '~/types/annotations'
import { ANNOTATION_COLORS } from '~/types/annotations'

/** Server row shape (mirrors the create_copperhead_annotations migration). */
export interface AnnotationRow {
  id: string
  page_path: string
  exact: string
  prefix: string
  suffix: string
  offset_hint: number
  color: string
  resolved: boolean
  author_name: string
  comments: unknown
  created_at: string
}

type Fetcher = (url: string, opts?: {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  query?: Record<string, string>
  headers?: Record<string, string>
  body?: unknown
}) => Promise<unknown>

/** Defensive parse: the comments column is writable JSON — never trust its shape. */
function commentsFromJson(value: unknown): AnnotationComment[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((c) => {
    if (typeof c !== 'object' || c === null) return []
    const o = c as Record<string, unknown>
    if (typeof o.id !== 'string' || typeof o.body !== 'string') return []
    return [{
      id: o.id,
      body: o.body,
      authorName: typeof o.authorName === 'string' ? o.authorName : '',
      createdAt: typeof o.createdAt === 'string' ? o.createdAt : '',
    }]
  })
}

export function annotationFromRow(row: AnnotationRow): PageAnnotation {
  const color = (ANNOTATION_COLORS as readonly string[]).includes(row.color)
    ? (row.color as AnnotationColor)
    : 'orange'
  return {
    id: row.id,
    pagePath: row.page_path,
    anchor: { exact: row.exact, prefix: row.prefix ?? '', suffix: row.suffix ?? '', offset: row.offset_hint ?? 0 },
    color,
    resolved: !!row.resolved,
    createdAt: row.created_at,
    authorName: row.author_name,
    comments: commentsFromJson(row.comments),
  }
}

export function annotationToRow(a: NewPageAnnotation): Omit<AnnotationRow, 'id' | 'created_at'> {
  return {
    page_path: a.pagePath,
    exact: a.anchor.exact,
    prefix: a.anchor.prefix,
    suffix: a.anchor.suffix,
    offset_hint: a.anchor.offset,
    color: a.color,
    resolved: a.resolved,
    author_name: a.authorName,
    comments: a.comments,
  }
}

/** Full row (id + created_at kept) for import upserts. */
export function annotationToFullRow(a: PageAnnotation): AnnotationRow {
  return { ...annotationToRow(a), id: a.id, created_at: a.createdAt }
}

export function createSupabaseAnnotationStore(opts: {
  url: string
  key: string
  table: string
  /** Injectable for tests; defaults to the $fetch global Nuxt provides. */
  fetcher?: Fetcher
}): AnnotationStore {
  const fetcher: Fetcher = opts.fetcher ?? (globalThis.$fetch as unknown as Fetcher)
  const endpoint = `${opts.url}/rest/v1/${opts.table}`
  const read = { apikey: opts.key }
  const write = { apikey: opts.key, Prefer: 'return=representation' }

  async function findRow(id: string): Promise<AnnotationRow> {
    const rows = await fetcher(endpoint, { headers: read, query: { select: '*', id: `eq.${id}` } }) as AnnotationRow[]
    const row = rows[0]
    if (!row) throw new Error(`Annotation ${id} not found`)
    return row
  }

  function firstOf(rows: unknown, action: string): PageAnnotation {
    const row = (rows as AnnotationRow[])[0]
    if (!row) throw new Error(`Annotation ${action} not found`)
    return annotationFromRow(row)
  }

  return {
    async list(pagePath) {
      const rows = await fetcher(endpoint, {
        headers: read,
        query: { select: '*', page_path: `eq.${pagePath}`, order: 'created_at.asc' },
      }) as AnnotationRow[]
      return rows.map(annotationFromRow)
    },

    async create(a) {
      const rows = await fetcher(endpoint, { method: 'POST', headers: write, body: annotationToRow(a) })
      return firstOf(rows, 'create')
    },

    async addComment(id, c) {
      const row = await findRow(id)
      const comments = [...commentsFromJson(row.comments), c]
      const rows = await fetcher(endpoint, {
        method: 'PATCH', headers: write, query: { id: `eq.${id}` }, body: { comments },
      })
      return firstOf(rows, 'update')
    },

    async setResolved(id, resolved) {
      const rows = await fetcher(endpoint, {
        method: 'PATCH', headers: write, query: { id: `eq.${id}` }, body: { resolved },
      })
      return firstOf(rows, 'update')
    },

    async remove(id) {
      await fetcher(endpoint, { method: 'DELETE', headers: read, query: { id: `eq.${id}` } })
    },

    async listAll() {
      const rows = await fetcher(endpoint, {
        headers: read,
        query: { select: '*', order: 'created_at.asc' },
      }) as AnnotationRow[]
      return rows.map(annotationFromRow)
    },

    async importMany(annotations) {
      if (annotations.length === 0) return 0
      // Upsert on the id primary key — re-importing restores the exact rows.
      await fetcher(endpoint, {
        method: 'POST',
        headers: { apikey: opts.key, Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: annotations.map(annotationToFullRow),
      })
      return annotations.length
    },
  }
}
