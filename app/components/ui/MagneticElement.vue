<template>
  <div ref="wrapper" class="relative inline-block" @mousemove="onMouseMove" @mouseleave="resetTransform">
    <div ref="inner" class="will-change-transform transition-transform duration-200 ease-out">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';

  const wrapper = ref<HTMLDivElement | null>(null);
  const inner = ref<HTMLDivElement | null>(null);

  const strength = 30;

  function onMouseMove(event: MouseEvent) {
    const wrapperEl = wrapper.value;
    const innerEl = inner.value;
    if (!wrapperEl || !innerEl) return;

    const rect = wrapperEl.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    const moveX = ((offsetX - rect.width / 2) / rect.width) * strength;
    const moveY = ((offsetY - rect.height / 2) / rect.height) * strength;

    innerEl.style.transform = `translate(${moveX}px, ${moveY}px)`;
  }

  function resetTransform() {
    const innerEl = inner.value;
    if (innerEl) {
      innerEl.style.transform = 'translate(0, 0)';
    }
  }
</script>
