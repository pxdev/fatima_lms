<script lang="ts" setup>
  /**
   * ImageWithGradient Component
   *
   * A card component that displays an image with a gradient overlay on hover.
   * Features an animated arrow that rotates on hover and a slide-up content area.
   */

  interface CardAProps {
    to: string; // The destination URL for the link
    src: string; // The image source URL
  }

  const props = defineProps<CardAProps>();
</script>

<template>
  <div class="relative overflow-hidden rounded-xl group">
    <!-- Image Container -->
    <div class="relative">
      <img :src="props.src" alt="" class="w-full h-full object-cover" />

      <!-- Animated Arrow Link -->
      <nuxt-link
        :to="props.to"
        class="absolute bg-black text-white right-8 top-8 z-10 w-12 h-12 flex items-center justify-center rounded-full text-xl transform rotate-45 transition-all duration-300 ease-in-out group-hover:rotate-0 group-hover:bg-black group-hover:text-white"
      >
        <icon class="w-8 h-8" name="material-symbols:arrow-outward" />
      </nuxt-link>
    </div>

    <!-- Content Overlay - Slides up on hover -->
    <div
      class="absolute left-0 -bottom-full w-full h-full flex items-end justify-start p-10 bg-gradient-to-t from-black/80 to-transparent transition-all duration-300 ease-in-out group-hover:bottom-0"
    >
      <div>
        <slot name="default" />
      </div>
    </div>
  </div>
</template>
