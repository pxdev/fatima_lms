<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

useSeoMeta({
  title: 'My Subscriptions',
  description: 'View and manage your subscriptions'
})

const { profile, fetchProfile, isLoading: profileLoading } = useProfile()
const { subscriptions, fetchMySubscriptions, getStatusColor, isLoading: subsLoading } = useSubscriptions()
const { courses, fetchCourses, getCourseById } = useCourses()
const { packages, fetchPackages, getPackageById } = usePackages()

const isLoading = computed(() => profileLoading.value || subsLoading.value)
const expandedCards = ref<Set<string>>(new Set())
const activeFilter = ref<string>('all')

// DRY: Status configuration map
const STATUS_CONFIG = {
  active: { label: 'Active', icon: 'i-heroicons-rocket-launch', color: 'primary', bg: 'bg-primary-50', border: 'border-primary-200' },
  teacher_assigned: { label: 'Teacher Assigned', icon: 'i-heroicons-user-plus', color: 'primary', bg: 'bg-primary-50', border: 'border-primary-200' },
  payment_received: { label: 'Payment Received', icon: 'i-heroicons-check-badge', color: 'success', bg: 'bg-green-50', border: 'border-green-200' },
  pending_payment: { label: 'Pending Payment', icon: 'i-heroicons-arrow-path', color: 'warning', bg: 'bg-blue-50', border: 'border-blue-200' },
  draft: { label: 'Draft', icon: 'i-heroicons-banknotes', color: 'warning', bg: 'bg-amber-50', border: 'border-amber-200' },
  completed: { label: 'Completed', icon: 'i-heroicons-trophy', color: 'success', bg: 'bg-green-50', border: 'border-green-200' },
  cancelled: { label: 'Cancelled', icon: 'i-heroicons-x-circle', color: 'error', bg: 'bg-red-50', border: 'border-red-200' }
} as const

onMounted(async () => {
  await Promise.all([
    fetchProfile(),
    fetchCourses(),
    fetchPackages()
  ])
  
  if (profile.value?.id) {
    await fetchMySubscriptions(profile.value.id)
  }
})

// DRY: Reusable computed properties
const getSubscriptionCourse = (subscription: any) => getCourseById(subscription.course)
const getSubscriptionPackage = (subscription: any) => getPackageById(subscription.package)

const getSessionsProgress = (subscription: any) => {
  const completed = subscription.sessions_total - subscription.sessions_remaining
  const total = subscription.sessions_total
  return {
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    completed,
    total
  }
}

const getStatusConfig = (status: string) => {
  return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || {
    label: status.replace(/_/g, ' '),
    icon: 'i-heroicons-book-open',
    color: 'neutral',
    bg: 'bg-slate-50',
    border: 'border-slate-200'
  }
}

// Group subscriptions by status
const groupedSubscriptions = computed(() => {
  const groups: Record<string, any[]> = {}
  
  subscriptions.value.forEach(sub => {
    const status = sub.status
    if (!groups[status]) {
      groups[status] = []
    }
    groups[status].push(sub)
  })
  
  return groups
})

// Filter subscriptions
const filteredSubscriptions = computed(() => {
  if (activeFilter.value === 'all') {
    return subscriptions.value
  }
  return subscriptions.value.filter(sub => {
    if (activeFilter.value === 'active') {
      return ['active', 'teacher_assigned'].includes(sub.status)
    }
    return sub.status === activeFilter.value
  })
})

// Get filter counts
const filterCounts = computed(() => {
  const counts: Record<string, number> = { all: subscriptions.value.length }
  
  Object.keys(STATUS_CONFIG).forEach(status => {
    counts[status] = subscriptions.value.filter(s => s.status === status).length
  })
  
  counts.active = subscriptions.value.filter(s => ['active', 'teacher_assigned'].includes(s.status)).length
  
  return counts
})

function toggleCard(subscriptionId: string) {
  if (expandedCards.value.has(subscriptionId)) {
    expandedCards.value.delete(subscriptionId)
  } else {
    expandedCards.value.add(subscriptionId)
  }
}

function isExpanded(subscriptionId: string) {
  return expandedCards.value.has(subscriptionId)
}
</script>

<template>
  <div>
    <!-- Breadcrumbs -->
    <UBreadcrumb 
      :items="[
        { label: 'Home', icon: 'i-heroicons-home', to: '/student/dashboard' },
        { label: 'My Subscriptions' }
      ]" 
      class="mb-6"
    />

    <!-- Header -->
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">My Subscriptions</h1>
        <p class="mt-1 text-slate-600">View and manage all your learning subscriptions</p>
      </div>
      <UButton
        color="primary"
        size="xl"
        to="/student/subscribe"
      >
        <UIcon name="i-heroicons-plus" class="mr-2 h-5 w-5" />
        Add New Subscription
      </UButton>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="space-y-4">
      <USkeleton v-for="i in 5" :key="i" class="h-32 w-full rounded-xl" />
    </div>

    <!-- Empty State -->
    <UCard v-else-if="subscriptions.length === 0" class="py-16 text-center">
      <div class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
        <UIcon name="i-heroicons-book-open" class="h-10 w-10 text-slate-400" />
      </div>
      <h3 class="mt-6 text-xl font-semibold text-slate-900">No Subscriptions Yet</h3>
      <p class="mt-2 text-slate-600">Start your learning journey by creating a new subscription.</p>
      <UButton
        color="primary"
        size="xl"
        class="mt-6"
        to="/student/subscribe"
      >
        <UIcon name="i-heroicons-plus" class="mr-2 h-5 w-5" />
        Create Your First Subscription
      </UButton>
    </UCard>

    <!-- Subscriptions Content -->
    <div v-else>
      <!-- Filter Tabs -->
      <div class="mb-6 flex flex-wrap gap-2">
        <UButton
          v-for="filter in [
            { key: 'all', label: 'All' },
            { key: 'active', label: 'Active' },
            { key: 'teacher_assigned', label: 'Assigned' },
            { key: 'pending_payment', label: 'Pending' },
            { key: 'draft', label: 'Draft' },
            { key: 'completed', label: 'Completed' }
          ]"
          :key="filter.key"
          :color="activeFilter === filter.key ? 'primary' : 'neutral'"
          :variant="activeFilter === filter.key ? 'solid' : 'outline'"
          size="sm"
          @click="activeFilter = filter.key"
        >
          {{ filter.label }}
          <UBadge 
            v-if="filterCounts[filter.key] > 0" 
            :color="activeFilter === filter.key ? 'white' : 'primary'" 
            variant="soft" 
            class="ml-2"
          >
            {{ filterCounts[filter.key] }}
          </UBadge>
        </UButton>
      </div>

      <!-- Subscriptions List -->
      <div class="space-y-3">
        <UCard
          v-for="(sub, index) in filteredSubscriptions"
          :key="sub.id"
          class="group cursor-pointer transition-all duration-300"
          :class="getStatusConfig(sub.status).border"
          @click="toggleCard(sub.id)"
        >
          <!-- Main Card Content -->
          <div class="flex items-start gap-4">
            <!-- Status Icon -->
            <div 
              class="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl transition-transform duration-300"
              :class="[
                getStatusConfig(sub.status).bg,
                isExpanded(sub.id) ? 'scale-110' : 'group-hover:scale-105'
              ]"
            >
              <UIcon 
                :name="getStatusConfig(sub.status).icon" 
                class="h-8 w-8"
                :class="`text-${getStatusConfig(sub.status).color}-600`"
              />
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1">
                  <div class="flex items-center gap-3 flex-wrap">
                    <h3 class="text-lg font-semibold text-slate-900">
                      {{ getSubscriptionCourse(sub)?.label || 'Course' }}
                    </h3>
                    <UBadge
                      :color="getStatusColor(sub.status)"
                      variant="soft"
                      size="sm"
                    >
                      {{ getStatusConfig(sub.status).label }}
                    </UBadge>
                  </div>
                  <p class="mt-1 text-sm text-slate-600">
                    {{ getSubscriptionPackage(sub)?.label || 'Package' }}
                  </p>
                </div>

                <!-- Action Button -->
                <UButton
                  :color="sub.status === 'draft' ? 'warning' : 'primary'"
                  :variant="sub.status === 'draft' ? 'solid' : 'outline'"
                  size="sm"
                  @click.stop
                  :to="`/student/subscriptions/${sub.id}`"
                >
                  <UIcon 
                    :name="sub.status === 'draft' ? 'i-heroicons-banknotes' : 'i-heroicons-arrow-right'" 
                    class="h-4 w-4" 
                  />
                </UButton>
              </div>

              <!-- Quick Stats -->
              <div class="mt-3 grid grid-cols-3 gap-4">
                <div class="flex items-center gap-2">
                  <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50">
                    <UIcon name="i-heroicons-book-open" class="h-4 w-4 text-primary-600" />
                  </div>
                  <div>
                    <p class="text-xs text-slate-500">Remaining</p>
                    <p class="text-sm font-semibold text-slate-900">{{ sub.sessions_remaining }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                    <UIcon name="i-heroicons-arrow-path" class="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p class="text-xs text-slate-500">Postpones</p>
                    <p class="text-sm font-semibold text-amber-600">{{ sub.postpone_remaining }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                    <UIcon name="i-heroicons-calendar" class="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p class="text-xs text-slate-500">Weeks</p>
                    <p class="text-sm font-semibold text-slate-900">{{ sub.weeks_total }}</p>
                  </div>
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="mt-4">
                <div class="mb-2 flex items-center justify-between text-xs">
                  <span class="text-slate-600">Sessions Progress</span>
                  <span class="font-semibold text-slate-900">
                    {{ getSessionsProgress(sub).completed }} / {{ getSessionsProgress(sub).total }}
                    ({{ getSessionsProgress(sub).percentage }}%)
                  </span>
                </div>
                <div class="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    class="h-full rounded-full bg-primary-600 transition-all duration-700 ease-out"
                    :style="{ width: `${getSessionsProgress(sub).percentage}%` }"
                  />
                </div>
              </div>
            </div>

            <!-- Expand Icon -->
            <div class="flex-shrink-0">
              <UIcon 
                name="i-heroicons-chevron-down" 
                class="h-5 w-5 text-slate-400 transition-transform duration-300"
                :class="{ 'rotate-180': isExpanded(sub.id) }"
              />
            </div>
          </div>

          <!-- Expanded Details -->
          <div 
            v-show="isExpanded(sub.id)"
            class="mt-4 border-t border-slate-200 pt-4"
          >
            <div class="grid gap-4 sm:grid-cols-2">
              <!-- Course Details -->
              <div class="space-y-2">
                <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">Course Details</p>
                <div class="space-y-1">
                  <p class="text-sm text-slate-900">
                    <span class="font-medium">Course:</span> {{ getSubscriptionCourse(sub)?.label || 'N/A' }}
                  </p>
                  <p class="text-sm text-slate-600">
                    <span class="font-medium">Package:</span> {{ getSubscriptionPackage(sub)?.label || 'N/A' }}
                  </p>
                </div>
              </div>

              <!-- Subscription Stats -->
              <div class="space-y-2">
                <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">Statistics</p>
                <div class="space-y-1 text-sm">
                  <div class="flex justify-between">
                    <span class="text-slate-600">Total Sessions:</span>
                    <span class="font-semibold text-slate-900">{{ sub.sessions_total }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-600">Sessions Completed:</span>
                    <span class="font-semibold text-green-600">{{ getSessionsProgress(sub).completed }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-600">Postpones Used:</span>
                    <span class="font-semibold text-amber-600">{{ sub.postpone_total - sub.postpone_remaining }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="mt-4 flex gap-2">
              <UButton
                block
                :color="sub.status === 'draft' ? 'warning' : 'primary'"
                :variant="sub.status === 'draft' ? 'solid' : 'outline'"
                :to="`/student/subscriptions/${sub.id}`"
                @click.stop
              >
                <UIcon 
                  :name="sub.status === 'draft' ? 'i-heroicons-banknotes' : 'i-heroicons-eye'" 
                  class="mr-2 h-4 w-4" 
                />
                {{ sub.status === 'draft' ? 'Complete Payment' : 'View Full Details' }}
              </UButton>
              <UButton
                v-if="['active', 'teacher_assigned'].includes(sub.status)"
                block
                variant="outline"
                color="neutral"
                :to="`/student/subscriptions/${sub.id}/sessions`"
                @click.stop
              >
                <UIcon name="i-heroicons-video-camera" class="mr-2 h-4 w-4" />
                View Sessions
              </UButton>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

