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
    size?: string; // Button size classes for dimensions
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
    Fill Arrow Button with animated hover effects:
    - Text slides appropriately on hover (left in LTR, right in RTL)
    - Background grows on hover to reveal text
    - Button maintains circular icon with proper alignment
  -->
  <nuxt-link :to="localePath(props.to)" class="group relative inline-flex items-center gap-2" variant="ghost">
    <!-- Expandable background that reveals on hover -->
    <span
      :class="[
        'bg-primary-500 dark:bg-primary-400 absolute duration-500 rounded-3xl group-hover:w-[110%] transition-all ease-in-out',
        props.size,
      ]"
    ></span>

    <!-- Icon circle container -->
    <span
      :class="[
        'ltr:group-hover:rotate-45 rtl:group-hover:-rotate-45 transition ease-in-out duration-500  bg-primary-500 dark:bg-primary-400 flex items-center justify-center rounded-full ',
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

    <!-- Text content that slides appropriately on hover based on direction -->
    <span
      :class="[
        'transition ease-in-out duration-500 group-hover:text-white dark:group-hover:text-primary-900',
        isRTL ? 'group-hover:translate-x-2' : 'group-hover:-translate-x-2',
      ]"
    >
      <slot name="default" />
    </span>
  </nuxt-link>
</template>

<style scoped></style>
