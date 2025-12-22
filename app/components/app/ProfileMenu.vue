<script setup>
// ===============================
// Auth Handling
// ===============================
const user = useDirectusUser()
const { logout } = useDirectusAuth()
const { profile, fetchProfile } = useProfile()

// Fetch profile on mount to get role
onMounted(() => {
  if (user.value) {
    fetchProfile()
  }
})

// Watch for user changes
watch(user, (newUser) => {
  if (newUser) {
    fetchProfile()
  }
})

const userRole = computed(() => profile.value?.role || 'student')

// Role-based menu items
const menuItems = computed(() => {
  const items = []

  // Role-specific dashboard
  if (userRole.value === 'admin') {
    items.push({
      label: 'Admin Dashboard',
      icon: 'hugeicons:dashboard-square-02',
      to: '/admin/dashboard'
    })
    items.push({
      label: 'Manage Subscriptions',
      icon: 'hugeicons:clipboard-check',
      to: '/admin/subscriptions'
    })
  } else if (userRole.value === 'teacher') {
    items.push({
      label: 'Teacher Dashboard',
      icon: 'hugeicons:dashboard-square-02',
      to: '/teacher/dashboard'
    })
    items.push({
      label: 'My Sessions',
      icon: 'hugeicons:video-02',
      to: '/teacher/sessions'
    })
    items.push({
      label: 'Availability',
      icon: 'hugeicons:calendar-02',
      to: '/teacher/availability'
    })
  } else {
    // Student
    items.push({
      label: 'My Dashboard',
      icon: 'hugeicons:dashboard-square-02',
      to: '/student/dashboard'
    })
    items.push({
      label: 'New Subscription',
      icon: 'hugeicons:add-circle',
      to: '/student/onboarding/course'
    })
  }

  // Common items - separator
  items.push({ type: 'separator' })

  // Profile for all users
  items.push({
    label: 'My Profile',
    icon: 'hugeicons:user-02',
    to: '/account/profile'
  })

  // Logout
  items.push({ type: 'separator' })
  items.push({
    label: 'Logout',
    icon: 'hugeicons:logout-01',
    color: 'error',
    onClick: async () => {
      await logout()
      navigateTo('/')
    }
  })

  return items
})

// Role badge color
const roleBadgeColor = computed(() => {
  switch (userRole.value) {
    case 'admin': return 'error'
    case 'teacher': return 'primary'
    default: return 'success'
  }
})
</script>

<template>
  <div>
    <u-dropdown-menu
      v-if="user"
      size="sm"
      arrow
      :items="menuItems"
      :ui="{
        content: 'w-56'
      }"
    >
      <u-button variant="ghost" class="flex items-center gap-2 px-2">
        <u-avatar
          :alt="user?.first_name || 'User'"
          icon="i-heroicons-user"
          size="sm"
        />
        <div class="hidden sm:flex flex-col items-start">
          <span class="text-sm font-medium">{{ user?.first_name || 'User' }}</span>
          <u-badge :color="roleBadgeColor" variant="soft" size="xs">
            {{ userRole }}
          </u-badge>
        </div>
        <u-icon name="i-heroicons-chevron-down" class="h-4 w-4 text-slate-400" />
      </u-button>
    </u-dropdown-menu>

    <u-button
      v-else
      color="primary"
      size="xl"
      class="rounded-full py-3 px-6"
      to="/auth/login"
    >
      Students Login
    </u-button>
  </div>
</template>

<style scoped>

</style>
