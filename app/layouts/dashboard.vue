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
  <Html class="h-full text-lg font-rubik">
    <!-- Dashboard Layout -->
    <div class="flex min-h-screen bg-gray-50">
      <!-- Sidebar -->
      <DashboardSidebar />
      
      <!-- Main Content -->
      <main class="flex-1">
        <div class="p-6 lg:p-8">
          <!-- Breadcrumb -->
          <DashboardBreadcrumb />
          
          <!-- Page Content -->
          <slot />
        </div>
      </main>
    </div>
  </Html>
</template>
