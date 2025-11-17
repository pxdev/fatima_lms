<script setup>
import * as locales from '@nuxt/ui/locale';

const {locale} = useI18n();

const lang = computed(() => locales[locale.value].code);
const dir = computed(() => locales[locale.value].dir);

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  htmlAttrs: {
    lang,
    dir,
  },
})
</script>

<template>
  <u-app :locale="locales[locale]">
    <nuxt-route-announcer />
    <nuxt-layout>
      <NuxtPage/>
    </nuxt-layout>
  </u-app>
</template>

<style>

</style>
