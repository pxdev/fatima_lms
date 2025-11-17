<script lang="ts" setup>
  const props = defineProps<{
    error: any;
  }>();

  const errorTitle = computed(() => {
    if (props.error?.statusCode === 401) {
      return 'Not authorized';
    }

    if (props.error?.statusCode === 404) {
      return 'Page not found';
    }

    return 'Oops... Something went wrong';
  });

  const errorDescription = computed(() => {
    if (props.error?.statusCode === 401) {
      return 'You are not authorized to access this page.';
    }

    if (props.error?.statusCode === 404) {
      return "We couldn't find the page you were looking for, please contact a system administrator or try again later.";
    }

    return 'An error has occured. If the problem persists, please contact a system administrator or try again later.';
  });
</script>

<template>
  <div class="h-svh flex items-center">
    <div class="mx-auto text-center p-4 max-w-5xl">
      <img v-if="props.error === 404" src="/svg/404.svg" class="block max-w-[300px] mx-auto" alt="" />
      <div class="py-4">
        <h3 class="text-2xl">
          {{ errorTitle }}
        </h3>
        <p class="text-base opacity-40">
          {{ errorDescription }}
        </p>
      </div>
      <u-button label="Back to home" size="lg" variant="outline" to="/" />
    </div>
  </div>
</template>

<style></style>
