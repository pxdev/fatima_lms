<script lang="ts" setup>
  interface CardAProps {
    to: string;
    src: string;
  }

  const props = defineProps<CardAProps>();
  const cardRef = ref<HTMLElement | null>(null);
</script>

<template>
  <figure ref="cardRef" class="group relative">
    <nuxt-link
      :to="props.to"
      class="block max-w-full max-h-full w-full h-full overflow-hidden cursor-scale relative transition-all duration-300 hover:[clip-path:inset(5px_10px)] [clip-path:inset(0)]"
    >
      <img
        :src="props.src"
        alt=""
        class="max-w-full max-h-full w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
      />
    </nuxt-link>
    <slot name="default" />
  </figure>
</template>
