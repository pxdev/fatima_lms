<script setup lang="ts">
// Removed format and parseISO - using DateTimeDisplay component instead

definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

useSeoMeta({
  title: 'Sessions Approval',
  description: 'Review and approve student session requests'
})

const { profile, fetchProfile } = useProfile()
const { getItems } = useDirectusItems()

interface ApprovalRequest {
  week: {
    id: string
    week_index: number
    status: string
    submitted_at: string | null
    subscription: string
  }
  subscription: {
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
    }
    status: string
  }
  slots: Array<{
    id: string
    start_at: string
    end_at: string
  }>
}

const approvalRequests = ref<ApprovalRequest[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)
const approvingWeekId = ref<string | null>(null)
const decliningWeekId = ref<string | null>(null)
const expandedRequestId = ref<string | null>(null)

// Throttled approve action
const { execute: throttledApprove, isLoading: isApproving } = useThrottledAction(
  async () => {
    if (approvingWeekId.value) {
      await doApproveWeek(approvingWeekId.value)
    }
  },
  { throttleMs: 1000 }
)

// Throttled decline action
const { execute: throttledDecline, isLoading: isDeclining } = useThrottledAction(
  async () => {
    if (decliningWeekId.value) {
      await doDeclineWeek(decliningWeekId.value)
    }
  },
  { throttleMs: 1000 }
)

onMounted(async () => {
  await fetchProfile()
  
  if (profile.value?.role !== 'teacher') {
    navigateTo('/student/dashboard')
    return
  }

  await loadApprovalRequests()
})

async function loadApprovalRequests() {
  if (!profile.value?.id) return
  
  isLoading.value = true
  error.value = null

  try {
    // Get teacher profile ID
    const teacherProfileId = profile.value.id

    // Try to fetch weeks directly using nested filter on subscription.teacher
    // If that doesn't work, fall back to fetching subscriptions first
    let weeksData: any[] = []
    
    try {
      // Attempt direct query with nested filter
      weeksData = await getItems({
        collection: 'subscription_weeks',
        params: {
          filter: {
            _and: [
              {
                'subscription.teacher': { _eq: teacherProfileId }
              },
              {
                status: { _eq: 'submitted' }
              }
            ]
          },
          fields: ['id', 'week_index', 'status', 'submitted_at', 'subscription'],
          sort: ['submitted_at']
        }
      })
    } catch (nestedError) {
      // Fallback: fetch subscriptions first, then weeks
      const subscriptionsData = await getItems({
        collection: 'subscriptions',
        params: {
          filter: {
            teacher: { _eq: teacherProfileId },
            status: { _in: ['active', 'teacher_assigned'] }
          },
          fields: ['id']
        }
      })

      if (!subscriptionsData || subscriptionsData.length === 0) {
        approvalRequests.value = []
        return
      }

      const subscriptionIds = subscriptionsData.map((sub: any) => sub.id)
      
      // Fetch weeks for each subscription individually to avoid filter complexity
      const allWeeks: any[] = []
      for (const subId of subscriptionIds) {
        const subWeeks = await getItems({
          collection: 'subscription_weeks',
          params: {
            filter: {
              subscription: { _eq: subId },
              status: { _eq: 'submitted' }
            },
            fields: ['id', 'week_index', 'status', 'submitted_at', 'subscription'],
            sort: ['submitted_at']
          }
        })
        if (subWeeks) {
          allWeeks.push(...subWeeks)
        }
      }
      weeksData = allWeeks
    }

    // Fetch subscriptions data for the weeks we found
    const weekSubscriptionIds = [...new Set(weeksData.map((w: any) => w.subscription))]
    const subscriptionsData = await getItems({
      collection: 'subscriptions',
      params: {
        filter: {
          id: { _in: weekSubscriptionIds }
        },
        fields: [
          'id',
          'status',
          'student.id',
          'student.display_name',
          'course.id',
          'course.label',
          'package.id',
          'package.label'
        ]
      }
    })

    if (!weeksData || weeksData.length === 0) {
      approvalRequests.value = []
      return
    }

    // Build approval requests with subscription and slot data
    const requests: ApprovalRequest[] = []

    for (const week of weeksData) {
      const subscription = subscriptionsData.find((sub: any) => sub.id === week.subscription)
      if (!subscription) continue

      // Fetch slots for this week
      const slotsData = await getItems({
        collection: 'week_slots',
        params: {
          filter: {
            week: { _eq: week.id }
          },
          fields: ['id', 'start_at', 'end_at'],
          sort: ['start_at']
        }
      })

      requests.push({
        week: {
          id: week.id,
          week_index: week.week_index,
          status: week.status,
          submitted_at: week.submitted_at,
          subscription: week.subscription
        },
        subscription: {
          id: subscription.id,
          student: subscription.student,
          course: subscription.course,
          package: subscription.package,
          status: subscription.status
        },
        slots: slotsData || []
      })
    }

    // Sort by submitted_at (most recent first)
    requests.sort((a, b) => {
      if (!a.week.submitted_at) return 1
      if (!b.week.submitted_at) return -1
      return new Date(b.week.submitted_at).getTime() - new Date(a.week.submitted_at).getTime()
    })

    approvalRequests.value = requests
  } catch (err: any) {
    error.value = err?.data?.errors?.[0]?.message || err?.message || 'Failed to load approval requests'
    console.error('[Sessions Approval] Error:', err)
  } finally {
    isLoading.value = false
  }
}

async function doApproveWeek(weekId: string) {
  error.value = null
  const request = approvalRequests.value.find(r => r.week.id === weekId)
  if (!request) return

  try {
    await $fetch(`/api/subscriptions/${request.subscription.id}/approve-week`, {
      method: 'POST',
      body: { week_id: weekId }
    })

    // Remove approved request from list
    approvalRequests.value = approvalRequests.value.filter(r => r.week.id !== weekId)
    
    // Show success message
    const toast = useToast()
    toast.add({
      title: 'Week Approved',
      description: `Week ${request.week.week_index} has been approved and sessions created.`,
      color: 'success'
    })
  } catch (err: any) {
    error.value = err?.data?.statusMessage || err?.message || 'Failed to approve week'
    const toast = useToast()
    toast.add({
      title: 'Approval Failed',
      description: error.value,
      color: 'error'
    })
  } finally {
    approvingWeekId.value = null
  }
}

function approveWeek(weekId: string) {
  approvingWeekId.value = weekId
  throttledApprove()
}

async function doDeclineWeek(weekId: string) {
  error.value = null
  const request = approvalRequests.value.find(r => r.week.id === weekId)
  if (!request) return

  try {
    await $fetch(`/api/subscriptions/${request.subscription.id}/decline-week`, {
      method: 'POST',
      body: { week_id: weekId }
    })

    // Remove declined request from list
    approvalRequests.value = approvalRequests.value.filter(r => r.week.id !== weekId)
    
    // Show success message
    const toast = useToast()
    toast.add({
      title: 'Week Declined',
      description: `Week ${request.week.week_index} has been declined.`,
      color: 'warning'
    })
  } catch (err: any) {
    error.value = err?.data?.statusMessage || err?.message || 'Failed to decline week'
    const toast = useToast()
    toast.add({
      title: 'Decline Failed',
      description: error.value,
      color: 'error'
    })
  } finally {
    decliningWeekId.value = null
  }
}

function declineWeek(weekId: string) {
  decliningWeekId.value = weekId
  throttledDecline()
}

function toggleRequest(requestId: string) {
  if (expandedRequestId.value === requestId) {
    expandedRequestId.value = null
  } else {
    expandedRequestId.value = requestId
  }
}

// Removed formatSlotTimeDisplay - using SlotTimeDisplay component instead
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-primary-50/30 py-8">
    <div class="mx-auto max-w-7xl px-4">
      <!-- Breadcrumbs -->
      <UBreadcrumb 
        :items="[
          { label: 'Home', icon: 'i-heroicons-home', to: '/teacher/dashboard' },
          { label: 'Sessions Approval' }
        ]" 
        class="mb-6"
      />

      <!-- Header -->
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-slate-900">Sessions Approval</h1>
          <p class="mt-2 text-slate-600">
            Review and approve student session requests
          </p>
        </div>
        <UButton
          icon="i-heroicons-arrow-path"
          color="neutral"
          variant="ghost"
          size="lg"
          :loading="isLoading"
          @click="loadApprovalRequests"
          title="Refresh"
        />
      </div>

      <!-- Error Alert -->
      <UAlert
        v-if="error"
        color="error"
        variant="soft"
        icon="i-heroicons-exclamation-triangle"
        :title="error"
        class="mb-6"
        closable
        @close="error = null"
      />

      <!-- Loading State -->
      <div v-if="isLoading" class="space-y-4">
        <USkeleton v-for="i in 3" :key="i" class="h-32 w-full rounded-xl" />
      </div>

      <!-- Empty State -->
      <UCard v-else-if="approvalRequests.length === 0" class="text-center py-12">
        <UIcon name="i-heroicons-check-circle" class="mx-auto h-16 w-16 text-green-400" />
        <h3 class="mt-4 text-lg font-semibold text-slate-900">All Caught Up!</h3>
        <p class="mt-2 text-slate-600">
          There are no pending approval requests at this time.
        </p>
      </UCard>

      <!-- Approval Requests List -->
      <div v-else class="space-y-4">
        <UCard
          v-for="request in approvalRequests"
          :key="request.week.id"
          :id="`request-${request.week.id}`"
          class="transition-all duration-300"
          :class="{
            'ring-2 ring-warning-500/20': expandedRequestId === request.week.id
          }"
        >
          <template #header>
            <div class="flex w-full items-center justify-between">
              <button
                class="flex flex-1 items-center gap-4 transition-all hover:opacity-80"
                @click="toggleRequest(request.week.id)"
              >
                <!-- Student Avatar -->
                <div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
                  <UIcon name="i-heroicons-user" class="h-6 w-6 text-primary-600" />
                </div>
                
                <!-- Student & Course Info -->
                <div class="flex-1 text-left">
                  <h3 class="text-lg font-semibold text-slate-900">
                    {{ request.subscription.student.display_name }}
                  </h3>
                  <p class="text-sm text-slate-600">
                    {{ request.subscription.course.label }} • Week {{ request.week.week_index }}
                  </p>
                  <p v-if="request.week.submitted_at" class="text-xs text-slate-500 mt-1">
                    Submitted: <DateTimeDisplay :date="request.week.submitted_at" type="datetime" />
                  </p>
                </div>

                <!-- Badge -->
                <UBadge
                  color="warning"
                  variant="soft"
                  size="lg"
                >
                  {{ request.slots.length }} session{{ request.slots.length !== 1 ? 's' : '' }}
                </UBadge>
              </button>

              <div class="flex items-center gap-2 ml-4">
                <!-- Decline Button -->
                <UButton
                  color="error"
                  variant="outline"
                  size="lg"
                  :loading="isDeclining && decliningWeekId === request.week.id"
                  :disabled="(isApproving && approvingWeekId === request.week.id) || (isDeclining && decliningWeekId !== request.week.id)"
                  @click.stop="declineWeek(request.week.id)"
                >
                  <UIcon name="i-heroicons-x-mark" class="h-4 w-4 mr-2" />
                  Decline
                </UButton>

                <!-- Approve Button -->
                <UButton
                  color="success"
                  size="lg"
                  :loading="isApproving && approvingWeekId === request.week.id"
                  :disabled="(isApproving && approvingWeekId !== request.week.id) || (isDeclining && decliningWeekId === request.week.id)"
                  @click.stop="approveWeek(request.week.id)"
                >
                  <UIcon name="i-heroicons-check" class="h-4 w-4 mr-2" />
                  Approve
                </UButton>

                <!-- View Subscription Button -->
                <UButton
                  color="primary"
                  variant="outline"
                  size="lg"
                  :to="`/teacher/subscriptions/${request.subscription.id}`"
                >
                  <UIcon name="i-heroicons-arrow-right" class="h-4 w-4 mr-2" />
                  View Details
                </UButton>

                <!-- Expand/Collapse Icon -->
                <UIcon
                  name="i-heroicons-chevron-down"
                  class="h-5 w-5 text-slate-400 transition-transform duration-300 cursor-pointer"
                  :class="{ 'rotate-180': expandedRequestId === request.week.id }"
                  @click="toggleRequest(request.week.id)"
                />
              </div>
            </div>
          </template>

          <!-- Expanded Content -->
          <div
            v-show="expandedRequestId === request.week.id"
            class="space-y-4 pt-4"
          >
            <!-- Subscription Details -->
            <div class="rounded-lg bg-slate-50 p-4">
              <h4 class="text-sm font-semibold text-slate-900 mb-3">Subscription Details</h4>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="text-slate-500">Package:</span>
                  <span class="ml-2 font-medium text-slate-900">{{ request.subscription.package.label }}</span>
                </div>
                <div>
                  <span class="text-slate-500">Status:</span>
                  <UBadge
                    :color="request.subscription.status === 'active' ? 'success' : 'primary'"
                    variant="soft"
                    size="sm"
                    class="ml-2"
                  >
                    {{ request.subscription.status }}
                  </UBadge>
                </div>
              </div>
            </div>

            <!-- Scheduled Slots -->
            <div>
              <h4 class="text-sm font-semibold text-slate-900 mb-3">
                Scheduled Sessions ({{ request.slots.length }})
              </h4>
              <div class="space-y-2">
                <UCard
                  v-for="slot in request.slots"
                  :key="slot.id"
                  class="bg-gradient-to-r from-white to-slate-50"
                >
                  <div class="flex items-center gap-3">
                    <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                      <UIcon name="i-heroicons-clock" class="h-5 w-5 text-primary-600" />
                    </div>
                    <div class="flex-1">
                      <SlotTimeDisplay :start-at="slot.start_at" :end-at="slot.end_at" />
                    </div>
                  </div>
                </UCard>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

