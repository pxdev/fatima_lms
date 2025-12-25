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

  // Role-specific navigation items
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
      label: 'Sessions Approval',
      icon: 'hugeicons:checkmark-circle-02',
      to: '/teacher/sessions-approval'
    })
    items.push({
      label: 'My Sessions',
      icon: 'hugeicons:video-02',
      to: '/teacher/sessions'
    })
    items.push({
      label: 'My Subscriptions',
      icon: 'hugeicons:book-02',
      to: '/teacher/subscriptions'
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
      label: 'My Subscriptions',
      icon: 'hugeicons:book-02',
      to: '/student/subscriptions'
    })
    items.push({
      label: 'My Sessions',
      icon: 'hugeicons:video-02',
      to: '/student/sessions'
    })
    items.push({
      label: 'New Subscription',
      icon: 'hugeicons:add-circle',
      to: '/student/subscribe'
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

  // Back to Portal
  items.push({
    label: 'Back to Portal',
    icon: 'hugeicons:arrow-left-01',
    to: '/'
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
    <UDropdownMenu
      v-if="user"
      size="lg"
      arrow
      :items="menuItems"
      :ui="{
        content: 'w-64 text-base',
        item: {
          base: 'text-base py-2.5 px-3',
          icon: {
            base: 'w-5 h-5'
          }
        }
      }"
    >
      <UButton variant="ghost" class="flex items-center gap-3 px-3 py-2">
        <UAvatar
          :alt="profile?.display_name || user?.first_name || 'User'"
          icon="hugeicons:user-02"
          size="md"
        />
        <div class="hidden sm:flex flex-col items-start">
          <span class="text-base font-semibold">
            {{ profile?.display_name || user?.first_name || 'User' }}
          </span>
          <UBadge :color="roleBadgeColor" variant="soft" size="sm">
            {{ userRole }}
          </UBadge>
        </div>
        <UIcon name="hugeicons:arrow-down-01" class="h-5 w-5 text-slate-400" />
      </UButton>
    </UDropdownMenu>

    <UButton
      v-else
      color="primary"
      size="lg"
      to="/auth/login"
      class="text-base font-medium px-6 py-2.5"
    >
      Login
    </UButton>
  </div>
</template>

<style scoped>

</style>
