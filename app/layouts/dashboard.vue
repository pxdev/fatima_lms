<script setup>
import * as locales from '@nuxt/ui/locale'

const { locale } = useI18n()

const lang = computed(() => locales[locale.value].code)
const dir = computed(() => locales[locale.value].dir)

useHead({
  htmlAttrs: {
    lang,
    dir
  }
})
</script>

<template>
  <UApp>
    <div class="min-h-screen bg-slate-50">
      <!-- Top Bar -->
      <DashboardTopBar />

      <!-- Main Content -->
      <main>
        <UContainer class="py-8">
          <slot />
        </UContainer>
      </main>
    </div>
  </UApp>
</template>
