<script setup lang="ts">
import { parseISO, differenceInMinutes, isAfter, isBefore } from 'date-fns'

definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

useSeoMeta({
  title: 'My Sessions',
  description: 'View all your upcoming and past sessions'
})

const { profile, fetchProfile } = useProfile()
const { subscriptions, fetchMySubscriptions } = useSubscriptions()
const { getItems } = useDirectusItems()

interface SessionWithDetails {
  id: string
  start_at: string
  end_at: string
  status: string
  zoom_join_url: string | null
  subscription: {
    id: string
    teacher: {
      display_name: string
    } | null
    course: {
      label: string
    }
  }
}

const sessions = ref<SessionWithDetails[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)
const activeTab = ref('upcoming')

onMounted(async () => {
  // Sync session statuses first
  try {
    await $fetch('/api/sessions/sync-status', { method: 'POST' })
  } catch (err) {
    console.warn('Failed to sync session statuses:', err)
  }
  
  await fetchProfile()
  
  if (profile.value?.role === 'teacher') {
    navigateTo('/teacher/sessions')
    return
  }
  
  if (profile.value?.id) {
    await loadSessions()
  }
})

async function loadSessions() {
  isLoading.value = true
  error.value = null
  
  try {
    // Fetch subscriptions first
    await fetchMySubscriptions(profile.value!.id)
    
    const subIds = subscriptions.value.map(s => s.id)
    
    if (subIds.length === 0) {
      sessions.value = []
      return
    }

    const data = await getItems<SessionWithDetails>({
      collection: 'sessions',
      params: {
        filter: {
          subscription: { _in: subIds }
        },
        fields: ['id', 'start_at', 'end_at', 'status', 'zoom_join_url',
                 'subscription.id', 'subscription.teacher.display_name',
                 'subscription.course.label'],
        sort: ['start_at'],
        limit: 100
      }
    })
    
    sessions.value = data || []
  } catch (err: any) {
    error.value = err?.message || 'Failed to load sessions'
  } finally {
    isLoading.value = false
  }
}

const upcomingSessions = computed(() => {
  const now = new Date()
  return sessions.value.filter(s => 
    isAfter(parseISO(s.start_at), now) && 
    ['scheduled', 'in_progress'].includes(s.status)
  )
})

const pastSessions = computed(() => {
  const now = new Date()
  return sessions.value
    .filter(s => 
      isBefore(parseISO(s.start_at), now) || 
      !['scheduled', 'in_progress'].includes(s.status)
    )
    .sort((a, b) => parseISO(b.start_at).valueOf() - parseISO(a.start_at).valueOf())
})

const { formatDateTime } = useTimezone()

function canJoinSession(session: SessionWithDetails): boolean {
  if (!session.zoom_join_url) return false
  
  const now = new Date()
  const start = parseISO(session.start_at)
  const diffMinutes = differenceInMinutes(start, now)
  
  return diffMinutes <= 15
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    scheduled: 'info',
    in_progress: 'warning',
    completed: 'success',
    cancelled: 'error',
    student_no_show: 'error',
    teacher_no_show: 'error',
    student_requested_postpone: 'warning',
    postpone_approved: 'neutral'
  }
  return colors[status] || 'neutral'
}

function getSessionIcon(session: SessionWithDetails): string {
  if (session.status === 'completed') return 'i-heroicons-check-circle'
  if (session.status === 'cancelled') return 'i-heroicons-x-circle'
  if (session.status.includes('no_show')) return 'i-heroicons-exclamation-circle'
  if (session.status.includes('postpone')) return 'i-heroicons-arrow-path'
  return 'i-heroicons-video-camera'
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-slate-900">My Sessions</h1>
      <p class="mt-1 text-slate-600">View and manage all your learning sessions</p>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="space-y-4">
      <USkeleton v-for="i in 5" :key="i" class="h-24 w-full rounded-xl" />
    </div>

    <!-- Error -->
    <UAlert
      v-else-if="error"
      color="error"
      variant="soft"
      icon="i-heroicons-exclamation-triangle"
      :title="error"
      class="mb-6"
    />

    <!-- Empty State -->
    <UCard v-else-if="sessions.length === 0" class="py-12 text-center">
      <UIcon name="i-heroicons-calendar" class="mx-auto h-16 w-16 text-slate-300" />
      <h3 class="mt-4 text-lg font-semibold text-slate-900">No Sessions Yet</h3>
      <p class="mt-2 text-slate-600">Sessions will appear here once your schedule is approved.</p>
      <UButton
        color="primary"
        class="mt-6"
        to="/student/dashboard"
      >
        Go to Dashboard
      </UButton>
    </UCard>

    <!-- Sessions Content -->
    <div v-else>
      <!-- Tabs -->
      <div class="mb-6 flex gap-2">
        <UButton
          :color="activeTab === 'upcoming' ? 'primary' : 'neutral'"
          :variant="activeTab === 'upcoming' ? 'solid' : 'outline'"
          @click="activeTab = 'upcoming'"
        >
          Upcoming
          <UBadge v-if="upcomingSessions.length > 0" color="primary" variant="soft" class="ml-2">
            {{ upcomingSessions.length }}
          </UBadge>
        </UButton>
        <UButton
          :color="activeTab === 'past' ? 'primary' : 'neutral'"
          :variant="activeTab === 'past' ? 'solid' : 'outline'"
          @click="activeTab = 'past'"
        >
          Past
          <UBadge v-if="pastSessions.length > 0" color="neutral" variant="soft" class="ml-2">
            {{ pastSessions.length }}
          </UBadge>
        </UButton>
      </div>

      <!-- Upcoming Sessions -->
      <div v-if="activeTab === 'upcoming'" class="space-y-4">
        <div v-if="upcomingSessions.length === 0" class="py-12 text-center">
          <UIcon name="i-heroicons-calendar" class="mx-auto h-12 w-12 text-slate-300" />
          <p class="mt-2 text-slate-600">No upcoming sessions</p>
        </div>

        <UCard
          v-for="session in upcomingSessions"
          :key="session.id"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-100">
                <UIcon name="i-heroicons-video-camera" class="h-7 w-7 text-primary-600" />
              </div>
              <div>
                <p class="font-semibold text-slate-900">
                  {{ session.subscription?.course?.label || 'Session' }}
                </p>
                <p class="text-sm text-slate-600">{{ formatDateTime(session.start_at) }}</p>
                <p v-if="session.subscription?.teacher?.display_name" class="text-xs text-slate-500">
                  with {{ session.subscription.teacher.display_name }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <UBadge :color="canJoinSession(session) ? 'success' : 'info'" variant="soft">
                {{ canJoinSession(session) ? 'Ready to Join' : 'Scheduled' }}
              </UBadge>
              <UButton
                v-if="session.zoom_join_url"
                :color="canJoinSession(session) ? 'primary' : 'neutral'"
                :variant="canJoinSession(session) ? 'solid' : 'outline'"
                size="sm"
                :href="session.zoom_join_url"
                target="_blank"
              >
                <UIcon name="i-heroicons-video-camera" class="mr-1 h-4 w-4" />
                Join Zoom
              </UButton>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Past Sessions -->
      <div v-if="activeTab === 'past'" class="space-y-4">
        <div v-if="pastSessions.length === 0" class="py-12 text-center">
          <UIcon name="i-heroicons-clock" class="mx-auto h-12 w-12 text-slate-300" />
          <p class="mt-2 text-slate-600">No past sessions</p>
        </div>

        <UCard
          v-for="session in pastSessions"
          :key="session.id"
          :class="{ 'opacity-60': session.status === 'cancelled' }"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div 
                class="flex h-14 w-14 items-center justify-center rounded-xl"
                :class="{
                  'bg-green-100': session.status === 'completed',
                  'bg-red-100': session.status === 'cancelled' || session.status.includes('no_show'),
                  'bg-amber-100': session.status.includes('postpone'),
                  'bg-slate-100': !['completed', 'cancelled'].includes(session.status) && !session.status.includes('no_show') && !session.status.includes('postpone')
                }"
              >
                <UIcon 
                  :name="getSessionIcon(session)" 
                  class="h-7 w-7"
                  :class="{
                    'text-green-600': session.status === 'completed',
                    'text-red-500': session.status === 'cancelled' || session.status.includes('no_show'),
                    'text-amber-600': session.status.includes('postpone'),
                    'text-slate-400': !['completed', 'cancelled'].includes(session.status) && !session.status.includes('no_show') && !session.status.includes('postpone')
                  }"
                />
              </div>
              <div>
                <p class="font-semibold text-slate-700">
                  {{ session.subscription?.course?.label || 'Session' }}
                </p>
                <p class="text-sm text-slate-600">{{ formatDateTime(session.start_at) }}</p>
                <p v-if="session.subscription?.teacher?.display_name" class="text-xs text-slate-500">
                  with {{ session.subscription.teacher.display_name }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <UBadge :color="getStatusColor(session.status)" variant="soft">
                {{ session.status.replace(/_/g, ' ') }}
              </UBadge>
              <UButton
                v-if="session.status === 'completed'"
                variant="outline"
                color="primary"
                size="sm"
                :to="`/student/sessions/${session.id}/rate`"
              >
                <UIcon name="i-heroicons-star" class="mr-1 h-4 w-4" />
                Rate
              </UButton>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

