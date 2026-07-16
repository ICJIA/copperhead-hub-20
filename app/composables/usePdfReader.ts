/**
 * Client-only PDF reader with search-term highlighting (pdf.js v6).
 *
 * Why this exists: site search indexes the text *inside* published PDFs, so
 * a hit can land in a 60-page report. This renders that PDF in-app and
 * highlights the searched term — the reliable cross-browser way, since the
 * native browser viewer's `#search=` parameter is honored only by Firefox.
 *
 * Rendering: each page is a canvas (visual) plus pdf.js's real text layer
 * (selectable, screen-reader-readable) positioned over it. The canvas is
 * decorative (aria-hidden); the text layer carries the words. Highlighting
 * uses the CSS Custom Highlight API over the text layer's own text nodes —
 * it never mutates pdf.js's DOM, so selection and a11y stay intact — with a
 * whole-span class fallback where the API is unavailable.
 *
 * Everything here touches the DOM / a worker, so it must run only on the
 * client (call load() from onMounted).
 */
import type { Ref } from 'vue'

// The worker ships same-origin as a Vite-emitted asset (URL string only —
// safe to import at module scope; no DOM touched until load() runs).
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

export type ReaderStatus = 'idle' | 'loading' | 'rendering' | 'ready' | 'error'

interface MatchRef {
  page: number
  /** The text-layer element to scroll to for this match. */
  anchor: HTMLElement
}

interface LoadOptions {
  url: string
  query: string
  container: HTMLElement
}

export interface PdfReader {
  status: Ref<ReaderStatus>
  error: Ref<string>
  pageCount: Ref<number>
  renderedCount: Ref<number>
  matchCount: Ref<number>
  currentMatch: Ref<number>
  supportsHighlight: Ref<boolean>
  load: (options: LoadOptions) => Promise<void>
  goToMatch: (index: number) => void
  nextMatch: () => void
  prevMatch: () => void
  destroy: () => void
}

const HIGHLIGHT_ALL = 'pdf-term'
const HIGHLIGHT_CURRENT = 'pdf-term-current'

export function usePdfReader(): PdfReader {
  const status = ref<ReaderStatus>('idle')
  const error = ref('')
  const pageCount = ref(0)
  const renderedCount = ref(0)
  const matchCount = ref(0)
  const currentMatch = ref(0)
  const supportsHighlight = ref(true)

  const matches: MatchRef[] = []
  // Ranges kept per highlight bucket so we can rebuild the "current" one.
  let allRanges: Range[] = []
  let reduceMotion = false
  let destroyed = false

  function normalize(value: string): string {
    return value.toLowerCase().replace(/\s+/g, ' ').trim()
  }

  /** Highlight every occurrence of `q` inside one rendered text layer. */
  function highlightPage(textDivs: HTMLElement[], itemsStr: string[], q: string, page: number): void {
    for (let i = 0; i < textDivs.length; i++) {
      const div = textDivs[i]!
      const node = div.firstChild
      if (!node || node.nodeType !== 3) continue
      const hay = (itemsStr[i] ?? '').toLowerCase()
      if (!hay) continue
      let from = hay.indexOf(q)
      while (from !== -1) {
        if (supportsHighlight.value) {
          const range = document.createRange()
          range.setStart(node, from)
          range.setEnd(node, from + q.length)
          allRanges.push(range)
        }
        else {
          div.classList.add('pdf-term-fallback')
        }
        matches.push({ page, anchor: div })
        from = hay.indexOf(q, from + q.length)
      }
    }
  }

  function paintHighlights(): void {
    if (!supportsHighlight.value || typeof CSS === 'undefined' || !CSS.highlights) return
    CSS.highlights.set(HIGHLIGHT_ALL, new Highlight(...allRanges))
  }

  function setCurrentHighlight(index: number): void {
    if (!supportsHighlight.value || typeof CSS === 'undefined' || !CSS.highlights) return
    const range = allRanges[index]
    if (range) CSS.highlights.set(HIGHLIGHT_CURRENT, new Highlight(range.cloneRange()))
  }

  function goToMatch(index: number): void {
    if (!matches.length) return
    const clamped = ((index % matches.length) + matches.length) % matches.length
    currentMatch.value = clamped + 1
    const match = matches[clamped]!
    if (allRanges.length) setCurrentHighlight(clamped)
    else match.anchor.classList.add('pdf-term-current-fallback')
    match.anchor.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'center',
    })
  }

  function nextMatch(): void {
    goToMatch(currentMatch.value) // currentMatch is 1-based; passing it lands on the next
  }

  function prevMatch(): void {
    goToMatch(currentMatch.value - 2)
  }

  async function load({ url, query, container }: LoadOptions): Promise<void> {
    status.value = 'loading'
    error.value = ''
    reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    supportsHighlight.value = typeof CSS !== 'undefined' && !!CSS.highlights
    const q = normalize(query)

    try {
      const pdfjs = await import('pdfjs-dist')
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

      // Download the whole file once rather than let pdf.js range-fetch each
      // page over the network — for typical report-sized PDFs that turns
      // ~1 network round-trip per page into a single fetch, and rendering
      // then runs from local bytes.
      const response = await fetch(url)
      if (!response.ok) throw new Error(`Could not fetch the document (HTTP ${response.status}).`)
      const data = await response.arrayBuffer()
      if (destroyed) return

      const loadingTask = pdfjs.getDocument({ data })
      const pdf = await loadingTask.promise
      if (destroyed) return
      pageCount.value = pdf.numPages
      status.value = 'rendering'
      let jumpedToFirst = false

      const outputScale = window.devicePixelRatio || 1
      const containerWidth = container.clientWidth || 800

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber)
        if (destroyed) return

        const base = page.getViewport({ scale: 1 })
        // Fit the page to the container, but never upscale past 1.6×.
        const scale = Math.min(1.6, Math.max(0.5, (containerWidth - 4) / base.width))
        const viewport = page.getViewport({ scale })

        const wrapper = document.createElement('div')
        wrapper.className = 'pdf-page'
        wrapper.style.width = `${Math.floor(viewport.width)}px`
        wrapper.style.height = `${Math.floor(viewport.height)}px`
        wrapper.setAttribute('role', 'group')
        wrapper.setAttribute('aria-label', `Page ${pageNumber} of ${pdf.numPages}`)

        const canvas = document.createElement('canvas')
        canvas.className = 'pdf-canvas'
        canvas.width = Math.floor(viewport.width * outputScale)
        canvas.height = Math.floor(viewport.height * outputScale)
        canvas.style.width = `${Math.floor(viewport.width)}px`
        canvas.style.height = `${Math.floor(viewport.height)}px`
        canvas.setAttribute('aria-hidden', 'true')
        wrapper.appendChild(canvas)

        const textLayerDiv = document.createElement('div')
        textLayerDiv.className = 'pdf-text-layer'
        // v6 text divs size themselves via calc(px * var(--total-scale-factor));
        // pdf.js reads this but never sets it, so the container must.
        textLayerDiv.style.setProperty('--total-scale-factor', String(scale))
        wrapper.appendChild(textLayerDiv)

        container.appendChild(wrapper)

        const canvasContext = canvas.getContext('2d')!
        await page.render({
          canvas,
          canvasContext,
          viewport,
          transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined,
        }).promise
        if (destroyed) return

        const textLayer = new pdfjs.TextLayer({
          textContentSource: page.streamTextContent(),
          container: textLayerDiv,
          viewport,
        })
        await textLayer.render()
        if (destroyed) return

        if (q) {
          const before = matches.length
          highlightPage(textLayer.textDivs, textLayer.textContentItemsStr, q, pageNumber)
          // Surface matches as they're found rather than after the last page,
          // and jump to the first one the moment it exists.
          if (matches.length > before) {
            matchCount.value = matches.length
            paintHighlights()
            if (!jumpedToFirst) {
              jumpedToFirst = true
              goToMatch(0)
            }
          }
        }
        renderedCount.value = pageNumber
      }

      status.value = 'ready'
    }
    catch (cause) {
      if (destroyed) return
      error.value = cause instanceof Error ? cause.message : 'Failed to load the document.'
      status.value = 'error'
    }
  }

  function destroy(): void {
    destroyed = true
    matches.length = 0
    allRanges = []
    if (typeof CSS !== 'undefined' && CSS.highlights) {
      CSS.highlights.delete(HIGHLIGHT_ALL)
      CSS.highlights.delete(HIGHLIGHT_CURRENT)
    }
  }

  onBeforeUnmount(destroy)

  return {
    status,
    error,
    pageCount,
    renderedCount,
    matchCount,
    currentMatch,
    supportsHighlight,
    load,
    goToMatch,
    nextMatch,
    prevMatch,
    destroy,
  }
}
