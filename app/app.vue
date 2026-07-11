<script setup lang="ts">
import { hub } from '../hub.config.mjs'

// Plausible analytics — KPI continuity with Hub 1.0. Injected only when
// the page is served from the production hostname, so preview deploys
// and local dev never pollute the icjia.illinois.gov statistics.
useHead({
  script: [
    {
      innerHTML:
        `if(location.hostname==='${hub.analytics.domain}'){`
        + `var s=document.createElement('script');s.defer=true;`
        + `s.dataset.domain='${hub.analytics.domain}';`
        + `s.src='${hub.analytics.plausibleHost}/js/script.js';`
        + `document.head.appendChild(s);}`,
    },
  ],
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
