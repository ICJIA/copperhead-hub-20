/**
 * Client-only PDF reader with search-term highlighting, built on pdf.js's own
 * viewer components (pdfjs-dist/web/pdf_viewer.mjs) — the same PDFViewer +
 * PDFFindController that power Firefox's built-in PDF viewer.
 *
 * Why the components, not a hand-rolled loop: site search indexes the text
 * *inside* published PDFs, so a hit can land in a 60-page report. An earlier
 * version rendered every page sequentially, which took tens of seconds and
 * stalled on long documents. PDFViewer is pdf.js's production virtualization
 * engine — it renders only the pages in (and near) view, on scroll, and
 * manages the worker itself. PDFFindController does the search across the whole
 * document (highlight-all, match count, prev/next) the same way the reference
 * viewer does. We drive both through the shared EventBus and surface just the
 * bits the toolbar needs.
 *
 * Everything here touches the DOM / a worker, so load() must run only on the
 * client (the reader page calls it post-mount, once the container exists).
 */
import type { Ref } from 'vue'
import type { PDFDocumentLoadingTask } from 'pdfjs-dist'

// The worker ships same-origin as a Vite-emitted asset (URL string only —
// safe to import at module scope; no DOM touched until load() runs).
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

export type ReaderStatus = 'idle' | 'loading' | 'ready' | 'error'

interface LoadOptions {
  url: string
  query: string
  /** The scroll container (must be position:absolute per pdf.js). */
  container: HTMLDivElement
  /** The inner `.pdfViewer` element pdf.js renders pages into. */
  viewer: HTMLDivElement
}

export interface PdfReader {
  status: Ref<ReaderStatus>
  error: Ref<string>
  pageCount: Ref<number>
  matchCount: Ref<number>
  currentMatch: Ref<number>
  /** True once the find scan has settled — lets the UI say "no matches". */
  searchComplete: Ref<boolean>
  load: (options: LoadOptions) => Promise<void>
  nextMatch: () => void
  prevMatch: () => void
  destroy: () => void
}

// PDFFindController FindState.PENDING — search still scanning pages.
const FIND_STATE_PENDING = 3

export function usePdfReader(): PdfReader {
  const status = ref<ReaderStatus>('idle')
  const error = ref('')
  const pageCount = ref(0)
  const matchCount = ref(0)
  const currentMatch = ref(0)
  const searchComplete = ref(false)

  let destroyed = false
  let query = ''
  // Kept for teardown: destroying the loading task aborts the worker and the
  // document (PDFDocumentProxy has no public destroy of its own).
  let loadingTask: PDFDocumentLoadingTask | null = null
  // The shared event bus — typed just to the two methods we call on it.
  let eventBus: { dispatch: (name: string, payload: object) => void, on: (name: string, fn: (e: never) => void) => void } | null = null

  /**
   * Drive the find controller. type '' starts a fresh search (debounced, then
   * scrolls to the first match); 'again' walks to the next/previous match.
   */
  function dispatchFind(type: '' | 'again', findPrevious = false): void {
    if (!eventBus || !query) return
    eventBus.dispatch('find', {
      source: null,
      type,
      query,
      caseSensitive: false,
      entireWord: false,
      highlightAll: true,
      findPrevious,
    })
  }

  function nextMatch(): void {
    dispatchFind('again', false)
  }

  function prevMatch(): void {
    dispatchFind('again', true)
  }

  async function load({ url, query: rawQuery, container, viewer }: LoadOptions): Promise<void> {
    status.value = 'loading'
    error.value = ''
    matchCount.value = 0
    currentMatch.value = 0
    searchComplete.value = false
    query = rawQuery.trim()

    try {
      const pdfjs = await import('pdfjs-dist')
      const { EventBus, PDFViewer, PDFFindController, PDFLinkService }
        = await import('pdfjs-dist/web/pdf_viewer.mjs')
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

      // Download the whole file once (CORS-enabled CMS origin) rather than let
      // pdf.js range-fetch per page — one request, then render from local bytes.
      const response = await fetch(url)
      if (!response.ok) throw new Error(`Could not fetch the document (HTTP ${response.status}).`)
      const data = await response.arrayBuffer()
      if (destroyed) return

      const bus = new EventBus()
      eventBus = bus
      const linkService = new PDFLinkService({ eventBus: bus })
      const findController = new PDFFindController({ eventBus: bus, linkService })
      const pdfViewer = new PDFViewer({ container, viewer, eventBus: bus, linkService, findController })
      linkService.setViewer(pdfViewer)

      // Pages laid out → fit to width, mark ready, and kick off the search.
      bus.on('pagesinit', () => {
        if (destroyed) return
        pdfViewer.currentScaleValue = 'page-width'
        status.value = 'ready'
        dispatchFind('')
      })

      // The find controller reports match counts as it scans and as the user
      // navigates. { current, total } is 1-based; current is 0 until a match
      // is selected.
      const onMatches = ({ matchesCount }: { matchesCount: { current: number, total: number } }) => {
        if (destroyed) return
        matchCount.value = matchesCount.total || 0
        currentMatch.value = matchesCount.current || 0
      }
      bus.on('updatefindmatchescount', onMatches as (e: never) => void)
      bus.on('updatefindcontrolstate', ((e: { state: number, matchesCount: { current: number, total: number } }) => {
        onMatches(e)
        if (e.state !== FIND_STATE_PENDING) searchComplete.value = true
      }) as (e: never) => void)

      loadingTask = pdfjs.getDocument({ data })
      const pdf = await loadingTask.promise
      if (destroyed) {
        loadingTask.destroy()
        return
      }
      pageCount.value = pdf.numPages
      pdfViewer.setDocument(pdf)
      linkService.setDocument(pdf, null)
      // status flips to 'ready' from the pagesinit handler above.
    }
    catch (cause) {
      if (destroyed) return
      error.value = cause instanceof Error ? cause.message : 'Failed to load the document.'
      status.value = 'error'
    }
  }

  function destroy(): void {
    destroyed = true
    eventBus = null
    loadingTask?.destroy()
    loadingTask = null
  }

  onBeforeUnmount(destroy)

  return {
    status,
    error,
    pageCount,
    matchCount,
    currentMatch,
    searchComplete,
    load,
    nextMatch,
    prevMatch,
    destroy,
  }
}
