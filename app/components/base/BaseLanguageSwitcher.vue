<script setup>

  const { locales } = useI18n();
  const switchLocalePath = useSwitchLocalePath();

</script>

<template>
  <div>


    <u-popover>
      <u-button class="text-sm flex gap-1 items-center" color="neutral"  size="xl" variant="ghost">
        <icon class="w-5 h-5" name="hugeicons:globe-02" />
       </u-button>

      <template #content>
        <u-button
          v-for="locale in locales"
          :key="locale.code"
          :to="switchLocalePath(locale.code)"
          class="text-xs flex gap-2 items-center"
          color="neutral"
          variant="ghost"
        >
          <icon class="w-4 h-4" :name="locale.flag" />
          {{ locale.name }}
        </u-button>
      </template>
    </u-popover>


  </div>
</template>
