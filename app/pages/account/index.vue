<script setup>
definePageMeta({middleware: ["auth"]})
const items = [
  {
    label: 'Home',
    to: '/'
  },
  {
    label: 'Dashboard',
    to: '/account'
  }
]
</script>

<template>
  <section>
    <div class="pages py-10 border-b border-gray-200 bg-white mb-6">
      <u-container>
        <u-breadcrumb class="mb-4" :items="items"/>
        <base-heading is="h1">Profile</base-heading>
      </u-container>
    </div>

    <u-container>
      <div class="flex gap-6">

        <user-navigation/>

        <div class="flex-1 space-y-6">

        </div>

      </div>
    </u-container>

  </section>
</template>

<style scoped>

</style>
