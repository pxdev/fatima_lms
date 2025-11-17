<script setup lang="ts">
  const colorMode = useColorMode();

  const isDark = computed({
    get() {
      return colorMode.value === 'dark';
    },
    set() {
      colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
    },
  });
</script>

<template>
  <client-only v-if="!colorMode?.forced">
    <u-button color="neutral" variant="ghost" size="xl" @click="isDark = !isDark">
      <icon class="size-5" :name="isDark ? 'hugeicons:moon-02' : 'hugeicons:sun-03'" />
    </u-button>

    <template #fallback>
      <div class="size-5" />
    </template>
  </client-only>
</template>

<style scoped></style>
