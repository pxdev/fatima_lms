<script setup lang="ts">
import { CalendarDate, today, getLocalTimeZone } from '@internationalized/date'

definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

useSeoMeta({
  title: 'Teacher Dashboard',
  description: 'Manage your students and sessions'
})

const { profile, fetchProfile } = useProfile()
const { getItems } = useDirectusItems()

interface TeacherSubscription {
  id: string
  student: {
    id: string
    display_name: string
  }
  course: {
    id: string
    label: string
  }
  status: string
  sessions_remaining: number
  sessions_total: number
}

interface UpcomingSession {
  id: string
  start_at: string
  end_at: string
  status: string
  subscription: {
    student: {
      display_name: string
    }
    course: {
      label: string
    }
  }
  zoom_join_url: string | null
}

const subscriptions = ref<TeacherSubscription[]>([])
const upcomingSessions = ref<UpcomingSession[]>([])
const allSessions = ref<UpcomingSession[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)

// Calendar state
const selectedDate = ref<CalendarDate>(today(getLocalTimeZone()))

// Get sessions for the selected date
const sessionsForSelectedDate = computed(() => {
  if (!selectedDate.value) return []
  
  const selectedDateStr = `${selectedDate.value.year}-${String(selectedDate.value.month).padStart(2, '0')}-${String(selectedDate.value.day).padStart(2, '0')}`
  
  return allSessions.value.filter(session => {
    const sessionDate = session.start_at.split('T')[0]
    return sessionDate === selectedDateStr
  })
})

// Check if a date has sessions (for calendar markers)
function isDateWithSession(date: CalendarDate): boolean {
  const dateStr = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`
  return allSessions.value.some(session => session.start_at.split('T')[0] === dateStr)
}

// Watch for profile changes (e.g., timezone updates) and refresh data
watch(() => profile.value?.timezone, async () => {
  if (profile.value?.role === 'teacher') {
    await loadData()
  }
})

onMounted(async () => {
  // Sync session statuses first (auto-complete expired sessions)
  try {
    await $fetch('/api/sessions/sync-status', { method: 'POST' })
  } catch (err) {
    console.warn('Failed to sync session statuses:', err)
  }
  
  await fetchProfile()
  
  if (profile.value?.role !== 'teacher') {
    navigateTo('/student/dashboard')
    return
  }

  await loadData()
})

async function loadData() {
  if (!profile.value?.id) return

  isLoading.value = true
  error.value = null

  try {
    // Fetch teacher's subscriptions
    const subsData = await getItems<TeacherSubscription>({
      collection: 'subscriptions',
      params: {
        filter: {
          teacher: { _eq: profile.value.id },
          status: { _in: ['teacher_assigned', 'active'] }
        },
        fields: ['id', 'status', 'sessions_remaining', 'sessions_total',
                 'student.id', 'student.display_name',
                 'course.id', 'course.label'],
        sort: ['-date_created']
      }
    })
    subscriptions.value = subsData || []

    // Fetch upcoming sessions using subscription IDs
    const subIds = subscriptions.value.map(s => s.id)
    if (subIds.length > 0) {
      const now = new Date().toISOString()
      
      // Fetch sessions for next 60 days for calendar view
      const sixtyDaysLater = new Date()
      sixtyDaysLater.setDate(sixtyDaysLater.getDate() + 60)
      
      const sessionsData = await getItems<UpcomingSession>({
        collection: 'sessions',
        params: {
          filter: {
            _and: [
              { subscription: { _in: subIds } },
              { status: { _in: ['scheduled', 'in_progress'] } },
              { start_at: { _gte: now } },
              { start_at: { _lte: sixtyDaysLater.toISOString() } }
            ]
          },
          fields: ['id', 'start_at', 'end_at', 'status', 'zoom_join_url',
                   'subscription.student.display_name',
                   'subscription.course.label'],
          sort: ['start_at'],
          limit: -1
        }
      })
      allSessions.value = sessionsData || []
      // First 5 for the list view
      upcomingSessions.value = (sessionsData || []).slice(0, 5)
    } else {
      allSessions.value = []
      upcomingSessions.value = []
    }
  } catch (err: any) {
    error.value = err?.message || 'Failed to load data'
  } finally {
    isLoading.value = false
  }
}

const { formatDateTime: formatDateTimeTz, formatTime: formatTimeTz } = useTimezone()

function formatDateTime(dateStr: string): string {
  return formatDateTimeTz(dateStr)
}

function formatTime(dateStr: string): string {
  return formatTimeTz(dateStr)
}

function formatSelectedDate(date: CalendarDate): string {
  const d = new Date(date.year, date.month - 1, date.day)
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    teacher_assigned: 'primary',
    active: 'success',
    scheduled: 'info',
    completed: 'success'
  }
  return colors[status] || 'neutral'
}

function canJoinNow(session: UpcomingSession): boolean {
  const now = new Date()
  const start = new Date(session.start_at)
  const diffMinutes = (start.getTime() - now.getTime()) / (1000 * 60)
  return diffMinutes <= 15 && !!session.zoom_join_url
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">
          Welcome{{ profile?.display_name ? `, ${profile.display_name}` : '' }}!
        </h1>
        <p class="mt-1 text-slate-600">Manage your students and sessions</p>
      </div>
      <UButton
        color="primary"
        variant="solid"
        size="xl"
        to="/teacher/availability"
        class="hidden sm:flex"
      >
        <UIcon name="i-heroicons-clock" class="mr-2 h-5 w-5" />
        Availability
      </UButton>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="space-y-6">
      <div class="grid gap-6 lg:grid-cols-3">
        <USkeleton class="h-80 rounded-xl" />
        <USkeleton class="h-80 rounded-xl lg:col-span-2" />
      </div>
      <div class="grid gap-6 lg:grid-cols-2">
        <USkeleton class="h-64 rounded-xl" />
        <USkeleton class="h-64 rounded-xl" />
      </div>
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

    <div v-else class="space-y-6">
      <!-- Calendar Section -->
      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Calendar -->
        <UCard class="lg:col-span-1">
          <template #header>
            <h2 class="text-lg font-semibold text-slate-900">My Schedule</h2>
          </template>

          <div class="flex justify-center">
            <UCalendar 
              v-model="selectedDate"
              class="w-full"
            >
              <template #day="{ day }">
                <div class="relative flex h-full w-full items-center justify-center">
                  {{ day.day }}
                  <!-- Session indicator dot -->
                  <span 
                    v-if="isDateWithSession(day)"
                    class="absolute bottom-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary-500"
                  />
                </div>
              </template>
            </UCalendar>
          </div>

          <!-- Legend -->
          <div class="mt-4 flex items-center justify-center gap-4 text-xs text-slate-500">
            <div class="flex items-center gap-1">
              <span class="h-2 w-2 rounded-full bg-primary-500" />
              <span>Has Sessions</span>
            </div>
          </div>
        </UCard>

        <!-- Selected Date Sessions -->
        <UCard class="lg:col-span-2">
          <template #header>
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-lg font-semibold text-slate-900">
                  {{ formatSelectedDate(selectedDate) }}
                </h2>
                <p class="text-sm text-slate-500">
                  {{ sessionsForSelectedDate.length }} session{{ sessionsForSelectedDate.length !== 1 ? 's' : '' }} scheduled
                </p>
              </div>
              <UButton variant="outline" color="info" size="xl" to="/teacher/sessions">
                <UIcon name="i-heroicons-calendar-days" class="mr-2 h-5 w-5" />
                View All
              </UButton>
            </div>
          </template>

          <div v-if="sessionsForSelectedDate.length === 0" class="py-12 text-center">
            <UIcon name="i-heroicons-calendar" class="mx-auto h-16 w-16 text-slate-200" />
            <p class="mt-4 text-slate-600">No sessions on this day</p>
            <p class="text-sm text-slate-400">Select another date or check the upcoming sessions</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="session in sessionsForSelectedDate"
              :key="session.id"
              class="flex items-center justify-between rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4 transition-all hover:shadow-md"
            >
              <div class="flex items-center gap-4">
                <!-- Time Badge -->
                <div class="flex flex-col items-center rounded-lg bg-primary-100 px-3 py-2">
                  <span class="text-lg font-bold text-primary-700">{{ formatTime(session.start_at) }}</span>
                  <span class="text-xs text-primary-500">{{ formatTime(session.end_at) }}</span>
                </div>
                
                <div>
                  <p class="font-semibold text-slate-900">
                    {{ session.subscription?.student?.display_name || 'Student' }}
                  </p>
                  <p class="text-sm text-slate-600">
                    {{ session.subscription?.course?.label || 'Course' }}
                  </p>
                  <UBadge 
                    :color="canJoinNow(session) ? 'success' : 'info'" 
                    variant="soft" 
                    size="sm"
                    class="mt-1"
                  >
                    {{ canJoinNow(session) ? 'Ready to Join' : 'Scheduled' }}
                  </UBadge>
                </div>
              </div>
              
              <UButton
                v-if="session.zoom_join_url"
                :color="canJoinNow(session) ? 'success' : 'neutral'"
                :variant="canJoinNow(session) ? 'solid' : 'outline'"
                size="xl"
                :href="session.zoom_join_url"
                target="_blank"
              >
                <UIcon name="i-heroicons-video-camera" class="mr-2 h-5 w-5" />
                {{ canJoinNow(session) ? 'Join Now' : 'Join Zoom' }}
              </UButton>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Bottom Section: Next Sessions & Students -->
      <div class="grid gap-6 lg:grid-cols-2">
        <!-- Next Upcoming Sessions -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-slate-900">Next Sessions</h2>
              <UBadge v-if="upcomingSessions.length > 0" color="primary" variant="soft" size="lg">
                {{ allSessions.length }} total
              </UBadge>
            </div>
          </template>

          <div v-if="upcomingSessions.length === 0" class="py-8 text-center">
            <UIcon name="i-heroicons-calendar" class="mx-auto h-12 w-12 text-slate-300" />
            <p class="mt-2 text-slate-600">No upcoming sessions</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="session in upcomingSessions"
              :key="session.id"
              class="flex items-center justify-between rounded-lg bg-slate-50 p-4"
            >
              <div>
                <p class="font-medium text-slate-900">
                  {{ session.subscription?.student?.display_name || 'Student' }}
                </p>
                <p class="text-sm text-slate-600">
                  {{ formatDateTime(session.start_at) }}
                </p>
                <p class="text-xs text-slate-500">
                  {{ session.subscription?.course?.label || 'Course' }}
                </p>
              </div>
              <UButton
                v-if="session.zoom_join_url"
                :color="canJoinNow(session) ? 'success' : 'neutral'"
                :variant="canJoinNow(session) ? 'solid' : 'outline'"
                size="xl"
                :href="session.zoom_join_url"
                target="_blank"
              >
                <UIcon name="i-heroicons-video-camera" class="mr-2 h-5 w-5" />
                Join
              </UButton>
            </div>
          </div>
        </UCard>

        <!-- My Students -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-slate-900">My Students</h2>
              <UBadge color="success" variant="soft" size="lg">
                {{ subscriptions.length }} active
              </UBadge>
            </div>
          </template>

          <div v-if="subscriptions.length === 0" class="py-8 text-center">
            <UIcon name="i-heroicons-users" class="mx-auto h-12 w-12 text-slate-300" />
            <p class="mt-2 text-slate-600">No students assigned yet</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="sub in subscriptions"
              :key="sub.id"
              class="flex items-center justify-between rounded-lg bg-slate-50 p-4"
            >
              <div class="flex-1">
                <p class="font-medium text-slate-900">
                  {{ sub.student?.display_name || 'Student' }}
                </p>
                <p class="text-sm text-slate-600">
                  {{ sub.course?.label || 'Course' }}
                </p>
                <div class="mt-2 flex items-center gap-2">
                  <UBadge :color="getStatusColor(sub.status)" variant="soft" size="lg">
                    {{ sub.status.replace(/_/g, ' ') }}
                  </UBadge>
                  <span class="text-xs text-slate-500">
                    {{ sub.sessions_remaining }}/{{ sub.sessions_total }} sessions left
                  </span>
                </div>
              </div>
              <UButton
                color="info"
                variant="outline"
                size="xl"
                :to="`/teacher/subscriptions/${sub.id}`"
              >
                <UIcon name="i-heroicons-eye" class="mr-2 h-5 w-5" />
                View
              </UButton>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>


