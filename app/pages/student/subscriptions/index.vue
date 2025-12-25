<script setup lang="ts">
import PagesHeader from '~/components/app/PagesHeader.vue'

definePageMeta({
  middleware: 'auth',
  layout: 'default'
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

// Filter options
const filterOptions = [
  { key: 'all', label: 'All Subscriptions', icon: 'hugeicons:search-list-02' },
  { key: 'active', label: 'Active', icon: 'hugeicons:calendar-03' },
  { key: 'teacher_assigned', label: 'Teacher Assigned', icon: 'hugeicons:user-check-02' },
  { key: 'pending_payment', label: 'Pending Payment', icon: 'hugeicons:clock-02' },
  { key: 'draft', label: 'Draft', icon: 'hugeicons:file-02' },
  { key: 'completed', label: 'Completed', icon: 'hugeicons:square-lock-check-01' }
]

const currentFilterLabel = computed(() => {
  const filter = filterOptions.find(f => f.key === activeFilter.value)
  return filter?.label || 'All Subscriptions'
})

// Get active filter option
const activeFilterOption = computed(() => {
  return filterOptions.find(f => f.key === activeFilter.value) ?? filterOptions[0]
})

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
    <!-- Header -->
    <PagesHeader
      :title="'My Subscriptions'"
      :description="'View and manage all your learning subscriptions'"
      :crumbs="[
        { label: 'Home', to: '/student/dashboard' },
        { label: 'My Subscriptions' }
      ]"
    />
    
    <u-container>
      <div class="mb-6 flex justify-end">
        <UButton
          color="primary"
          size="lg"
          class="rounded-full"
          to="/student/subscribe"
        >
          <UIcon name="hugeicons:add-circle" class="mr-2 h-5 w-5" />
          Add New Subscription
        </UButton>
      </div>

    <!-- Loading -->
    <div v-if="isLoading" class="space-y-4">
      <USkeleton v-for="i in 5" :key="i" class="h-32 w-full rounded-xl" />
    </div>

    <!-- Empty State (No subscriptions at all) -->
    <UCard v-else-if="subscriptions.length === 0" class="py-16 text-center">
      <div class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
        <UIcon name="hugeicons:book-02" class="h-10 w-10 text-slate-400" />
      </div>
      <h3 class="mt-6 text-xl font-semibold text-slate-900">No Subscriptions Yet</h3>
      <p class="mt-2 text-slate-600">Start your learning journey by creating a new subscription.</p>
      <UButton
        color="primary"
        size="lg"
        class="mt-6"
        to="/student/subscribe"
      >
        <UIcon name="hugeicons:add-circle" class="mr-2 h-5 w-5" />
        Create Your First Subscription
      </UButton>
    </UCard>

    <!-- Subscriptions Content -->
    <div v-else>
      <!-- Filter Dropdown -->
      <div class="mb-6 flex items-center justify-between">
        <UDropdownMenu
          :items="filterOptions.map(filter => ({
            label: filter.label,
            icon: filter.icon,
            onClick: () => { activeFilter = filter.key },
            badge: (filterCounts[filter.key] ?? 0) > 0 ? (filterCounts[filter.key] ?? 0).toString() : undefined,
          
          }))"
        
          :ui="{
            content: 'w-72 py-2',
            item: 'flex items-center gap-3 text-base py-2.5 px-4 text-slate-700 hover:bg-slate-50 data-[active=true]:bg-primary-50 data-[active=true]:text-primary-700 data-[disabled=true]:opacity-40 data-[disabled=true]:cursor-not-allowed',
            label: 'flex-1'
          }"
        >
          <UButton
            variant="outline"
            color="neutral"
            size="lg"
            class="min-w-[200px] justify-between"
          >
            <div class="flex items-center gap-3">
              <UIcon 
                :name="activeFilterOption?.icon ?? 'hugeicons:list-01'" 
                class="w-5 h-5 text-slate-600"
              />
              <span class="font-medium">{{ activeFilterOption?.label ?? 'All Subscriptions' }}</span>
              <UBadge 
                v-if="(filterCounts[activeFilter] ?? 0) > 0" 
                color="primary" 
                variant="soft" 
                size="sm"
              >
                {{ filterCounts[activeFilter] ?? 0 }}
              </UBadge>
            </div>
            <UIcon name="hugeicons:arrow-down-01" class="w-4 h-4 ml-2 text-slate-400" />
          </UButton>
        </UDropdownMenu>

        <div class="text-sm text-slate-600">
          <span class="font-semibold text-slate-900">{{ filteredSubscriptions.length }}</span>
          {{ filteredSubscriptions.length === 1 ? 'subscription' : 'subscriptions' }}
        </div>
      </div>

      <!-- Empty Filter State -->
      <UCard v-if="filteredSubscriptions.length === 0" class="py-16 text-center">
        <div class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
          <UIcon 
            :name="filterOptions.find(f => f.key === activeFilter)?.icon || 'hugeicons:list-01'" 
            class="h-10 w-10 text-slate-400" 
          />
        </div>
        <h3 class="mt-6 text-xl font-semibold text-slate-900">
          No {{ currentFilterLabel.toLowerCase() }}
        </h3>
        <p class="mt-2 text-slate-600">
          <span v-if="activeFilter === 'all'">
            You don't have any subscriptions yet. Start your learning journey by creating a new subscription.
          </span>
          <span v-else>
            You don't have any subscriptions with this status. Try selecting a different filter or create a new subscription.
          </span>
        </p>
        <div class="mt-6 flex justify-center gap-3">
          <UButton
            v-if="activeFilter !== 'all'"
            variant="outline"
            color="neutral"
            size="lg"
            @click="activeFilter = 'all'"
          >
            <UIcon name="hugeicons:list-01" class="mr-2 h-5 w-5" />
            View All Subscriptions
          </UButton>
          <UButton
            color="primary"
            size="lg"
            to="/student/subscribe"
          >
            <UIcon name="hugeicons:add-circle" class="mr-2 h-5 w-5" />
            Create New Subscription
          </UButton>
        </div>
      </UCard>

      <!-- Subscriptions List -->
      <div v-else class="space-y-3">
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
    </u-container>
  </div>
</template>

