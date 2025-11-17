<script setup lang="ts">
  import { useNetwork } from '@vueuse/core';

  const { isOnline } = useNetwork();
</script>

<template>
  <div v-if="!isOnline" class="connection-status fixed right-0 bottom-0 z-200">
    <div
      class="flex items-center gap-4 max-w-[400px] m-4 border border-red-500 text-red-500 p-4 rounded shadow shadow-red-100"
    >
      <icon name="svg-spinners:wifi" class="w-7 h-7" />
      <div>
        <h3 class="text-base font-semibold">Connection Lost</h3>
        <p class="text-sm opacity-60">Please check your internet connection and try again.</p>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
