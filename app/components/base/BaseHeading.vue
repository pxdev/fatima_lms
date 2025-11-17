<script setup lang="ts">
interface cardProps {
  is?: string;
  sub?: string;
}

const props = withDefaults(defineProps<cardProps>(), {
  is: 'h2',
  sub: '',
});

const {isRTL} = useDirection();

const style = computed(() => {
  return {
    'text-4xl': props.is === 'h1',
    'text-3xl': props.is === 'h2',
    'text-2xl': props.is === 'h3',
    'text-xl': props.is === 'h4',
    'text-lg': props.is === 'h5',
    'text-base': props.is === 'h6',
  };
});
</script>

<template>
  <div class="heading-text">
    <slot name="sub">
      <div v-if="sub" class="flex items-center justify-center gap-2 mb-2">
        <div
            :class="[
            isRTL ? 'bg-gradient-to-r' : 'bg-gradient-to-l',
            'h-0.5 w-8 rounded-full  from-primary-500 to-transparent',
          ]"
        />
        <p>
          {{ sub }}
        </p>
        <div
            :class="[
            isRTL ? 'bg-gradient-to-l' : 'bg-gradient-to-r',
            'h-0.5 w-8 rounded-full  from-primary-500 to-transparent',
          ]"
        />
      </div>
    </slot>
    <component :is="is" :class="[style, 'font-bold']">
      <slot name="default"/>
    </component>
  </div>
</template>

<style scoped></style>
