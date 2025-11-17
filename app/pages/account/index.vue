<script setup>
import { computed, onMounted, watch } from "vue";
import { useDateFormat } from "@vueuse/core";

const accountNavigation = [
  {
    id: 'dashboard',
    label: "Dashboard",
    to: "/account",
    ico: "hugeicons:home-05"
  },
  {
    id: 'profile',
    label: "My Profile",
    to: "/",
    ico: "hugeicons:user-02"
  },
  {
    id: 'learning',
    label: "My Learning",
    to: "/account/courses",
    ico: "hugeicons:book-02"
  },
  {
    id: 'billing',
    label: "Billing",
    to: "/",
    ico: "hugeicons:credit-card"
  },
  {
    id: 'affiliate',
    label: "Affiliate Program",
    to: "/",
    ico: "hugeicons:user-group"
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

        <div class="min-w-64">
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


        <div class="flex-1 space-y-6">
          <u-card>
            <h2 class="text-2xl font-bold">Welcome again <span class="text-primary">{{ user.name }}</span></h2>
          </u-card>

        </div>

      </div>
    </u-container>

  </section>
</template>

<style scoped>

</style>
