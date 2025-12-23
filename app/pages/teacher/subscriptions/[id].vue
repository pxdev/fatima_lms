<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
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

// Throttled approve action
const { execute: throttledApprove, isLoading: isApproving } = useThrottledAction(
  async () => {
    if (approvingWeekId.value) {
      await doApproveWeek(approvingWeekId.value)
    }
  },
  { throttleMs: 1000 }
)

// Watch for profile changes (e.g., timezone updates) and refresh data
watch(() => profile.value?.timezone, async () => {
  if (profile.value?.role === 'teacher') {
    await loadData()
  }
})

onMounted(async () => {
  await fetchProfile()
  
  if (profile.value?.role !== 'teacher') {
    navigateTo('/student/dashboard')
    return
  }

  await loadData()
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

    // Fetch weeks
    const weeksData = await getItems<WeekDetail>({
      collection: 'subscription_weeks',
      params: {
        filter: {
          subscription: { _eq: subscriptionId.value }
        },
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
  } catch (err: any) {
    error.value = err?.message || 'Failed to load data'
  } finally {
    isLoading.value = false
  }
}

async function doApproveWeek(weekId: string) {
  error.value = null

  try {
    await $fetch(`/api/subscriptions/${subscriptionId.value}/approve-week`, {
      method: 'POST',
      body: { week_id: weekId }
    })

    await loadData()
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

const { formatSlotTime } = useTimezone()

function formatSlotTimeDisplay(slot: any): string {
  return formatSlotTime(slot.start_at, slot.end_at)
}

function getWeekStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'neutral',
    submitted: 'warning',
    approved: 'success',
    rejected: 'error'
  }
  return colors[status] || 'neutral'
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
    <div class="mx-auto max-w-4xl px-4 py-8">
      <!-- Back Link -->
      <div class="mb-6">
        <UButton
          variant="ghost"
          color="neutral"
          to="/teacher/dashboard"
          size="sm"
        >
          <UIcon name="i-heroicons-arrow-left" class="mr-1 h-4 w-4" />
          Back to Dashboard
        </UButton>
      </div>

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

        <!-- Weeks -->
        <h2 class="mb-4 text-lg font-semibold text-slate-900">Weekly Schedules</h2>
        
        <div v-if="weeks.length === 0" class="py-8 text-center">
          <UIcon name="i-heroicons-calendar" class="mx-auto h-12 w-12 text-slate-300" />
          <p class="mt-2 text-slate-600">No weeks scheduled yet</p>
        </div>

        <div v-else class="space-y-4">
          <UCard v-for="week in weeks" :key="week.id">
            <template #header>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <h3 class="font-semibold text-slate-900">Week {{ week.week_index }}</h3>
                  <UBadge :color="getWeekStatusColor(week.status) as any" variant="soft" size="sm">
                    {{ week.status }}
                  </UBadge>
                </div>
                <UButton
                  v-if="week.status === 'submitted'"
                  color="success"
                  size="sm"
                  :loading="isApproving && approvingWeekId === week.id"
                  :disabled="isApproving"
                  @click="approveWeek(week.id)"
                >
                  Approve Week
                </UButton>
              </div>
            </template>

            <!-- Slots -->
            <div v-if="week.slots && week.slots.length > 0" class="space-y-2">
              <div
                v-for="slot in week.slots"
                :key="slot.id"
                class="flex items-center gap-3 rounded-lg bg-slate-50 p-3"
              >
                <UIcon name="i-heroicons-clock" class="h-5 w-5 text-slate-400" />
                <span class="text-slate-700">{{ formatSlotTimeDisplay(slot) }}</span>
                <span v-if="slot.note" class="text-sm text-slate-500">
                  ({{ slot.note }})
                </span>
              </div>
            </div>
            <div v-else class="text-center text-slate-500 py-4">
              No slots scheduled for this week
            </div>
          </UCard>
        </div>
      </template>
    </div>
  </div>
</template>

