<script lang="ts" setup>
  import { useEventListener, useThrottleFn } from '@vueuse/core';

  /**
   * Scroll distance (in pixels) required before the scroll-to-top button becomes visible
   */
  const VISIBILITY_THRESHOLD = 150;

  // Reference to the SVG path element for scroll progress visualization
  const pathRef = ref<SVGPathElement | null>(null);

  // Controls visibility of the scroll-to-top button
  const isVisible = ref(false);

  // Total length of the SVG path, calculated at runtime
  let pathLength = 0;

  /**
   * Updates the scroll progress indicator based on current scroll position
   * - Calculates progress as a ratio of current scroll position to total scrollable height
   * - Updates SVG path dashoffset to create the progress animation
   * - Controls visibility of the button based on scroll position
   */
  const updateProgress = () => {
    if (!pathRef.value) return;

    const scrolled = window.scrollY;
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const progress = pathLength - (scrolled * pathLength) / height;

    pathRef.value.style.strokeDashoffset = `${progress}`;
    isVisible.value = scrolled > VISIBILITY_THRESHOLD;
  };

  /**
   * Performance optimization: throttles the update function to prevent
   * excessive calculations during rapid scroll events
   */
  const throttledUpdate = useThrottleFn(updateProgress, 10);

  onMounted(() => {
    if (!pathRef.value) return;

    // Calculate the total length of the SVG path for stroke animation
    pathLength = pathRef.value.getTotalLength();

    // Configure SVG path styling for the progress animation
    Object.assign(pathRef.value.style, {
      strokeDasharray: `${pathLength} ${pathLength}`,
      strokeDashoffset: `${pathLength}`,
      transition: 'stroke-dashoffset 20ms linear',
    });

    // Initial progress calculation
    updateProgress();

    // Attach scroll event listener using VueUse's helper (client-side only)
    useEventListener('scroll', throttledUpdate);
  });

  /**
   * Scrolls the page back to the top with a smooth animation
   * when the button is clicked
   */
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };
</script>

<template>
  <!--
    Scroll to top button with progress indicator
    - Visibility controlled by scroll position
    - Includes hover and transition effects
    - Shows circular progress of scroll position
  -->
  <div
    :class="[isVisible ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-4']"
    class="fixed bottom-8 right-8 h-10 w-10 cursor-pointer cursor-scale rounded-full bg-white/5 transition-all duration-200 ease-linear z-50 hover:-translate-y-2 transform"
    @click="scrollToTop"
  >
    <!-- Up arrow icon -->
    <icon
      class="absolute text-primary-400 -translate-y-1/2 -translate-x-1/2 left-1/2 top-1/2 h-5 w-5"
      name="hugeicons:arrow-up-01"
    />
    <!-- Circular progress indicator -->
    <svg class="-rotate-90 h-full w-full" viewBox="-1 -1 102 102">
      <path
        ref="pathRef"
        class="fill-none stroke-primary-400 mix-blend-exclusion stroke-[4]"
        d="M50,1 a49,49 0 0,1 0,98 a49,49 0 0,1 0,-98"
      />
    </svg>
  </div>
</template>

<style scoped></style>
