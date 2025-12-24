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
const { subscriptions, fetchMySubscriptions, isLoading: subsLoading } = useSubscriptions()
const { courses, fetchCourses } = useCourses()
const { packages, fetchPackages } = usePackages()
const { getStatusConfig } = useSubscriptionCard()

const isLoading = computed(() => profileLoading.value || subsLoading.value)
const expandedCards = ref<Set<string>>(new Set())
const activeFilter = ref<string>('all')

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
  
  const statuses = ['active', 'teacher_assigned', 'payment_received', 'pending_payment', 'draft', 'completed', 'cancelled']
  statuses.forEach(status => {
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
        <SubscriptionCard
          v-for="sub in filteredSubscriptions"
          :key="sub.id"
          :subscription="sub"
          variant="default"
          :expandable="true"
          :expanded="isExpanded(sub.id)"
          @update:expanded="(val) => val ? expandedCards.add(sub.id) : expandedCards.delete(sub.id)"
        />
      </div>
    </div>
  </div>
</template>

