<script lang="ts" setup>
  interface CardAProps {
    front: string;
    back: string;
    height?: string;
  }

  const props = defineProps<CardAProps>();
</script>

<template>
  <figure class="block group clip">
    <div :class="props.height" class="cursor-scale relative overflow-hidden ">
      <nuxt-img
        :src="props.front"
        alt=""
        class="absolute max-w-full max-h-full w-full h-full top-0 left-0 object-cover transition-all duration-500 ease-in-out translate-x-[50%] scale-x-[2] opacity-0 blur-[10px] group-hover:translate-x-0 group-hover:scale-x-[1] group-hover:opacity-100 group-hover:blur-none"
      />
      <nuxt-img
        :src="props.back"
        alt=""
        class="absolute max-w-full max-h-full w-full h-full top-0 left-0 object-cover transition-all duration-500 ease-in-out group-hover:-translate-x-[50%] group-hover:scale-x-[2] group-hover:opacity-0 blur-none"
      />
    </div>

    <slot name="default" />
  </figure>
</template>

<style scoped>

</style>
