<script setup lang="ts">
  interface ServiceItem {
    name: string;
    category: string;
    description: string;
    front_image: string;
    back_image: string;
    slug: string;
  }

  interface widgetProps {
    data?: Array<ServiceItem>;
  }

  const props = withDefaults(defineProps<widgetProps>(), {
    data: () => [],
  });
</script>

<template>
  <section
    ref="mainServicesContainer"
    class="block relative bg-primary-600 dark:bg-neutral-950 mx-4 lg:mx-12 py-24 rounded-4xl bg-[url('/images/shapes/lines.png')] bg-no-repeat bg-right-bottom"
  >
    <u-container>
      <div class="flex flex-col lg:flex-row gap-12 relative items-start">
        <div class="flex lg:sticky top-28 lg:mb-24 text-white">
          <div>
            <base-heading is="h2" class="mb-8">
              <template #sub>
                <div class="flex gap-2 mb-2">
                  <icon name="hugeicons:stars" class="w-6 h-6" />
                  <p>What We Offer</p>
                </div>
              </template>
              <template #default>
                <p>Comprehensive Healthcare Solutions</p>
              </template>
            </base-heading>
            <p class="text-base lg:text-lg">
              We provide a wide range of medical services tailored to meet your healthcare needs with advanced
              technology and personalized care.
            </p>

            <parallax-scroll :speed="50" class="absolute hidden lg:flex top-1/2 left-0 opacity-5 will-change-transform">
              <icon
                name="clarity:asterisk-solid"
                class="text-white w-[500px] h-[500px] animate-spin animation-speed opacity-30"
              />
            </parallax-scroll>
          </div>
        </div>
        <div class="w-full space-y-10 gap-12">
          <div
            v-for="(slide, index) in props.data"
            :key="index"
            v-motion
            :initial="{
              scale: 0.8,
              opacity: 0,
              rotate: index % 2 === 0 ? -5 : 5,
            }"
            :visible="{
              scale: 1,
              rotate: 0,
              opacity: 1,
              transition: {
                duration: 600,
                repeatType: 'mirror',
              },
            }"
            class="p-8 lg:p-12 bg-white text-gray-700 relative rounded-2xl will-change-transform"
          >
            <div
              class="absolute -rotate-90 left-0 -translate-x-1/2 mx-auto top-1/2 -translate-y-1/2 flex z-10 justify-center"
            >
              <div class="relative max-w-sm">
                <div
                  class="shadow-[0_-20px_0_0] shadow-primary-600 dark:shadow-neutral-950 -ml-5 rounded-tr-xl block absolute bg-transparent top-0 h-10 w-5 left-0"
                />
                <div
                  class="bg-primary-600 dark:bg-neutral-950 text-white rounded-b-3xl pb-2 px-12 flex items-center justify-center gap-2 text-sm"
                >
                  <div class="h-2 w-2 bg-secondary-500 rounded-full" />
                  <span class="tracking-widest">{{ slide.category }}</span>
                </div>
                <div
                  class="shadow-[0_-20px_0_0] shadow-primary-600 dark:shadow-neutral-950 -mr-5 rounded-tl-xl block absolute bg-transparent top-0 h-10 w-5 right-0"
                />
              </div>
            </div>
            <div class="group rounded-xl relative">
              <div class="flex items-center gap-4 mb-4 justify-between">
                <div class="">
                  <h3 class="text-xl font-bold">{{ slide.name }}</h3>
                  <p>$38.99</p>
                </div>
                <arrow-button size="h-10 w-10" />
              </div>

              <p class="text-base lg:text-lg opacity-80 mb-4">{{ slide.description }}</p>

              <figure class="relative overflow-hidden rounded-xl">
                <two-images-with-blur
                  :front="slide.front_image"
                  height="h-[200px] lg:h-[400px]"
                  :back="slide.back_image"
                  to="/"
                />
              </figure>
            </div>
          </div>
        </div>
      </div>
    </u-container>
  </section>
</template>
<style scoped>
  .animation-speed {
    animation-duration: 10s;
  }
</style>
