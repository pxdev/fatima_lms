<script lang="ts" setup>
  interface Testimonials {
    name: string;
    role: string;
    image: string;
    description: string;
    link: string;
    rating: number;
  }

  interface widgetProps {
    data?: Array<Testimonials>;
  }

  const props = withDefaults(defineProps<widgetProps>(), {
    data: () => [],
  });

  const testimonialsContainerRef = ref(null);

  useSwiper(testimonialsContainerRef, {
    grabCursor: true,
    effect: 'cards',
    parallax: true,
    autoplay: {
      delay: 3500,
      disableOnInteraction: false,
    },
    cardsEffect: {
      slideShadows: false,
      perSlideRotate: -5,
      perSlideOffset: 4,
    },
  });
</script>
<template>
  <section class="block relative m-10 py-24 rounded-4xl">
    <gradient-circle class="absolute opacity-30 bottom-0 right-0 dark:invert" />

    <div class="flex justify-center max-w-2xl mx-auto mb-12 text-center">
      <div>
        <base-heading is="h2">
          <template #sub>
            <div class="flex gap-2 items-center justify-center">
              <icon name="maki:doctor" class="w-6 h-6 text-primary-500 dark:text-white" />
              <p>Testimonials</p>
            </div>
          </template>
          <template #default>
            <p>Our patient stories</p>
          </template>
        </base-heading>
      </div>
    </div>
    <div class="max-w-3xl mx-auto">
      <client-only>
        <swiper-container ref="testimonialsContainerRef" :init="false">
          <swiper-slide v-for="(slide, idx) in props.data" :key="idx + '_slide_testimonials'">
            <div
              class="relative p-12 rounded-xl group bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-900"
            >
              <icon
                data-swiper-parallax-duration="600"
                data-swiper-parallax-scale="0.5"
                name="ph:quotes-fill"
                class="absolute m-6 right-0 top-0 w-24 h-24 text-primary-200 dark:text-white opacity-10"
              />
              <icon
                data-swiper-parallax-duration="600"
                data-swiper-parallax-scale="0.5"
                name="ph:quotes-fill"
                class="absolute m-6 rotate-180 left-0 bottom-0 w-24 h-24 text-primary-200 dark:text-white opacity-10"
              />
              <div class="flex justify-center mx-auto mb-2 text-center items-center">
                <div class="testimonials-author gap-3">
                  <u-avatar size="3xl" :src="slide.image" />
                  <div class="text-center py-2">
                    <h4 class="text-base font-bold">{{ slide.name }}</h4>
                    <p class="text-sm opacity-60">{{ slide.role }}</p>
                  </div>
                </div>
              </div>
              <div class="rating mx-auto flex justify-center items-center">
                <icon
                  v-for="rating in slide.rating"
                  :key="rating + 'rating-key'"
                  name="heroicons:star-16-solid"
                  class="w-4 h-4 text-yellow-500"
                />
              </div>
              <div
                data-swiper-parallax-duration="700"
                data-swiper-parallax-scale="0.5"
                data-swiper-parallax-opacity="0"
                class="testimonials-content py-12 text-2xl text-center"
              >
                <p>{{ slide.description }}</p>
              </div>
            </div>
          </swiper-slide>
        </swiper-container>
        <!--        <div class="testimonials-pagination relative flex items-center justify-center gap-1"></div>-->
      </client-only>
    </div>
  </section>
</template>

<style scoped>
  /* hover:[clip-path:inset(5px_20px)] [clip-path:inset(0)] */
</style>
