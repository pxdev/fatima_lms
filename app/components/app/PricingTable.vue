<script setup>
import WaveTop from "~/components/app/WaveTop.vue";

const {createFadeInWithTransform} = useAnimation();

const props = defineProps({
  data: {type: Array, default: () => []},
  courses: {type: Array, default: () => []},
});

const selectedCourse = ref(null);

</script>

<template>
  <section ref="mainPricingContainer" class="block relative py-12 md:py-24 bg-gradient-to-r from-primary/10  to-secondary/10">

    <wave-top/>

    <u-container>
      <div class="flex justify-center max-w-2xl mx-auto text-center px-4 md:px-0">
        <div v-motion="createFadeInWithTransform('up', { delay: 0, duration: 1000 })">
          <base-heading is="h2" class="mb-4 md:mb-8">
            <template #sub>
              <div class="flex gap-2 items-center justify-center">
                <icon name="hugeicons:money-bag-02" class="w-5 h-5 md:w-6 md:h-6 text-primary-500 dark:text-white"/>
                <p>{{ $t('pricing.section_subtitle') }}</p>
              </div>
            </template>
            <template #default>
              <p>{{ $t('pricing.section_title') }}</p>
            </template>
          </base-heading>
          <p class="text-sm md:text-base text-gray-600 dark:text-gray-300">
            Choose the perfect healthcare plan that suits your needs and budget. All plans include our quality care
            guarantee.
          </p>
        </div>
      </div>


      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mt-8 md:mt-12 py-12">
        <div
            v-for="(plan, idx) in props.data"
            :key="idx + '_pricing_plan'"
            class="group relative bg-white dark:bg-neutral-950 rounded-3xl p-6 md:p-8 shadow-lg shadow-primary-500/5 dark:shadow-neutral-900/20 border border-primary-100/20 dark:border-neutral-700 transition-all duration-500 hover:shadow-2xl hover:shadow-primary-500/10 hover:-translate-y-2 cursor-scale"
            :class="[
                plan.isPopular
                  ? 'ring-2 ring-primary-500 dark:ring-primary-400 relative z-10 scale-105'
                  : 'hover:ring-1 hover:ring-primary-300 dark:hover:ring-primary-600',
              ]"
        >
          <div
              v-if="plan.isPopular"
              class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium"
          >
            {{ $t('pricing.most_popular') }}
          </div>

          <u-form-field class="p-4">
            <u-select
                v-model="selectedCourse" placeholder="Select Prefered course" value-key="slug" size="sm" class="w-full"
                description-key=""
                :items="props.courses"/>
          </u-form-field>

          <!-- Plan Header -->
          <div class="text-center mb-6">
            <h3 class="text-xl md:text-2xl font-bold dark:text-white mb-2">
              {{ plan.label }}
            </h3>
            <div class="dark:text-gray-300 text-sm" v-html="plan.description"/>
          </div>


          <div class="text-center mb-8">
            <div class="flex items-baseline justify-center gap-1">
              <span class="text-2xl font-medium text-gray-900 dark:text-white">$</span>
              <span class="text-4xl md:text-5xl font-bold text-primary-600 dark:text-primary-400">
                    {{ plan.price }}
                  </span>
              <span class="text-gray-600 dark:text-gray-300"> /{{ $t(`pricing.per_${plan.period}`) }} </span>
            </div>
          </div>

          <!-- Features List -->
          <div class="mb-8">
            <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">
              {{ $t('pricing.features_included') }}
            </h4>
            <ul class="space-y-3">
              <li v-for="(feature, featureIdx) in plan.features" :key="featureIdx" class="flex items-start gap-3">
                <div
                    class="flex-shrink-0 w-5 h-5 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mt-0.5"
                >
                  <icon name="heroicons:check" class="w-3 h-3 text-primary-600 dark:text-primary-400"/>
                </div>
                <span class="text-gray-700 dark:text-gray-300 text-sm">{{ feature }}</span>
              </li>
            </ul>
          </div>

          <div class="mt-auto">
            <u-button block color="primary" size="xl" class="cursor-scale rounded-full py-3 px-6" :to="plan.link">
              <duplicate-hover-text> {{ $t('pricing.choose_plan') }}</duplicate-hover-text>
            </u-button>
          </div>
        </div>
      </div>
    </u-container>
  </section>
</template>