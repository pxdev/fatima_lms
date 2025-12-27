<template>
  <UButton
    v-if="hasTimezone"
    :icon="isToggled ? 'i-heroicons-globe-alt' : 'i-heroicons-clock'"
    variant="ghost"
    color="neutral"
    size="lg"
    :title="isToggled ? 'Show dates in original timezone (as stored)' : `Show dates in my timezone (${userTimezone})`"
    @click="toggle"
    class="hidden sm:flex"
  >
    <span class="hidden lg:inline ml-2">
      {{ isToggled ? 'My Timezone' : 'Original' }}
    </span>
  </UButton>
</template>

<script setup lang="ts">
const { isToggled, hasTimezone, toggle } = useTimezoneToggle()
const { userTimezone } = useTimezone()
</script>





