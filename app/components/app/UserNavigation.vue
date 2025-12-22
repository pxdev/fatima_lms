<script setup>
const { profile } = useProfile()

const userRole = computed(() => profile.value?.role || 'student')

// Student navigation - format for UNavigationMenu
const studentNavigation = [
  {
    label: 'Dashboard',
    to: '/student/dashboard',
    icon: 'i-heroicons-home'
  },
  {
    label: 'My Subscriptions',
    to: '/student/dashboard',
    icon: 'i-heroicons-book-open'
  },
  {
    label: 'New Subscription',
    to: '/student/onboarding/course',
    icon: 'i-heroicons-plus-circle'
  },
  {
    label: 'My Profile',
    to: '/account/profile',
    icon: 'i-heroicons-user-circle'
  }
]

// Teacher navigation
const teacherNavigation = [
  {
    label: 'Dashboard',
    to: '/teacher/dashboard',
    icon: 'i-heroicons-home'
  },
  {
    label: 'My Sessions',
    to: '/teacher/sessions',
    icon: 'i-heroicons-video-camera'
  },
  {
    label: 'Availability',
    to: '/teacher/availability',
    icon: 'i-heroicons-calendar'
  },
  {
    label: 'My Profile',
    to: '/account/profile',
    icon: 'i-heroicons-user-circle'
  }
]

// Admin navigation
const adminNavigation = [
  {
    label: 'Dashboard',
    to: '/admin/dashboard',
    icon: 'i-heroicons-home'
  },
  {
    label: 'All Subscriptions',
    to: '/admin/subscriptions',
    icon: 'i-heroicons-clipboard-document-list'
  },
  {
    label: 'My Profile',
    to: '/account/profile',
    icon: 'i-heroicons-user-circle'
  }
]

// Get navigation based on role
const accountNavigation = computed(() => {
  switch (userRole.value) {
    case 'admin':
      return adminNavigation
    case 'teacher':
      return teacherNavigation
    default:
      return studentNavigation
  }
})
</script>

<template>
  <div class="lg:col-span-3">
    <UCard>
      <UNavigationMenu
        orientation="vertical"
        :items="accountNavigation"
        class="w-full"
      />
    </UCard>
  </div>
</template>
