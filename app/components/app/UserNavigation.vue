<script setup>
const accountNavigation = [
  {
    id: 'dashboard',
    label: "Dashboard",
    to: "/account",
    ico: "hugeicons:home-05"
  },
  {
    id: 'profile',
    label: "Student Profile",
    to: "/account/profile",
    ico: "hugeicons:user-02"
  },
  {
    id: 'learning',
    label: "My Learning",
    to: "/account/learning",
    ico: "hugeicons:book-02"
  },
  {
    id: 'billing',
    label: "Billing",
    to: "/account/billing",
    ico: "hugeicons:credit-card"
  },
  {
    id: 'affiliate',
    label: "Affiliate Program",
    to: "/account/affiliate",
    ico: "hugeicons:user-group"
  }
]

</script>

<template>
  <div class="lg:col-span-3">
    <u-card>
      <ul class="space-y-2">
        <li v-for="nav in accountNavigation" :key="nav.id">
          <nuxt-link
              active-class="bg-primary-500 hover:bg-primary-600 text-white font-semibold"
              class="flex items-center text-gray-500 rounded gap-2 px-2 py-3 hover:bg-primary-200" :to="nav.to">
            <u-icon :name="nav.ico" class="w-5 h-5"/>
            {{ nav.label }}
          </nuxt-link>
        </li>
      </ul>
    </u-card>
  </div>
</template>

<style scoped>

</style>