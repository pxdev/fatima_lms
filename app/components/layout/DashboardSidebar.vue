<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const user = useDirectusUser()
const { profile, fetchProfile } = useProfile()
const { logout } = useDirectusAuth()

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
    icon: 'i-heroicons-home',
    to: '/student/dashboard'
  },
  {
    label: 'My Subscriptions',
    icon: 'i-heroicons-book-open',
    to: '/student/subscriptions'
  },
  {
    label: 'My Sessions',
    icon: 'i-heroicons-video-camera',
    to: '/student/sessions'
  }
]

// Teacher navigation items
const teacherItems: NavigationMenuItem[] = [
  {
    label: 'Dashboard',
    icon: 'i-heroicons-home',
    to: '/teacher/dashboard'
  },
  {
    label: 'My Sessions',
    icon: 'i-heroicons-video-camera',
    to: '/teacher/sessions'
  },
  {
    label: 'Availability',
    icon: 'i-heroicons-calendar',
    to: '/teacher/availability'
  }
]

// Admin navigation items
const adminItems: NavigationMenuItem[] = [
  {
    label: 'Dashboard',
    icon: 'i-heroicons-home',
    to: '/admin/dashboard'
  },
  {
    label: 'Subscriptions',
    icon: 'i-heroicons-clipboard-document-list',
    to: '/admin/subscriptions'
  }
]

// Common navigation items
const commonItems: NavigationMenuItem[] = [
  {
    label: 'My Profile',
    icon: 'i-heroicons-user-circle',
    to: '/account/profile'
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

// Role badge color
const roleBadgeColor = computed<'error' | 'primary' | 'success'>(() => {
  switch (userRole.value) {
    case 'admin': return 'error'
    case 'teacher': return 'primary'
    default: return 'success'
  }
})

const roleLabel = computed(() => {
  switch (userRole.value) {
    case 'admin': return 'Admin'
    case 'teacher': return 'Teacher'
    default: return 'Student'
  }
})

async function handleLogout() {
  await logout()
  navigateTo('/')
}
</script>

<template>
  <UDashboardSidebar collapsible>
    <!-- Header with Logo -->
    <template #header="{ collapsed }">
      <NuxtLink v-if="collapsed" to="/" class="flex h-10 w-10 items-center justify-center">
        <img alt="Logo" class="w-8" src="/images/logos/logo.svg" />
      </NuxtLink>
      <MainLogo v-else class="w-[140px]" />
    </template>

    <!-- Navigation -->
    <template #default="{ collapsed }">
 

      <!-- Main Navigation -->
      <UNavigationMenu     
        :collapsed="collapsed"
        :items="mainNavItems"
        orientation="vertical"
      />

 
      <!-- Secondary Navigation -->
      <UNavigationMenu
        :collapsed="collapsed"
        :items="commonItems"
        orientation="vertical"
      />
    </template>

    <!-- Footer -->
    <template #footer="{ collapsed }">
      <div class="space-y-1">
        <!-- Back to Portal -->
        <UButton
          to="/"
          :icon="collapsed ? 'i-heroicons-arrow-left' : undefined"
          :label="collapsed ? undefined : 'Back to Portal'"
          :leading-icon="collapsed ? undefined : 'i-heroicons-arrow-left'"
          color="neutral"
          variant="ghost"
          :block="!collapsed"
          :square="collapsed"
          size="sm"
        />

        <!-- Logout -->
        <UButton
          :icon="collapsed ? 'i-heroicons-arrow-right-on-rectangle' : undefined"
          :label="collapsed ? undefined : 'Logout'"
          :leading-icon="collapsed ? undefined : 'i-heroicons-arrow-right-on-rectangle'"
          color="error"
          variant="ghost"
          :block="!collapsed"
          :square="collapsed"
          size="sm"
          @click="handleLogout"
        />
      </div>
    </template>
  </UDashboardSidebar>
</template>
