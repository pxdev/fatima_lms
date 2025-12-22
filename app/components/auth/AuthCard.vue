<script setup lang="ts">
interface Props {
  title: string
  subtitle?: string
  loading?: boolean
}

defineProps<Props>()
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-primary-50/30 px-4 py-12">
    <!-- Decorative background elements -->
    <div class="pointer-events-none fixed inset-0 overflow-hidden">
      <div class="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary-100/40 blur-3xl" />
      <div class="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary-100/30 blur-3xl" />
    </div>

    <UCard
      class="relative z-10 w-full max-w-md border-0 shadow-xl shadow-slate-200/50 backdrop-blur-sm"
      :ui="{
        root: 'bg-white/95',
        header: 'pb-0',
        body: 'pt-6',
        footer: 'bg-slate-50/50 border-t border-slate-100'
      }"
    >
      <template #header>
        <div class="space-y-2 text-center">
          <!-- Logo slot -->
          <div class="mb-4 flex justify-center">
            <slot name="logo">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/25">
                <UIcon name="i-heroicons-academic-cap" class="h-6 w-6 text-white" />
              </div>
            </slot>
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900">{{ title }}</h1>
          <p v-if="subtitle" class="text-sm text-slate-500">{{ subtitle }}</p>
        </div>
      </template>

      <!-- Loading skeleton overlay -->
      <div v-if="loading" class="space-y-4">
        <USkeleton class="h-10 w-full" />
        <USkeleton class="h-10 w-full" />
        <USkeleton class="h-10 w-full" />
        <USkeleton class="h-12 w-full" />
      </div>

      <!-- Main content -->
      <slot v-else />

      <template v-if="$slots.footer" #footer>
        <slot name="footer" />
      </template>
    </UCard>
  </div>
</template>

