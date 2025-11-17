<script setup lang="ts">
  const { isRTL } = useDirection();

  interface WidgetProps {
    text?: string;
    textSize?: number;
    iconName?: string;
    container?: string;
  }

  // Define props with TypeScript types
  const props = withDefaults(defineProps<WidgetProps>(), {
    text: 'Scroll Down . Scroll Down . Scroll Down . Scroll Down . Scroll Down . Scroll Down .',
    textSize: 22,
    iconName: 'heroicons:arrow-small-down',
    container: 'h-32 w-32 bg-white',
  });
</script>

<template>
  <div :class="[props.container, 'p-2 rounded-full']">
    <div class="relative">
      <slot name="default">
        <icon :name="props.iconName" class="absolute text-primary top-1/2 z-10 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3" />
      </slot>
      <div class="animate-spin animation-speed">
        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 200 200">
          <defs>
            <path d="M0, 100a100, 100 0 1, 0 200, 0a100, 100 0 1, 0 -200, 0" id="txt-path"></path>
          </defs>
          <circle cx="150" cy="100" r="75" fill="none"></circle>
          <text :font-size="props.textSize" font-weight="500">
            <textPath :startOffset="isRTL ? '100%' : '0%'" xlink:href="#txt-path">
              {{ props.text }}
            </textPath>
          </text>
        </svg>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .animation-speed {
    animation-duration: 20s;
    animation-direction: alternate-reverse;
  }
</style>
