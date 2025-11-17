<script lang="ts" setup>
  /**
   * Get localized path helper from Nuxt i18n
   */
  const localePath = useLocalePath();
  const { isRTL } = useDirection();

  /**
   * Component props interface
   */
  interface Props {
    to?: string; // Navigation target path
    size?: string; // Icon button size classes
    iconName?: string; // Icon name from the icon library
  }

  /**
   * Default props configuration
   */
  const props = withDefaults(defineProps<Props>(), {
    to: '/', // Default path is home
    size: 'h-8 w-8', // Default size (8 units height and width)
    iconName: 'heroicons:arrow-up-right-solid', // Default icon is add icon
  });
</script>

<template>
  <!--
    Arrow button with animated hover effects:
    - Text slides right on hover
    - Icon container rotates and scales on hover
  -->
  <u-link
    :to="localePath(props.to)"
    class="group inline-flex items-center cursor-scale text-primary-700 dark:text-white"
  >
    <!-- Icon container with animation effects -->
    <span
      :class="[
        'ltr:group-hover:rotate-45 rtl:group-hover:-rotate-45 transition ease-in-out duration-500  bg-primary-500 dark:bg-primary-400 flex items-center justify-center rounded-full group-hover:scale-125 ',
        props.size,
      ]"
    >
      <icon
        :name="props.iconName"
        :class="[
          isRTL ? '-rotate-90' : 'rotate-0',
          'w-1/2 h-1/2 transition ease-in-out duration-500 text-white dark:text-primary-900',
        ]"
      />
    </span>

    <!-- Text content with sliding animation -->
    <span
      class="transition ease-in-out duration-500 ltr:group-hover:translate-x-1/12 rtl:group-hover:-translate-x-1/12"
    >
      <slot name="default" />
    </span>
  </u-link>
</template>
