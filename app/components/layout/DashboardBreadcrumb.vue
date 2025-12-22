<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'

const route = useRoute()
const { profile } = useProfile()

const userRole = computed(() => profile.value?.role || 'student')

// Define breadcrumb mappings
const breadcrumbMap: Record<string, { label: string; icon?: string }> = {
  // Student routes
  '/student/dashboard': { label: 'Dashboard', icon: 'i-heroicons-home' },
  '/student/onboarding/course': { label: 'Select Course' },
  '/student/onboarding/package': { label: 'Select Package' },
  '/student/onboarding/confirm': { label: 'Confirm' },
  
  // Teacher routes
  '/teacher/dashboard': { label: 'Dashboard', icon: 'i-heroicons-home' },
  '/teacher/sessions': { label: 'Sessions' },
  '/teacher/availability': { label: 'Availability' },
  
  // Admin routes
  '/admin/dashboard': { label: 'Dashboard', icon: 'i-heroicons-home' },
  '/admin/subscriptions': { label: 'Subscriptions' },
  
  // Common routes
  '/account/profile': { label: 'Profile' }
}

// Get base path for role
const basePath = computed(() => {
  switch (userRole.value) {
    case 'admin': return '/admin/dashboard'
    case 'teacher': return '/teacher/dashboard'
    default: return '/student/dashboard'
  }
})

// Build breadcrumb items
const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
  const path = route.path
  const items: BreadcrumbItem[] = []
  
  // Check for exact match first
  const exactMatch = breadcrumbMap[path]
  if (exactMatch) {
    // If it's the dashboard, just show Dashboard
    if (path === basePath.value) {
      items.push({ label: exactMatch.label, icon: exactMatch.icon })
    } else {
      // Add home/dashboard first
      items.push({ label: 'Home', icon: 'i-heroicons-home', to: basePath.value })
      items.push({ label: exactMatch.label })
    }
    return items
  }
  
  // Handle dynamic routes
  const segments = path.split('/').filter(Boolean)
  
  // Add home
  items.push({ label: 'Home', icon: 'i-heroicons-home', to: basePath.value })
  
  if (segments[0] === 'student' && segments[1] === 'subscriptions' && segments[2]) {
    items.push({ label: 'Subscription', to: `/student/subscriptions/${segments[2]}` })
    
    if (segments[3] === 'schedule') {
      items.push({ label: 'Schedule' })
    } else if (segments[3] === 'sessions') {
      items.push({ label: 'Sessions' })
    } else if (segments[3] === 'renew') {
      items.push({ label: 'Renew' })
    } else if (!segments[3]) {
      items[items.length - 1] = { label: 'Subscription' }
    }
  } else if (segments[0] === 'student' && segments[1] === 'sessions' && segments[2]) {
    if (segments[3] === 'rate') {
      items.push({ label: 'Rate Session' })
    }
  } else if (segments[0] === 'teacher' && segments[1] === 'subscriptions' && segments[2]) {
    items.push({ label: 'Student Details' })
  } else if (segments[0] === 'admin' && segments[1] === 'subscriptions' && segments[2]) {
    items.push({ label: 'Subscriptions', to: '/admin/subscriptions' })
    items.push({ label: 'Details' })
  }
  
  return items
})
</script>

<template>
  <UBreadcrumb 
    :items="breadcrumbItems" 
    class="mb-6"
    :ui="{
      item: 'text-sm',
      link: 'text-gray-500 hover:text-primary-500',
      linkActive: 'text-gray-900 font-medium'
    }"
  />
</template>
