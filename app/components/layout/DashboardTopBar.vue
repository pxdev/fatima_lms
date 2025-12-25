<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const user = useDirectusUser()
const { profile, fetchProfile } = useProfile()

// Fetch profile on mount
onMounted(() => {
  if (user.value) {
    fetchProfile()
  }
})

watch(user, (newUser) => {
  if (newUser) {
    fetchProfile()
  }
})

const userRole = computed(() => profile.value?.role || 'student')

// Student navigation items
const studentItems: NavigationMenuItem[] = [
  {
    label: 'Dashboard',
    icon: 'hugeicons:dashboard-square-02',
    to: '/student/dashboard'
  },
  {
    label: 'My Subscriptions',
    icon: 'hugeicons:book-02',
    to: '/student/subscriptions'
  },
  {
    label: 'My Sessions',
    icon: 'hugeicons:video-02',
    to: '/student/sessions'
  }
]

// Teacher navigation items
const teacherItems: NavigationMenuItem[] = [
  {
    label: 'Dashboard',
    icon: 'hugeicons:dashboard-square-02',
    to: '/teacher/dashboard'
  },
  {
    label: 'Sessions Approval',
    icon: 'hugeicons:checkmark-circle-02',
    to: '/teacher/sessions-approval'
  },
  {
    label: 'My Sessions',
    icon: 'hugeicons:video-02',
    to: '/teacher/sessions'
  },
  {
    label: 'Availability',
    icon: 'hugeicons:calendar-02',
    to: '/teacher/availability'
  }
]

// Admin navigation items
const adminItems: NavigationMenuItem[] = [
  {
    label: 'Dashboard',
    icon: 'hugeicons:dashboard-square-02',
    to: '/admin/dashboard'
  },
  {
    label: 'Subscriptions',
    icon: 'hugeicons:clipboard-check',
    to: '/admin/subscriptions'
  }
]

// Get navigation items based on role
const mainNavItems = computed(() => {
  switch (userRole.value) {
    case 'admin':
      return adminItems
    case 'teacher':
      return teacherItems
    default:
      return studentItems
  }
})
</script>

<template>
   
  <header class="sticky top-0 z-50 border-b border-slate-200 bg-white">
    <div class="mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
      <!-- Logo -->
      <div class="flex items-center">
        <NuxtLink to="/" class="flex items-center transition-opacity hover:opacity-80">
          <MainLogo class="w-[160px]" />
        </NuxtLink>
      </div>

      <!-- Navigation Menu -->
      <nav class="hidden md:flex md:items-center md:gap-2">
        <UNavigationMenu
          :items="mainNavItems"
          orientation="horizontal"
          class="flex items-center text-base"
          :ui="{
            link: {
              base: 'text-base font-medium px-4 py-2',
              active: 'text-primary-600',
              inactive: 'text-slate-700 hover:text-primary-600'
            },
            icon: {
              base: 'w-5 h-5'
            }
          }"
        />
      </nav>

      <!-- Right Side Actions -->
      <div class="flex items-center gap-4">
        <!-- Mobile Menu Button -->
        <UDropdownMenu
          :items="[
            ...mainNavItems,
            { type: 'separator' },
            {
              label: 'Back to Portal',
              icon: 'hugeicons:arrow-left-01',
              to: '/'
            }
          ]"
          class="md:hidden"
        >
          <UButton
            icon="hugeicons:menu-01"
            variant="ghost"
            color="neutral"
            square
            size="lg"
          />
        </UDropdownMenu>

        <!-- Profile Menu -->
        <ProfileMenu />
      </div>
    </div>
  </header>
</template>

