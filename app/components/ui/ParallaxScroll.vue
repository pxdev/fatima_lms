<script setup lang="ts">
  import { useScroll } from '@vueuse/core';
  import { useMotion } from '@vueuse/motion';

  /**
   * Component props interface for parallax effect configuration
   */
  interface ParallaxScrollProps {
    speed?: number; // Controls the intensity of the parallax effect
  }

  // Default values for component props
  const props = withDefaults(defineProps<ParallaxScrollProps>(), {
    speed: 20, // Default parallax speed
  });

  const parallaxContainer = ref<HTMLElement | null>(null);
  const parallaxElement = ref<HTMLElement | null>(null);

  // Use VueUse's scroll hook to track page scroll
  const { y: scrollY } = useScroll(window);

  // Setup motion with the parallax element
  const motion = useMotion(parallaxElement, {
    initial: {
      y: 0,
    },
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  });

  // Update transform based on scroll position
  watch(
    scrollY,
    () => {
      // Calculate y-translation based on scroll position and speed
      const yOffset = scrollY.value * (props.speed / 1000);

      // Update motion values
      motion.apply({
        y: yOffset,
      });
    },
    { immediate: true },
  );
</script>

<template>
  <div ref="parallaxContainer">
    <div ref="parallaxElement" class="parallax-element will-change-transform">
      <slot name="default" />
    </div>
  </div>
</template>

<style scoped></style>
