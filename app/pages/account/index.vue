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
        <base-heading is="h1">Dashboard</base-heading>
      </u-container>
    </div>

    <u-container>
      <div class="grid lg:grid-cols-12 gap-6">

        <user-navigation/>

        <div class="flex-1 lg:col-span-9 space-y-6">

          <u-card>
           </u-card>
        </div>

      </div>
    </u-container>

  </section>
</template>

<style scoped>

</style>
