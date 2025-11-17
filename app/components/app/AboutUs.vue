<script setup lang="ts">
  const { createAnimationClipReveal } = useAnimation();
  const { isRTL } = useDirection();
</script>

<template>
  <section class="py-12 md:py-16 lg:py-24 transition-colors duration-300">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col-reverse lg:flex-row items-center gap-8 md:gap-12">
      <!-- Image Stack -->
      <div class="relative w-full lg:w-1/2 flex justify-center lg:justify-start my-8 lg:my-0">
        <!-- Back Box -->
        <div
          v-motion="createAnimationClipReveal(isRTL ? 'right' : 'left', { delay: 0, duration: 1000 })"
          class="bg-[url('/images/services/service-new-img-05-1010x615.jpg')] bg-no-repeat will-change-transform w-[280px] sm:w-[320px] md:w-[360px] h-[280px] sm:h-[320px] md:h-[360px] rounded-3xl bg-cover bg-center border-8 border-white dark:border-neutral-900 mb-10 z-10 transition-all duration-300"
        ></div>

        <!-- Front Box -->
        <div
          v-motion="createAnimationClipReveal(isRTL ? 'right' : 'left', { delay: 0, duration: 1000 })"
          class="bg-[url('/images/services/service-new-img-04-1010x615.jpg')] bg-no-repeat will-change-transform w-[240px] sm:w-[280px] md:w-[320px] ltr:-translate-x-1/4 rtl:translate-x-1/4 translate-y-1/4 z-10 h-[240px] sm:h-[280px] md:h-[320px] rounded-3xl bg-cover bg-center border-8 border-white dark:border-neutral-900 transition-all duration-300"
        ></div>
      </div>

      <!-- Text Content -->
      <div
        v-motion="createAnimationClipReveal('top', { duration: 1000 })"
        class="will-change-transform w-full lg:w-1/2"
      >
        <base-heading is="h2" class="mb-6 md:mb-8">
          <template #sub>
            <div class="flex gap-2 items-center">
              <p class="dark:text-gray-300">About Us</p>
            </div>
          </template>
          <template #default>
            <p class="dark:text-white">Our Honors and Awards</p>
          </template>
        </base-heading>

        <p class="text-gray-700 dark:text-gray-300 mb-4">
          Our team has been honored with numerous prestigious awards for outstanding achievements in various fields of
          medicine.
        </p>

        <div class="py-4 md:py-6 font-semibold space-y-2 md:space-y-3 text-gray-800 dark:text-gray-200">
          <p>MON–FRI: 9 AM – 22 PM</p>
          <p>SATURDAY: 9 AM – 20 PM</p>
        </div>

        <fill-arrow-button size="h-10 w-10 md:h-12 md:w-12" class="mt-2">About Us</fill-arrow-button>
      </div>
    </div>
  </section>
</template>
