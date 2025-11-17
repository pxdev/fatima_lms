<script lang="ts" setup>
  /**
   * Component props interface
   */
  interface Props {
    enableOpacity?: boolean;
  }

  /**
   * Default props configuration
   */
  const props = withDefaults(defineProps<Props>(), {
    enableOpacity: false, // Default false
  });
</script>

<template>
  <span class="group cursor-scale relative overflow-hidden">
    <span
      :class="[
        'transition block ease-in-out duration-300 translate-y-0 group-hover:-translate-y-full',
        { 'opacity-50': props.enableOpacity },
      ]"
    >
      <slot name="default" />
    </span>
    <span
      class="absolute top-0 w-full transition block ease-in-out duration-300 translate-y-full group-hover:translate-y-0"
    >
      <slot name="default" />
    </span>
  </span>
</template>
