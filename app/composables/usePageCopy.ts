/**
 * Landing-page copy from the `pages` collection, with typed fallback.
 *
 * One mechanism for every route that has author-editable page furniture
 * (hub home, /centers, /projects, …): try the pages entry whose slug
 * matches the route, fall back to the provided defaults until authors
 * create it. Creating the entry in Strapi flips the copy live — no code.
 */
export interface PageCopyFallback {
  title: string
  summary: string
}

export interface PageCopy extends PageCopyFallback {
  /** Sanitized HTML of the entry's markdown body ('' when absent). */
  bodyHtml: string
}

export function usePageCopy(slug: string, fallback: PageCopyFallback) {
  return useAsyncData<PageCopy>(`page-copy-${slug}`, async () => {
    const page = await fetchPageBySlug(slug).catch(() => null)
    if (!page) return { ...fallback, bodyHtml: '' }
    return {
      title: page.title || fallback.title,
      summary: page.summary || fallback.summary,
      bodyHtml: page.body && page.body !== 'test' ? renderMarkdown(page.body).html : '',
    }
  })
}
