<script setup>
  const props = defineProps({
    label: String,
    vertical: Boolean,
    value: String | Number | Boolean | Object | Array | null | undefined,
  });
</script>

<template>
  <div
    :class="{ 'flex-col': vertical }"
    class="px-4 py-4 gap-2 flex justify-between border-b border-b-gray-100 last-of-type:border-b-0"
  >
    <div v-if="props.label" class="min-w-[150px]">
      <p class="text-gray-500 text-xs">
        {{ props.label }}
      </p>
    </div>
    <div class="text-sm">
      <slot />
      <p v-if="props.value" class="text-start" dir="auto">
        {{ props.value }}
      </p>
    </div>
  </div>
</template>

<style scoped></style>
