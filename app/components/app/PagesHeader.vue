<script setup>
const props = defineProps({
  crumbs: {
    type: Array,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  }
})
</script>

<template>
  <div
      class="pages overflow-hidden relative py-20 mb-12 border-gray-200 bg-gradient-to-r from-primary/20 to-secondary/20 w-full">
    <div class="w-full max-w-[var(--ui-container,1280px)] mx-auto px-4 sm:px-6 lg:px-8">
      <u-breadcrumb class="mb-4" :items="props.crumbs"/>
      <base-heading is="h1">{{ props.title }}</base-heading>
      <p v-if="props.description" class="mt-2 text-slate-600">{{ props.description }}</p>
    </div>
    <div class="clouds w-full absolute bottom-0 bg-[url('/images/clouds.png')] bg-repeat h-32"/>
  </div>
</template>

<style scoped>

</style>