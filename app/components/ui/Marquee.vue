<script lang="ts" setup>
  import { Vue3Marquee } from 'vue3-marquee';

  interface widgetProps {
    duration?: number;
    clone?: boolean;
    pauseOnHover?: boolean;
  }

  const props = withDefaults(defineProps<widgetProps>(), {
    duration: 50,
    clone: true,
    pauseOnHover: true,
  });

  const { isRTL } = useDirection();
</script>

<template>
  <section>
    <vue3-marquee
      :duration="props.duration"
      :clone="props.clone"
      :pause-on-hover="props.pauseOnHover"
      :direction="isRTL ? 'reverse' : 'normal'"
    >
      <slot name="default" />
    </vue3-marquee>
  </section>
</template>
