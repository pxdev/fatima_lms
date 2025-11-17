<script lang="ts" setup>
  interface TeamMember {
    name: string;
    role: string;
    image: string;
    link: string;
    social: Array<{
      platform: string;
      url: string;
    }>;
  }

  interface widgetProps {
    data?: Array<TeamMember>;
  }

  const props = withDefaults(defineProps<widgetProps>(), {
    data: () => [],
  });

  const teamContainerRef = ref(null);

  const breakpoints = {
    desktop: {
      slidesPerView: 4,
    },
    tablet: {
      slidesPerView: 3,
    },
    mobile: {
      slidesPerView: 1,
    },
  };

  useSwiper(teamContainerRef, {
    grabCursor: true,
    speed: 800,
    spaceBetween: 25,
    autoplay: {
      delay: 3500,
      disableOnInteraction: false,
    },
    breakpoints: {
      992: breakpoints.desktop,
      768: breakpoints.tablet,
      576: breakpoints.mobile,
    },
    pagination: {
      el: '.team-pagination',
      type: 'bullets',
      renderBullet: function (_, className) {
        return (
          '<span class="h-2 w-2 cursor-scale rounded-lg transition-all duration-500 cursor-pointer bg-gray-200 hover:bg-gray-400 dark:bg-neutral-500 dark:hover:bg-neutral-100 ' +
          className +
          '">' +
          '</span> '
        );
      },
      bulletActiveClass: 'bg-primary-500 dark:bg-white dark:hover:bg-neutral-100 hover:bg-primary-500 w-8',
      clickable: true,
    },
  });
</script>
<template>
  <figure class="block relative py-24 overflow-hidden">
    <u-container>
      <div class="flex justify-center max-w-2xl mx-auto mb-24 text-center">
        <div>
          <base-heading is="h2" class="mb-8">
            <template #sub>
              <div class="flex gap-2 items-center justify-center">
                <icon name="maki:doctor" class="w-5 h-5 md:w-6 md:h-6 text-primary-500 dark:text-white" />
                <p>Meet Our Team</p>
              </div>
            </template>
            <template #default>
              <p>Compassionate Care, Exceptional Team</p>
            </template>
          </base-heading>
          <p>
            Our team brings together a wealth of experience, passion, and a dedication to excellence in patient care.
          </p>
        </div>
      </div>

      <client-only>
        <swiper-container ref="teamContainerRef" :init="false">
          <swiper-slide v-for="(slide, idx) in props.data" :key="idx + '_slide'">
            <div class="team-card relative mb-8 group">
              <nuxt-link
                :to="slide.link"
                class="block max-w-full rounded-2xl max-h-full w-full h-full overflow-hidden cursor-scale relative transition-all duration-300"
              >
                <img
                  :src="slide.image"
                  alt=""
                  class="max-w-full max-h-full w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                />
              </nuxt-link>
              <div
                class="team-card-content relative text-center mx-6 bg-white dark:bg-neutral-900 dark:text-white z-10 border border-gray-100 dark:border-neutral-800 group-hover:border-primary-500 dark:group-hover:border-neutral-800 transition-all duration-500 delay-500 rounded-2xl overflow-hidden -mt-10 p-4"
              >
                <div class="relative space-y-1 z-10 group-hover:text-white transition-all duration-500">
                  <div
                    class="social-links flex justify-center gap-2 text-primary-500 dark:text-white group-hover:text-white transition-all duration-500"
                  >
                    <base-social-link
                      v-for="(social, idx) in slide.social"
                      :key="idx + '_social'"
                      :platform="social.platform"
                      :link="social.url"
                      size="sm"
                    />
                  </div>
                  <p class="flex justify-center font-bold text-lg">{{ slide.name }}</p>
                  <p>{{ slide.role }}</p>
                </div>
                <div
                  class="absolute bg-primary-500 dark:bg-neutral-950 inset-x-0 h-full bottom-0 transform origin-bottom scale-y-0 group-hover:scale-y-100 transition-transform ease-in-out will-change-transform duration-500"
                ></div>
              </div>
            </div>
          </swiper-slide>
        </swiper-container>

        <div class="team-pagination relative flex items-center justify-center gap-1" />
      </client-only>
    </u-container>
  </figure>
</template>

<style scoped></style>
