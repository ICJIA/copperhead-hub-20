<script setup lang="ts">
const colorMode = useColorMode()

const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (value: boolean) => {
    colorMode.preference = value ? 'dark' : 'light'
  },
})

function toggle(): void {
  isDark.value = !isDark.value
}
</script>

<template>
  <!-- ClientOnly: the persisted preference is unknown during prerender; a
       static placeholder avoids a hydration mismatch on the icon. -->
  <ClientOnly>
    <UButton
      :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
      color="neutral"
      variant="ghost"
      :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
      @click="toggle"
    />
    <template #fallback>
      <div
        class="size-8"
        aria-hidden="true"
      />
    </template>
  </ClientOnly>
</template>
