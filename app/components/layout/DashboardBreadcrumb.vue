<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'

const route = useRoute()
const { profile } = useProfile()

const userRole = computed(() => profile.value?.role || 'student')

// Define breadcrumb mappings
const breadcrumbMap: Record<string, { label: string; icon?: string }> = {
  // Student routes
  '/student/dashboard': { label: 'Dashboard', icon: 'i-heroicons-home' },
  '/student/subscriptions': { label: 'My Subscriptions', icon: 'i-heroicons-book-open' },
  '/student/sessions': { label: 'My Sessions', icon: 'i-heroicons-video-camera' },
  '/student/subscribe': { label: 'New Subscription', icon: 'i-heroicons-plus-circle' },
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
  '/account/profile': { label: 'Profile' },
  '/account': { label: 'Account' }
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
  
  // Student routes
  if (segments[0] === 'student') {
    if (segments[1] === 'subscriptions') {
      if (segments[2]) {
        // Dynamic subscription ID
        items.push({ label: 'My Subscriptions', to: '/student/subscriptions' })
        items.push({ label: 'Subscription Details' })
        
        if (segments[3] === 'schedule') {
          items.push({ label: 'Schedule Sessions' })
        } else if (segments[3] === 'sessions') {
          items.push({ label: 'Sessions' })
        } else if (segments[3] === 'renew') {
          items.push({ label: 'Renew Subscription' })
        }
      } else {
        // Just /student/subscriptions
        items.push({ label: 'My Subscriptions' })
      }
    } else if (segments[1] === 'sessions') {
      items.push({ label: 'My Sessions', to: '/student/sessions' })
      
      if (segments[2] && segments[3] === 'rate') {
        items.push({ label: 'Rate Session' })
      }
    } else if (segments[1] === 'subscribe') {
      items.push({ label: 'New Subscription' })
    } else if (segments[1] === 'onboarding') {
      if (segments[2] === 'course') {
        items.push({ label: 'Select Course' })
      } else if (segments[2] === 'package') {
        items.push({ label: 'Select Package' })
      } else if (segments[2] === 'confirm') {
        items.push({ label: 'Confirm Subscription' })
      }
    }
  }
  // Teacher routes
  else if (segments[0] === 'teacher') {
    if (segments[1] === 'subscriptions' && segments[2]) {
      items.push({ label: 'Subscriptions', to: '/teacher/dashboard' })
      items.push({ label: 'Student Details' })
    }
  }
  // Admin routes
  else if (segments[0] === 'admin') {
    if (segments[1] === 'subscriptions' && segments[2]) {
      items.push({ label: 'Subscriptions', to: '/admin/subscriptions' })
      items.push({ label: 'Details' })
    }
  }
  // Account routes
  else if (segments[0] === 'account') {
    if (segments[1] === 'profile') {
      items.push({ label: 'My Profile' })
    }
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
