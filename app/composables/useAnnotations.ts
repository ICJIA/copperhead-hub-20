// Reactive orchestration for page annotations (spec §5). One Supabase-backed
// store per call; the AnnotationLayer owns when to (re)load. Load failures
// set `loadFailed` quietly (the rail shows an inline note — a toast on every
// page load would spam offline sessions); mutation failures toast AND
// rethrow so the caller keeps its UI open (composer stays up for a retry).
import { ref, toValue, type MaybeRefOrGetter } from '#imports'
import { hub } from '../../hub.config.mjs'
import type { AnnotationAnchor, AnnotationColor, PageAnnotation } from '~/types/annotations'
import { createSupabaseAnnotationStore } from '~/lib/annotations/store-supabase'

export function useAnnotations(pagePath: MaybeRefOrGetter<string>) {
  const toast = useToast()
  // URL + publishable key come from runtime config so they can be overridden
  // per environment (NUXT_PUBLIC_SUPABASE_URL / NUXT_PUBLIC_SUPABASE_KEY); the
  // table is a fixed code constant. Defaults for all three are in hub.config.mjs.
  const { supabaseUrl, supabaseKey } = useRuntimeConfig().public
  const store = createSupabaseAnnotationStore({
    url: supabaseUrl,
    key: supabaseKey,
    table: hub.annotations.supabase?.table ?? 'copperhead_annotations',
  })

  const annotations = ref<PageAnnotation[]>([])
  const loading = ref(true)
  const loadFailed = ref(false)

  async function load(): Promise<void> {
    loading.value = true
    try {
      annotations.value = await store.list(toValue(pagePath))
      loadFailed.value = false
    }
    catch {
      annotations.value = []
      loadFailed.value = true
    }
    finally {
      loading.value = false
    }
  }

  function replaceOne(updated: PageAnnotation): void {
    annotations.value = annotations.value.map(a => (a.id === updated.id ? updated : a))
  }

  function fail(title: string): void {
    toast.add({ title, description: 'Check your connection and try again.', color: 'error' })
  }

  async function createAnnotation(
    anchor: AnnotationAnchor,
    color: AnnotationColor,
    body: string,
    authorName: string,
  ): Promise<PageAnnotation> {
    const now = new Date().toISOString()
    try {
      const created = await store.create({
        pagePath: toValue(pagePath),
        anchor,
        color,
        resolved: false,
        authorName,
        comments: [{ id: crypto.randomUUID(), body, authorName, createdAt: now }],
      })
      annotations.value = [...annotations.value, created]
      return created
    }
    catch (e) {
      fail('Couldn’t save the comment')
      throw e
    }
  }

  async function reply(id: string, body: string, authorName: string): Promise<void> {
    try {
      replaceOne(await store.addComment(id, {
        id: crypto.randomUUID(), body, authorName, createdAt: new Date().toISOString(),
      }))
    }
    catch (e) {
      fail('Couldn’t save the reply')
      throw e
    }
  }

  async function setResolved(id: string, resolved: boolean): Promise<void> {
    try {
      replaceOne(await store.setResolved(id, resolved))
    }
    catch (e) {
      fail(resolved ? 'Couldn’t resolve the thread' : 'Couldn’t reopen the thread')
      throw e
    }
  }

  async function removeAnnotation(id: string): Promise<void> {
    try {
      await store.remove(id)
      annotations.value = annotations.value.filter(a => a.id !== id)
    }
    catch (e) {
      fail('Couldn’t delete the thread')
      throw e
    }
  }

  return { annotations, loading, loadFailed, load, createAnnotation, reply, setResolved, removeAnnotation }
}
