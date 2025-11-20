<script setup>
import * as locales from '@nuxt/ui/locale';

const { locale } = useI18n();

const lang = computed(() => locales[locale.value].code);
const dir = computed(() => locales[locale.value].dir);

useHead({
  htmlAttrs: {
    lang,
    dir,
  },
});
</script>

<template>
  <Html class="h-full text-lg font-rubik">
  <layout-header/>
  <div class="pb-6">
     <slot/>
  </div>
  <layout-footer/>
   </Html>
</template>

<style>

</style>
