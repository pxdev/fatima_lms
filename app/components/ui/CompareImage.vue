<script setup lang="ts">
  import { VueCompareImage } from 'vue3-compare-image';

  interface CompareImageProps {
    leftImage: string;
    rightImageLabel: string;
    leftImageLabel: string;
    rightImage: string;
    handleSize?: number;
    hover?: boolean;
    sliderLineWidth?: number;
    sliderLineColor?: string;
  }

  // Define props with TypeScript types
  const props = withDefaults(defineProps<CompareImageProps>(), {
    handleSize: 40,
    hover: false,
    sliderLineWidth: 2,
    sliderLineColor: '#ffffff',
  });
</script>

<template>
  <client-only>
    <vue-compare-image
      :left-image="props.leftImage"
      :right-image="props.rightImage"
      :handle-size="props.handleSize"
      :hover="props.hover"
      :right-image-label="props.rightImageLabel"
      :left-image-label="props.leftImageLabel"
      :slider-line-width="props.sliderLineWidth"
      :slider-line-color="props.sliderLineColor"
    ></vue-compare-image>
  </client-only>
</template>

<style scoped></style>
