<script lang="ts" setup>
  /**
   * Get localized path helper from Nuxt i18n
   */
  const localePath = useLocalePath();

  /**
   * Component props interface
   */
  interface Props {
    isDark?: boolean; // Controls whether to apply dark mode styling
  }

  /**
   * Default props configuration
   */
  const props = withDefaults(defineProps<Props>(), {
    isDark: false, // Default to light mode styling
  });
</script>

<template>
  <!--
    Logo component with link to homepage
    - Supports dark/light mode via isDark prop
    - Includes proper accessibility features
    - Uses cursor-scale class for hover effects
  -->
  <nuxt-link :to="localePath('/')" class="flex items-center text-lg gap-2 font-bold cursor-scale">
    <!-- Screen reader text for accessibility -->
    <span class="sr-only">Components</span>
    <img :class="{ 'brightness-0 invert': props.isDark }" alt="" class="w-10" src="/images/logos/logo.svg" />
    <span>Mrs.Fatima</span>

  </nuxt-link>
</template>

<style scoped></style>
