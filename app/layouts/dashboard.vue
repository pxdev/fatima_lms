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
    <UDashboardGroup>
      <!-- Sidebar -->
      <DashboardSidebar />

      <!-- Main Panel -->
      <UDashboardPanel grow>
        <!-- Top Navbar -->
        <template #header>
          <UDashboardNavbar>
            <template #leading>
              <UDashboardSidebarToggle />
            </template>
            
            <template #center>
              <DashboardBreadcrumb />
            </template>
            
            <template #trailing>
              <div class="flex items-center gap-2">
                <UColorModeButton />
              </div>
            </template>
          </UDashboardNavbar>
        </template>

        <!-- Page Content -->
        <template #body>
          <UContainer class="py-6">
            <slot />
          </UContainer>
        </template>
      </UDashboardPanel>
    </UDashboardGroup>
  </UApp>
</template>
