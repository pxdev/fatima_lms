<script setup lang="ts">
  import { useTransition } from '@vueuse/core';

  interface Props {
    to?: number;
    from?: number;
    duration?: number;
    fractionDigits?: number;
  }

  const props = withDefaults(defineProps<Props>(), {
    to: 0,
    from: 0,
    duration: 1500,
    fractionDigits: 0,
  });

  const baseNumber = shallowRef(props.from);

  const numberAnimation = useTransition(baseNumber, {
    duration: props.duration,
    transition: [0.75, 0, 0.25, 1],
  });

  baseNumber.value = props.to;
</script>

<template>
  <span>{{ numberAnimation.toFixed(props.fractionDigits) }}</span>
</template>

<style scoped></style>
