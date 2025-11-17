<script setup>
  import { useDraggable } from '@vueuse/core';

  const el = ref(null);

  const { x, y, style } = useDraggable(el, {
    initialValue: { x: 75, y: 350 },
  });
</script>

<template>
  <pre
    ref="el"
    :style="style"
    class="bg-black text-white text-xs p-4 w-[450px] h-[460px] fixed rounded bottom-0 overflow-auto z-[1000] shadow"
  >
  <slot/>
</pre>
</template>

<style scoped></style>
