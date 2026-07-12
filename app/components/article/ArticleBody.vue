<script setup lang="ts">
defineProps<{
  html: string
}>()

/**
 * Footnote refs pop a Nuxt UI toast instead of jumping to the bottom of
 * the page, so readers keep their place in the article. The full
 * footnotes list still renders at the end of the body for print, no-JS,
 * and linear screen-reader reading — the toast is an enhancement over
 * it. Toast descriptions are plain text, so links inside the footnote
 * surface as action buttons; theming (light/dark) and dialog semantics
 * come from Nuxt UI's toast primitives.
 */
const toast = useToast()
// Re-adding under a fixed id while that id is mid-leave gets swallowed,
// so each toast takes an auto id and we dismiss the previous one.
let lastToastId: string | number | undefined

function onBodyClick(event: MouseEvent): void {
  const refLink = (event.target as HTMLElement).closest('a[data-footnote-ref]')
  if (!refLink) return
  event.preventDefault()
  const id = refLink.getAttribute('href')?.slice(1) ?? ''
  const item = document.getElementById(id)
  if (!item) return
  const clone = item.cloneNode(true) as HTMLElement
  clone.querySelectorAll('[data-footnote-backref]').forEach(el => el.remove())
  const links = [...clone.querySelectorAll<HTMLAnchorElement>('a[href^="http"]')].slice(0, 3)
  if (lastToastId !== undefined) toast.remove(lastToastId)
  const added = toast.add({
    title: `Reference ${id.replace(/^footnote-/, '')}`,
    description: (clone.textContent ?? '').replace(/\s+/g, ' ').trim(),
    icon: 'i-lucide-book-open',
    color: 'neutral',
    // Citations are read, not glanced at: keep the toast up long enough
    // to never vanish mid-read (duration 0 would dismiss immediately).
    duration: 120000,
    progress: false,
    actions: links.map(link => ({
      'label': new URL(link.href).hostname.replace(/^www\./, ''),
      'icon': 'i-lucide-external-link',
      'color': 'neutral' as const,
      'variant': 'outline' as const,
      'size': 'xs' as const,
      'to': link.href,
      'target': '_blank',
      'aria-label': `Open source ${new URL(link.href).hostname} in a new tab`,
    })),
  })
  lastToastId = added.id
}
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -- pipeline-sanitized -->
  <div
    class="article-body mt-8"
    @click="onBodyClick"
    v-html="html"
  />
</template>
