<script setup>
const {getItems} = useDirectusItems();

// ===============================
// Navigation
// ===============================
// const navLinks = [
//   {id: 1, label: ('Home'), to: ('/')},
//   {id: 2, label: ('About Us'), to: '/about'},
//   {
//     id: 3, label: ('Courses'),
//     children: [
//       {id: 31, label: ('Beginner'), to: '/'},
//       {id: 32, label: ('Intermediate'), to: '/'},
//       {id: 33, label: ('Advanced'), to: '/'},
//     ]
//   },
//   {id: 4, label: ('Blog'), to: '/blog'},
//   {id: 5, label: ('Contact Us'), to: '/contact'},
// ]

const mobileMenuOpen = ref(false)


const handleNavClick = () => (mobileMenuOpen.value = false)

const {data: navLinks} = await useAsyncData("navigation", () => getItems({
  collection: 'navigation',
  params: {
    fields: ['id', 'label', 'to', 'is_parent', 'status', 'children.id', 'children.label', 'children.to', 'children.is_parent', 'children.status'],
    filter: {
      is_parent: {
        _eq: true
      }
    },
    sort: ['order']
  },

}))

</script>

<template>


  <u-slideover v-model:open="mobileMenuOpen">
    <template #content>
      <div class="h-svh flex flex-col px-4">
        <!-- Header -->
        <div class="flex items-center justify-between py-4">
          <main-logo class="w-[160px]"/>

          <u-button
              class="rounded-full h-[40px] w-[40px]"
              variant="soft"
              @click="handleNavClick"
          >
            <icon name="hugeicons:cancel-01" class="w-6 h-6"/>
          </u-button>
        </div>

        <!-- Navigation Links -->
        <div class="flex-1 overflow-y-auto">
          <u-navigation-menu
              orientation="vertical"
              variant="link"
              :items="navLinks"
              class="w-full justify-center mb-6"
              @click="handleNavClick"
          />
        </div>

        <!-- Footer -->
        <div class="flex justify-between items-center py-4 border-t border-gray-200">


        </div>
      </div>
    </template>
  </u-slideover>
  <header class="sticky top-0 z-50  bg-white">
    <u-container>
      <div class="flex justify-between items-center py-4">
        <!-- Logo -->
        <main-logo class="w-[160px] dark:invert"/>

        <!-- Desktop Nav -->
        <nav class="hidden lg:flex mx-auto gap-6 text-lg">
          <u-navigation-menu variant="link" :items="navLinks"/>
        </nav>

        <!-- Actions -->
        <div class="hidden lg:flex items-center gap-4">

          <profile-menu/>


        </div>

        <!-- Mobile toggle -->
        <div class="lg:hidden flex">
          <u-link variant="link" @click="mobileMenuOpen = true">
            <icon name="hugeicons:menu-04" class="h-8 w-8"/>
          </u-link>
        </div>
      </div>
    </u-container>
  </header>
</template>

<style scoped></style>
