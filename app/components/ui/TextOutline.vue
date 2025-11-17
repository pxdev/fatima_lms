<script setup lang="ts">
  interface widgetProps {
    text: string;
    is?: string;
    size?: string;
  }

  const props = withDefaults(defineProps<widgetProps>(), {
    duration: 20,
    is: 'h1',
    size: 'text-5xl',
  });
  const { value: mode } = useColorMode();
</script>

<template>
  <component :is="props.is" :class="[props.size, 'relative overflow-visible text-transparent tracking-wide group']">
    {{ text }}
    <span
      class="absolute top-0 ltr:left-0 rtl:right-0 w-full whitespace-nowrap overflow-hidden transition-[max-width] duration-800 ease-[cubic-bezier(0.22,0.61,0.36,1)] max-w-0 group-hover:max-w-full"
      :class="mode === 'dark' ? 'text-white' : 'text-black'"
      aria-hidden="true"
    >
      {{ props.text }}
    </span>
  </component>
</template>

<style scoped>
  h1 {
    text-shadow:
      1px 1px 0 rgba(0, 0, 0, 0.8),
      -1px -1px 0 rgba(0, 0, 0, 0.8),
      1px -1px 0 rgba(0, 0, 0, 0.8),
      -1px 1px 0 rgba(0, 0, 0, 0.8),
      1px 1px 0 rgba(0, 0, 0, 0.8);
    -webkit-text-fill-color: white;
    -webkit-text-stroke-width: 0;
  }

  h1 span {
    -webkit-text-fill-color: currentColor;
    -webkit-text-stroke: unset;
    pointer-events: none;
  }
</style>
