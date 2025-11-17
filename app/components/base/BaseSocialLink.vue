<script setup lang="ts">
  interface cardProps {
    to?: string;
    platform?: string;
    size?: string;
  }

  const props = withDefaults(defineProps<cardProps>(), {
    to: '/',
    platform: 'twitter',
    size: 'sm',
  });

  const iconName = computed(() => {
    switch (props.platform) {
      case 'twitter':
        return 'hugeicons:new-twitter-rectangle';
      case 'linkedin':
        return 'hugeicons:linkedin-01';
      case 'facebook':
        return 'hugeicons:facebook-01';
      default:
        return '';
    }
  });

  const iconSize = computed(() => {
    switch (props.size) {
      case 'xs':
        return 'w-3 h-3';
      case 'sm':
        return 'w-5 h-5';
      case 'lg':
        return 'w-8 h-8';
      case 'xl':
        return 'w-12 h-12';
      default:
        return '';
    }
  });
</script>

<template>
  <nuxt-link class="cursor-scale" :to="props.to">
    <icon :name="iconName" :class="iconSize"></icon>
  </nuxt-link>
</template>

<style scoped></style>
