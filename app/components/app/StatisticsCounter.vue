<script setup lang="ts">
  const { createFadeInWithTransform } = useAnimation();

  interface Statistic {
    id: number;
    value: number;
    suffix?: string;
    title: string;
    icon?: string;
  }

  interface WidgetProps {
    data?: Array<Statistic>;
  }

  const props = withDefaults(defineProps<WidgetProps>(), {
    data: () => [],
  });

  // Generate a unique color for each statistic
  const getBackgroundClass = (id: number) => {
    const colors = ['bg-blue-50', 'bg-green-50', 'bg-amber-50', 'bg-rose-50'];
    const darkColors = ['dark:bg-blue-900/20', 'dark:bg-green-900/20', 'dark:bg-amber-900/20', 'dark:bg-rose-900/20'];
    const textColors = ['text-blue-600', 'text-green-600', 'text-amber-600', 'text-rose-600'];
    const darkTextColors = ['dark:text-blue-400', 'dark:text-green-400', 'dark:text-amber-400', 'dark:text-rose-400'];

    const index = (id - 1) % colors.length;
    return {
      bg: `${colors[index]} ${darkColors[index]}`,
      text: `${textColors[index]} ${darkTextColors[index]}`,
    };
  };
</script>

<template>
  <section class="py-16 md:py-24 bg-primary-50 dark:bg-neutral-900">
    <u-container>
      <!-- Section Header -->
      <div class="flex justify-center mb-12 md:mb-16">
        <div v-motion="createFadeInWithTransform('up', { delay: 0, duration: 1000 })" class="text-center max-w-xl">
          <base-heading is="h2" class="mb-4">
            <template #sub>
              <div class="flex gap-2 items-center justify-center">
                <icon name="hugeicons:chart-pie" class="w-5 h-5 text-primary-500 dark:text-primary-400" />
                <p>{{ $t('statistics.section_title') }}</p>
              </div>
            </template>
            <template #default>
              <p>{{ $t('statistics.section_subtitle') }}</p>
            </template>
          </base-heading>
          <p class="text-sm md:text-base text-gray-600 dark:text-gray-300">
            Our achievements in numbers demonstrate our commitment to excellence and patient care
          </p>
        </div>
      </div>

      <!-- Statistics Display - Hexagonal Grid Layout -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        <div
          v-for="stat in props.data"
          :key="stat.id"
          v-motion="createFadeInWithTransform('up', { delay: stat.id * 100, duration: 800 })"
          class="relative transform transition-all duration-500 hover:-translate-y-3"
        >
          <!-- Statistic Card -->
          <div :class="['relative  overflow-hidden']">
            <!-- Content -->
            <div class="rounded-xl p-6 md:p-8 bg-white dark:bg-neutral-800">
              <!-- Icon with colored background -->
              <div
                v-if="stat.icon"
                :class="`w-16 h-16 flex items-center justify-center rounded-2xl mb-6 ${getBackgroundClass(stat.id).bg}`"
              >
                <icon :name="stat.icon" :class="`w-7 h-7 ${getBackgroundClass(stat.id).text}`" />
              </div>

              <!-- Number with animation -->
              <div class="flex items-baseline gap-1">
                <count-up
                  :to="stat.value"
                  :duration="2000"
                  class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white"
                />
                <span v-if="stat.suffix" class="text-3xl font-bold text-gray-900 dark:text-white">
                  {{ stat.suffix }}
                </span>
              </div>

              <!-- Title -->
              <h3 class="mt-3 text-lg md:text-xl font-medium text-gray-700 dark:text-gray-300">
                {{ stat.title }}
              </h3>

              <!-- Decorative Element -->
              <div
                class="absolute -bottom-2 -right-2 w-20 h-20 rounded-full opacity-20"
                :class="getBackgroundClass(stat.id).bg"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </u-container>
  </section>
</template>
