<script setup lang="ts">
const { profile, fetchProfile } = useProfile()

onMounted(() => {
  fetchProfile()
})

const userRole = computed(() => profile.value?.role || 'student')

// Student navigation modules
const studentModules = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'View your learning overview',
    icon: 'hugeicons:dashboard-square-02',
    to: '/student/dashboard',
    color: 'primary'
  },
  {
    id: 'subscriptions',
    title: 'My Subscriptions',
    description: 'Manage your course subscriptions',
    icon: 'hugeicons:book-02',
    to: '/student/subscriptions',
    color: 'info'
  },
  {
    id: 'sessions',
    title: 'My Sessions',
    description: 'View and join your sessions',
    icon: 'hugeicons:video-02',
    to: '/student/sessions',
    color: 'success'
  },
  {
    id: 'subscribe',
    title: 'New Subscription',
    description: 'Subscribe to a new course',
    icon: 'hugeicons:add-circle',
    to: '/student/subscribe',
    color: 'warning'
  }
]

// Teacher navigation modules
const teacherModules = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'View your teaching overview',
    icon: 'hugeicons:dashboard-square-02',
    to: '/teacher/dashboard',
    color: 'primary'
  },
  {
    id: 'sessions-approval',
    title: 'Sessions Approval',
    description: 'Approve student session requests',
    icon: 'hugeicons:checkmark-circle-02',
    to: '/teacher/sessions-approval',
    color: 'warning'
  },
  {
    id: 'sessions',
    title: 'My Sessions',
    description: 'View and manage your sessions',
    icon: 'hugeicons:video-02',
    to: '/teacher/sessions',
    color: 'success'
  },
  {
    id: 'subscriptions',
    title: 'My Subscriptions',
    description: 'Manage student subscriptions',
    icon: 'hugeicons:book-02',
    to: '/teacher/subscriptions',
    color: 'info'
  },
  {
    id: 'availability',
    title: 'Availability',
    description: 'Set your available time slots',
    icon: 'hugeicons:calendar-02',
    to: '/teacher/availability',
    color: 'purple'
  }
]

// Admin navigation modules
const adminModules = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Manage the platform',
    icon: 'hugeicons:dashboard-square-02',
    to: '/admin/dashboard',
    color: 'primary'
  },
  {
    id: 'subscriptions',
    title: 'Subscriptions',
    description: 'Manage all subscriptions',
    icon: 'hugeicons:clipboard-check',
    to: '/admin/subscriptions',
    color: 'info'
  }
]

const modules = computed(() => {
  switch (userRole.value) {
    case 'admin':
      return adminModules
    case 'teacher':
      return teacherModules
    default:
      return studentModules
  }
})
</script>

<template>
  <div class="dashboard-navigation">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-slate-900 mb-2">Dashboard Modules</h2>
      <p class="text-slate-600">Navigate to different sections of your dashboard</p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <UCard
        v-for="module in modules"
        :key="module.id"
        :to="module.to"
        class="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
      >
        <div class="flex flex-col items-center text-center p-6">
          <!-- Icon -->
          <div
            class="flex h-16 w-16 items-center justify-center rounded-xl mb-4 transition-colors duration-200"
            :class="{
              'bg-primary-100 group-hover:bg-primary-200': module.color === 'primary',
              'bg-info-100 group-hover:bg-info-200': module.color === 'info',
              'bg-success-100 group-hover:bg-success-200': module.color === 'success',
              'bg-warning-100 group-hover:bg-warning-200': module.color === 'warning',
              'bg-purple-100 group-hover:bg-purple-200': module.color === 'purple'
            }"
          >
            <UIcon
              :name="module.icon"
              class="h-8 w-8"
              :class="{
                'text-primary-600': module.color === 'primary',
                'text-info-600': module.color === 'info',
                'text-success-600': module.color === 'success',
                'text-warning-600': module.color === 'warning',
                'text-purple-600': module.color === 'purple'
              }"
            />
          </div>

          <!-- Title -->
          <h3 class="text-lg font-semibold text-slate-900 mb-2">
            {{ module.title }}
          </h3>

          <!-- Description -->
          <p class="text-sm text-slate-600">
            {{ module.description }}
          </p>

          <!-- Arrow Icon -->
          <div class="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <UIcon
              name="hugeicons:arrow-right-01"
              class="h-5 w-5 text-slate-400"
            />
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<style scoped>
.dashboard-navigation {
  padding: 1.5rem 0;
}
</style>





