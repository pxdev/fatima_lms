<script setup lang="ts">
  const { isRTL } = useDirection();
  const { createAnimationClipReveal, createFadeInWithTransform } = useAnimation();
  const { getThumbnail: img } = useDirectusFiles();

  interface PortfolioItem {
    title: string;
    source: string;
    year: string | number;
    image: string;
    link: string;
  }

  interface widgetProps {
    data?: Array<PortfolioItem>;
  }

  const props = withDefaults(defineProps<widgetProps>(), {
    data: () => [],
  });
</script>
<template>
  <section
    ref="mainPortfolioContainer"
    class="block relative isolate overflow-hidden py-12 md:py-24 bg-primary-50 dark:bg-neutral-950"
  >
    <u-container>
      <div class="flex justify-center max-w-2xl mx-auto text-center px-4 md:px-0">
        <div v-motion="createFadeInWithTransform('up', { delay: 0, duration: 1000 })">
          <base-heading is="h2" class="mb-4 md:mb-8">
            <template #sub>
              <div class="flex gap-2 items-center justify-center">
                <icon name="maki:doctor" class="w-5 h-5 md:w-6 md:h-6 text-primary-500 dark:text-white" />
                <p>Awards</p>
              </div>
            </template>
            <template #default>
              <p class="text-2xl md:text-3xl lg:text-4xl">Our Honors and Awards</p>
            </template>
          </base-heading>
          <p class="text-sm md:text-base">
            Our team has been honored with numerous prestigious awards for outstanding achievements in various fields of
            medicine.
          </p>
        </div>
      </div>

      <div class="items mt-8 md:mt-12">
        <div
          v-for="(item, idx) in props.data"
          v-motion="createAnimationClipReveal('left', { delay: idx * 500, duration: 1000 })"
          :key="idx + '_project'"
          class="group flex flex-col md:flex-row justify-between items-start md:items-center p-3 md:p-4 gap-2 md:gap-4 cursor-scale border-b last:border-none border-b-primary-100/60 dark:border-b-primary-100/10"
        >
          <div class="flex gap-2 md:gap-4 items-center flex-1 shrink-0 w-full">
            <div
              class="img-container shrink-0 object-cover overflow-hidden transition-all duration-700 ease-in-out rounded h-16 md:h-24 w-16 md:w-0 md:-translate-x-1/2 md:group-hover:translate-x-0 md:group-hover:w-28 relative"
            >
              <nuxt-img :alt="item.title" :src="img(item.image)" class="w-full h-full object-cover" />
            </div>
            <h3 class="text-lg md:text-xl lg:text-2xl font-bold flex-1 shrink-0">{{ item.title }}</h3>
          </div>

          <div
            class="flex md:flex-1 justify-between w-full md:w-auto items-center mt-2 md:mt-0 md:transition-all md:duration-700 md:group-hover:opacity-0 md:translate-x-0 md:group-hover:translate-x-4"
          >
            <div>
              <p class="text-sm md:text-base opacity-80">{{ item.source }}</p>
              <p class="text-xs md:text-sm opacity-70">/{{ item.year }}</p>
            </div>

            <div class="md:ltr:ml-auto md:rtl:mr-auto">
              <icon
                :class="[
                  'w-6 h-6 md:w-8 md:h-8 ltr:-rotate-45 rtl:rotate-45 transition-all duration-700 group-hover:rotate-0',
                ]"
                :name="isRTL ? 'heroicons:arrow-small-left' : 'heroicons:arrow-small-right'"
              />
            </div>
          </div>
        </div>
      </div>
    </u-container>
  </section>
</template>

<style scoped></style>
