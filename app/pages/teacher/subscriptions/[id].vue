<script setup lang="ts">
// Removed format and parseISO - using DateTimeDisplay and SlotTimeDisplay components instead
import { onUnmounted } from 'vue'
import PagesHeader from '~/components/app/PagesHeader.vue'

definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

const route = useRoute()
const subscriptionId = computed(() => route.params.id as string)

useSeoMeta({
  title: 'Subscription Details',
  description: 'View and manage student subscription'
})

const { profile, fetchProfile } = useProfile()
const { getItems, getItemById } = useDirectusItems()

interface SubDetail {
  id: string
  student: {
    id: string
    display_name: string
  }
  course: {
    id: string
    label: string
  }
  package: {
    id: string
    label: string
    sessions_per_week: number
  }
  status: string
  sessions_remaining: number
  sessions_total: number
  weeks_total: number
}

interface WeekDetail {
  id: string
  week_index: number
  status: string
  submitted_at: string | null
  slots?: any[]
}

const subscription = ref<SubDetail | null>(null)
const weeks = ref<WeekDetail[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)
const approvingWeekId = ref<string | null>(null)
const activeWeekIndex = ref<number | null>(null)
const expandedWeekId = ref<string | null>(null)

// Throttled approve action
const { execute: throttledApprove, isLoading: isApproving } = useThrottledAction(
  async () => {
    if (approvingWeekId.value) {
      await doApproveWeek(approvingWeekId.value)
    }
  },
  { throttleMs: 1000 }
)

// Computed: Find all pending weeks (submitted or draft) - can approve any of them
const pendingWeeks = computed(() => {
  return weeks.value.filter(w => w.status === 'submitted' || w.status === 'draft')
})

// Computed: Find the first pending week (for auto-scroll)
const firstPendingWeek = computed(() => {
  return pendingWeeks.value[0]
})

// Computed: Get week status for stepper
const getWeekStepStatus = (week: WeekDetail) => {
  if (week.status === 'approved') return 'completed'
  if (week.status === 'submitted') return 'active'
  if (week.status === 'rejected') return 'error'
  return 'pending'
}

// Watch for profile changes (e.g., timezone updates) and refresh data
watch(() => profile.value?.timezone, async () => {
  if (profile.value?.role === 'teacher') {
    await loadData()
  }
})

// Watch weeks to auto-expand and scroll to active week
watch(weeks, (newWeeks) => {
  if (newWeeks.length > 0) {
    const pending = firstPendingWeek.value
    if (pending) {
      expandedWeekId.value = pending.id
      activeWeekIndex.value = pending.week_index
      // Scroll to active week after a short delay
      nextTick(() => {
        scrollToWeek(pending.id)
      })
    } else {
      // All weeks approved, expand the last one
      const lastWeek = newWeeks[newWeeks.length - 1]
      if (lastWeek) {
        expandedWeekId.value = lastWeek.id
        activeWeekIndex.value = lastWeek.week_index
      }
    }
  }
}, { immediate: true, deep: true })

onMounted(async () => {
  await fetchProfile()
  
  if (profile.value?.role !== 'teacher') {
    navigateTo('/student/dashboard')
    return
  }

  await loadData()
  
  // Set up periodic refresh to check for new submissions (every 30 seconds)
  const refreshInterval = setInterval(async () => {
    if (document.visibilityState === 'visible') {
      await loadData()
    }
  }, 30000)
  
  // Clean up interval on unmount
  onUnmounted(() => {
    clearInterval(refreshInterval)
  })
})

async function loadData() {
  isLoading.value = true
  error.value = null

  try {
    // Fetch subscription
    const subData = await getItemById<SubDetail>({
      collection: 'subscriptions',
      id: subscriptionId.value,
      params: {
        fields: ['id', 'status', 'sessions_remaining', 'sessions_total', 'weeks_total',
                 'student.id', 'student.display_name',
                 'course.id', 'course.label',
                 'package.id', 'package.label', 'package.sessions_per_week']
      }
    })

    subscription.value = subData || null

    // Fetch weeks with all necessary fields including status
    const weeksData = await getItems<WeekDetail>({
      collection: 'subscription_weeks',
      params: {
        filter: {
          subscription: { _eq: subscriptionId.value }
        },
        fields: ['id', 'week_index', 'status', 'submitted_at', 'reviewed_at'],
        sort: ['week_index']
      }
    })

    // Fetch slots for each week
    for (const week of (weeksData || [])) {
      const slots = await getItems({
        collection: 'week_slots',
        params: {
          filter: { week: { _eq: week.id } },
          sort: ['start_at']
        }
      })
      week.slots = slots || []
    }

    weeks.value = weeksData || []
    
    // Debug: Log week statuses to help identify why approve button might not show
    console.log('[Teacher Subscriptions] Loaded weeks:', weeks.value.map(w => ({
      week_index: w.week_index,
      status: w.status,
      id: w.id
    })))
  } catch (err: any) {
    error.value = err?.message || 'Failed to load data'
  } finally {
    isLoading.value = false
  }
}

async function doApproveWeek(weekId: string) {
  error.value = null
  const weekToApprove = weeks.value.find(w => w.id === weekId)
  const weekIndex = weekToApprove?.week_index

  try {
    await $fetch(`/api/subscriptions/${subscriptionId.value}/approve-week`, {
      method: 'POST',
      body: { week_id: weekId }
    })

    await loadData()

    // Auto-advance to next pending week
    await nextTick()
    const nextPending = firstPendingWeek.value
    if (nextPending) {
      expandedWeekId.value = nextPending.id
      activeWeekIndex.value = nextPending.week_index
      scrollToWeek(nextPending.id)
    } else if (weekIndex !== undefined) {
      // If no more pending weeks, scroll to the next week
      const nextWeek = weeks.value.find(w => w.week_index === weekIndex + 1)
      if (nextWeek) {
        expandedWeekId.value = nextWeek.id
        scrollToWeek(nextWeek.id)
      }
    }
  } catch (err: any) {
    error.value = err?.data?.statusMessage || 'Failed to approve week'
  } finally {
    approvingWeekId.value = null
  }
}

function approveWeek(weekId: string) {
  approvingWeekId.value = weekId
  throttledApprove()
}

function toggleWeek(weekId: string) {
  if (expandedWeekId.value === weekId) {
    expandedWeekId.value = null
  } else {
    expandedWeekId.value = weekId
    scrollToWeek(weekId)
  }
}

function scrollToWeek(weekId: string) {
  nextTick(() => {
    const element = document.getElementById(`week-${weekId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  })
}

function goToWeek(weekIndex: number) {
  const week = weeks.value.find(w => w.week_index === weekIndex)
  if (week) {
    expandedWeekId.value = week.id
    activeWeekIndex.value = weekIndex
    scrollToWeek(week.id)
  }
}

// Removed formatSlotTimeDisplay - using SlotTimeDisplay component instead

function getWeekStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'neutral',
    submitted: 'warning',
    approved: 'success',
    rejected: 'error'
  }
  return colors[status] || 'neutral'
}

function getWeekStatusIcon(status: string): string {
  const icons: Record<string, string> = {
    draft: 'i-heroicons-pencil-square',
    submitted: 'i-heroicons-clock',
    approved: 'i-heroicons-check-circle',
    rejected: 'i-heroicons-x-circle'
  }
  return icons[status] || 'i-heroicons-question-mark-circle'
}
</script>

<template>
  <div class="min-h-screen">
    <!-- Header -->
    <PagesHeader
      v-if="subscription"
      :title="`${subscription.student?.display_name || 'Student'} Details`"
      :description="`${subscription.course?.label || ''} • ${subscription.package?.label || ''}`"
      :crumbs="[
        { label: 'Home', to: '/teacher/dashboard' },
        { label: 'Student Details' }
      ]"
    />
    
    <div class="py-8">
      <div class="mx-auto max-w-4xl px-4">
        <!-- Loading -->
        <div v-if="isLoading" class="space-y-4">
          <USkeleton class="h-32 w-full" />
          <USkeleton class="h-64 w-full" />
        </div>

        <!-- Error -->
        <UAlert
          v-else-if="error"
          color="error"
          variant="soft"
          icon="i-heroicons-exclamation-triangle"
          :title="error"
          class="mb-6"
          closable
          @close="error = null"
        />

        <template v-else-if="subscription">
        <!-- Subscription Header -->
        <UCard class="mb-6">
          <div class="flex items-start justify-between">
            <div>
              <h1 class="text-2xl font-bold text-slate-900">
                {{ subscription.student?.display_name || 'Student' }}
              </h1>
              <p class="mt-1 text-slate-600">
                {{ subscription.course?.label }} • {{ subscription.package?.label }}
              </p>
            </div>
            <UBadge
              :color="subscription.status === 'active' ? 'success' : 'primary'"
              variant="soft"
              size="lg"
            >
              {{ subscription.status.replace(/_/g, ' ') }}
            </UBadge>
          </div>

          <div class="mt-4 flex gap-6 text-sm">
            <div>
              <span class="text-slate-500">Sessions:</span>
              <span class="ml-1 font-semibold">
                {{ subscription.sessions_remaining }}/{{ subscription.sessions_total }}
              </span>
            </div>
            <div>
              <span class="text-slate-500">Sessions/Week:</span>
              <span class="ml-1 font-semibold">{{ subscription.package?.sessions_per_week }}</span>
            </div>
          </div>
        </UCard>

        <!-- Weeks Stepper -->
        <div v-if="weeks.length > 0" class="mb-8">
          <div class="mb-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <h2 class="text-lg font-semibold text-slate-900">Weekly Schedules</h2>
              <UButton
                icon="i-heroicons-arrow-path"
                color="neutral"
                variant="ghost"
                size="sm"
                :loading="isLoading"
                @click="loadData"
                title="Refresh data"
              />
            </div>
            <UBadge
              v-if="pendingWeeks.length > 0"
              color="warning"
              variant="soft"
              size="sm"
            >
              {{ pendingWeeks.length }} week{{ pendingWeeks.length !== 1 ? 's' : '' }} pending approval
            </UBadge>
          </div>
          
          <!-- Stepper Navigation -->
          <div class="mb-6 overflow-x-auto pb-4">
            <div class="flex items-center justify-center gap-2 min-w-max px-2">
              <template v-for="(week, index) in weeks" :key="week.id">
                <!-- Step Circle -->
                <button
                  class="group relative flex flex-col items-center gap-2 transition-all"
                  :class="{
                    'cursor-pointer': true
                  }"
                  @click="goToWeek(week.week_index)"
                >
                  <div
                    class="relative flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300"
                    :class="{
                      'border-success-500 bg-success-500 text-white shadow-lg shadow-success-500/30': week.status === 'approved',
                      'border-warning-500 bg-warning-50 text-warning-600 ring-2 ring-warning-500/20': week.status === 'submitted' && activeWeekIndex === week.week_index,
                      'border-warning-500 bg-white text-warning-600': week.status === 'submitted' && activeWeekIndex !== week.week_index,
                      'border-error-500 bg-error-50 text-error-600': week.status === 'rejected',
                      'border-slate-300 bg-white text-slate-400': week.status === 'draft',
                      'scale-110': activeWeekIndex === week.week_index
                    }"
                  >
                    <UIcon
                      v-if="week.status === 'approved'"
                      name="i-heroicons-check"
                      class="h-6 w-6"
                    />
                    <UIcon
                      v-else
                      :name="getWeekStatusIcon(week.status)"
                      class="h-5 w-5"
                    />
                    <!-- Pulse animation for active week -->
                    <span
                      v-if="week.status === 'submitted' && activeWeekIndex === week.week_index"
                      class="absolute inset-0 animate-ping rounded-full border-2 border-warning-500 opacity-75"
                    />
                  </div>
                  <div class="text-center">
                    <div
                      class="text-xs font-medium transition-colors"
                      :class="{
                        'text-success-600': week.status === 'approved',
                        'text-warning-600': week.status === 'submitted',
                        'text-error-600': week.status === 'rejected',
                        'text-slate-500': week.status === 'draft'
                      }"
                    >
                      Week {{ week.week_index }}
                    </div>
                    <div
                      class="mt-0.5 text-[10px] uppercase tracking-wide"
                      :class="{
                        'text-success-600': week.status === 'approved',
                        'text-warning-600': week.status === 'submitted',
                        'text-error-600': week.status === 'rejected',
                        'text-slate-400': week.status === 'draft'
                      }"
                    >
                      {{ week.status }}
                    </div>
                  </div>
                </button>
                
                <!-- Connector Line -->
                <div
                  v-if="index < weeks.length - 1"
                  class="h-0.5 w-8 sm:w-12 transition-all duration-300"
                  :class="{
                    'bg-success-500': week.status === 'approved',
                    'bg-slate-200': week.status !== 'approved'
                  }"
                />
              </template>
            </div>
          </div>
        </div>

        <!-- Weeks List -->
        <div v-if="weeks.length === 0" class="py-8 text-center">
          <UIcon name="i-heroicons-calendar" class="mx-auto h-12 w-12 text-slate-300" />
          <p class="mt-2 text-slate-600">No weeks scheduled yet</p>
        </div>

        <div v-else class="space-y-3">
          <UCard
            v-for="week in weeks"
            :id="`week-${week.id}`"
            :key="week.id"
            class="transition-all duration-300"
            :class="{
              'ring-2 ring-warning-500/20 shadow-lg': expandedWeekId === week.id && week.status === 'submitted',
              'ring-2 ring-success-500/20': expandedWeekId === week.id && week.status === 'approved',
              'opacity-60': expandedWeekId && expandedWeekId !== week.id
            }"
          >
            <template #header>
              <div class="flex w-full items-center justify-between">
                <button
                  class="flex flex-1 items-center gap-3 transition-all hover:opacity-80"
                  @click="toggleWeek(week.id)"
                >
                  <div
                    class="flex h-8 w-8 items-center justify-center rounded-full transition-all"
                    :class="{
                      'bg-success-100 text-success-600': week.status === 'approved',
                      'bg-warning-100 text-warning-600': week.status === 'submitted',
                      'bg-error-100 text-error-600': week.status === 'rejected',
                      'bg-slate-100 text-slate-600': week.status === 'draft'
                    }"
                  >
                    <UIcon :name="getWeekStatusIcon(week.status)" class="h-4 w-4" />
                  </div>
                  <div class="text-left">
                    <h3 class="font-semibold text-slate-900">Week {{ week.week_index }}</h3>
                    <p class="text-xs text-slate-500">
                      {{ week.slots?.length || 0 }} session{{ (week.slots?.length || 0) !== 1 ? 's' : '' }}
                    </p>
                  </div>
                  <UBadge
                    :color="getWeekStatusColor(week.status) as any"
                    variant="soft"
                    size="sm"
                  >
                    {{ week.status }}
                  </UBadge>
                </button>
                <div class="flex items-center gap-2 ml-4">
                  <!-- Approve button - can approve ANY submitted week, not just the last one -->
                  <UButton
                    v-if="week.status === 'submitted'"
                    color="success"
                    size="sm"
                    :loading="isApproving && approvingWeekId === week.id"
                    :disabled="isApproving && approvingWeekId !== week.id"
                    @click.stop="approveWeek(week.id)"
                  >
                    <UIcon name="i-heroicons-check" class="h-4 w-4 mr-1" />
                    Approve Week {{ week.week_index }}
                  </UButton>
                  <!-- Show info if week is not submitted (for debugging) -->
                  <span
                    v-else-if="week.status !== 'approved'"
                    class="text-xs text-slate-400 italic"
                    :title="`Week status: ${week.status}. Only weeks with 'submitted' status can be approved.`"
                  >
                    {{ week.status === 'draft' ? 'Draft - needs submission' : week.status }}
                  </span>
                  <UIcon
                    name="i-heroicons-chevron-down"
                    class="h-5 w-5 text-slate-400 transition-transform duration-300 cursor-pointer"
                    :class="{ 'rotate-180': expandedWeekId === week.id }"
                    @click="toggleWeek(week.id)"
                  />
                </div>
              </div>
            </template>

            <!-- Expanded Content -->
            <div
              v-show="expandedWeekId === week.id"
              class="space-y-3 pt-2"
            >
              <!-- Slots -->
              <div v-if="week.slots && week.slots.length > 0" class="space-y-2">
                <div class="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <UIcon name="i-heroicons-calendar-days" class="h-4 w-4" />
                  Scheduled Sessions
                </div>
                <div
                  v-for="slot in week.slots"
                  :key="slot.id"
                  class="flex items-center gap-3 rounded-lg bg-gradient-to-r from-slate-50 to-blue-50/50 p-3 border border-slate-200 transition-all hover:shadow-sm"
                >
                  <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                    <UIcon name="i-heroicons-clock" class="h-5 w-5" />
                  </div>
                  <div class="flex-1">
                    <div class="font-medium text-slate-900">
                      <SlotTimeDisplay :start-at="slot.start_at" :end-at="slot.end_at" />
                    </div>
                    <div v-if="slot.note" class="mt-0.5 text-sm text-slate-500">
                      {{ slot.note }}
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="rounded-lg bg-slate-50 p-6 text-center">
                <UIcon name="i-heroicons-calendar-x" class="mx-auto h-8 w-8 text-slate-300" />
                <p class="mt-2 text-sm text-slate-500">No slots scheduled for this week</p>
              </div>

              <!-- Submitted Date -->
              <div v-if="week.submitted_at" class="mt-4 border-t border-slate-200 pt-3">
                <div class="flex items-center gap-2 text-xs text-slate-500">
                  <UIcon name="i-heroicons-paper-airplane" class="h-3 w-3" />
                  Submitted: <DateTimeDisplay :date="week.submitted_at" type="date" />
                </div>
              </div>
            </div>
          </UCard>
        </div>
        </template>
      </div>
    </div>
  </div>
</template>

