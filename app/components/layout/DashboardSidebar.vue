<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const user = useDirectusUser()
const { profile, fetchProfile } = useProfile()
const { logout } = useDirectusAuth()

// Sidebar collapsed state
const isCollapsed = ref(false)

// Mobile sidebar open state
const isMobileOpen = ref(false)

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
    label: 'New Subscription',
    icon: 'i-heroicons-plus-circle',
    to: '/student/onboarding/course'
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
  <!-- Mobile Menu Button (shows on small screens) -->
  <button
    class="lg:hidden fixed bottom-4 left-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary-500 text-white shadow-lg"
    @click="isMobileOpen = true"
  >
    <UIcon name="i-heroicons-bars-3" class="h-6 w-6" />
  </button>

  <!-- Mobile Slideover -->
  <USlideover v-model:open="isMobileOpen" side="left">
    <template #content>
      <div class="flex h-full flex-col bg-white">
        <!-- Logo & Close -->
        <div class="flex items-center justify-between border-b border-gray-100 p-4">
          <MainLogo class="w-[140px]" />
          <UButton
            icon="i-heroicons-x-mark"
            color="neutral"
            variant="ghost"
            square
            @click="isMobileOpen = false"
          />
        </div>

        <!-- User Info -->
        <div class="flex items-center gap-3 p-4 bg-gray-50">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-500/10">
            <UIcon name="i-heroicons-user" class="h-5 w-5 text-primary-500" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-slate-900 truncate">
              {{ profile?.display_name || user?.first_name || 'User' }}
            </p>
            <UBadge :color="roleBadgeColor" variant="soft" size="xs">
              {{ roleLabel }}
            </UBadge>
          </div>
        </div>

        <!-- Navigation -->
        <div class="flex-1 overflow-y-auto p-3">
          <UNavigationMenu
            :items="mainNavItems"
            orientation="vertical"
            class="w-full"
            @click="isMobileOpen = false"
          />

          <div class="my-4 border-t border-gray-100" />

          <UNavigationMenu
            :items="commonItems"
            orientation="vertical"
            class="w-full"
            @click="isMobileOpen = false"
          />
        </div>

        <!-- Footer -->
        <div class="border-t border-gray-100 p-3 space-y-2">
          <!-- Back to Portal -->
          <UButton
            to="/"
            label="Back to Portal"
            leading-icon="i-heroicons-arrow-left"
            color="neutral"
            variant="ghost"
            block
            size="sm"
          />

          <!-- Logout -->
          <UButton
            label="Logout"
            leading-icon="i-heroicons-arrow-right-on-rectangle"
            color="error"
            variant="ghost"
            block
            size="sm"
            @click="handleLogout"
          />
        </div>
      </div>
    </template>
  </USlideover>

  <!-- Desktop Sidebar -->
  <aside
    class="hidden lg:flex flex-col bg-white border-e border-gray-200 transition-all duration-300"
    :class="isCollapsed ? 'w-[72px]' : 'w-64'"
  >
    <!-- Logo -->
    <div class="flex items-center justify-center border-b border-gray-100 p-4">
      <NuxtLink v-if="isCollapsed" to="/" class="flex h-10 w-10 items-center justify-center">
        <img alt="Logo" class="w-8" src="/images/logos/logo.svg" />
      </NuxtLink>
      <MainLogo v-else class="w-[140px]" />
    </div>

    <!-- User Info -->
    <div class="flex items-center gap-3 p-4 bg-gray-50/50" :class="isCollapsed ? 'justify-center' : ''">
      <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-500/10">
        <UIcon name="i-heroicons-user" class="h-5 w-5 text-primary-500" />
      </div>
      <div v-if="!isCollapsed" class="flex-1 min-w-0">
        <p class="font-semibold text-slate-900 truncate text-sm">
          {{ profile?.display_name || user?.first_name || 'User' }}
        </p>
        <UBadge :color="roleBadgeColor" variant="soft" size="xs">
          {{ roleLabel }}
        </UBadge>
      </div>
    </div>

    <!-- Navigation -->
    <div class="flex-1 overflow-y-auto p-3">
      <UNavigationMenu
        :collapsed="isCollapsed"
        :items="mainNavItems"
        orientation="vertical"
      />

      <div class="my-4 border-t border-gray-100" />

      <UNavigationMenu
        :collapsed="isCollapsed"
        :items="commonItems"
        orientation="vertical"
      />
    </div>

    <!-- Footer -->
    <div class="border-t border-gray-100 p-3 space-y-2">
      <!-- Back to Portal -->
      <UButton
        to="/"
        :icon="isCollapsed ? 'i-heroicons-arrow-left' : undefined"
        :label="isCollapsed ? undefined : 'Back to Portal'"
        :leading-icon="isCollapsed ? undefined : 'i-heroicons-arrow-left'"
        color="neutral"
        variant="ghost"
        :block="!isCollapsed"
        :square="isCollapsed"
        size="sm"
      />

      <!-- Collapse Toggle -->
      <UButton
        :icon="isCollapsed ? 'i-heroicons-chevron-double-right' : 'i-heroicons-chevron-double-left'"
        :label="isCollapsed ? undefined : 'Collapse'"
        color="neutral"
        variant="ghost"
        :block="!isCollapsed"
        :square="isCollapsed"
        size="sm"
        @click="isCollapsed = !isCollapsed"
      />

      <!-- Logout -->
      <UButton
        :icon="isCollapsed ? 'i-heroicons-arrow-right-on-rectangle' : undefined"
        :label="isCollapsed ? undefined : 'Logout'"
        :leading-icon="isCollapsed ? undefined : 'i-heroicons-arrow-right-on-rectangle'"
        color="error"
        variant="ghost"
        :block="!isCollapsed"
        :square="isCollapsed"
        size="sm"
        @click="handleLogout"
      />
    </div>
  </aside>
</template>
