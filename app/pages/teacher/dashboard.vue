<script setup lang="ts">
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
const isLoading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
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

    // Fetch upcoming sessions
    const now = new Date().toISOString()
    const sessionsData = await getItems<UpcomingSession>({
      collection: 'sessions',
      params: {
        filter: {
          _and: [
            { 'subscription.teacher': { _eq: profile.value.id } },
            { status: { _eq: 'scheduled' } },
            { start_at: { _gte: now } }
          ]
        },
        fields: ['id', 'start_at', 'end_at', 'status', 'zoom_join_url',
                 'subscription.student.display_name',
                 'subscription.course.label'],
        sort: ['start_at'],
        limit: 5
      }
    })
    upcomingSessions.value = sessionsData || []
  } catch (err: any) {
    error.value = err?.message || 'Failed to load data'
  } finally {
    isLoading.value = false
  }
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
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
        to="/teacher/availability"
        class="hidden sm:flex"
      >
        <UIcon name="i-heroicons-clock" class="mr-2 h-4 w-4" />
        Availability
      </UButton>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="grid gap-6 md:grid-cols-2">
      <USkeleton class="h-64" />
      <USkeleton class="h-64" />
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

    <div v-else class="grid gap-6 lg:grid-cols-2">
        <!-- Upcoming Sessions -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-slate-900">Upcoming Sessions</h2>
              <UButton variant="ghost" size="sm" to="/teacher/sessions">
                View All
              </UButton>
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
                color="primary"
                size="sm"
                :href="session.zoom_join_url"
                target="_blank"
              >
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
              <UBadge color="primary" variant="soft">
                {{ subscriptions.length }} active
              </UBadge>
            </div>
          </template>

          <div v-if="subscriptions.length === 0" class="py-8 text-center">
            <UIcon name="i-heroicons-users" class="mx-auto h-12 w-12 text-slate-300" />
            <p class="mt-2 text-slate-600">No students assigned yet</p>
          </div>

          <div v-else class="space-y-3">
            <NuxtLink
              v-for="sub in subscriptions"
              :key="sub.id"
              :to="`/teacher/subscriptions/${sub.id}`"
              class="block rounded-lg bg-slate-50 p-4 transition-colors hover:bg-slate-100"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium text-slate-900">
                    {{ sub.student?.display_name || 'Student' }}
                  </p>
                  <p class="text-sm text-slate-600">
                    {{ sub.course?.label || 'Course' }}
                  </p>
                </div>
                <div class="text-right">
                  <UBadge :color="getStatusColor(sub.status)" variant="soft" size="sm">
                    {{ sub.status.replace(/_/g, ' ') }}
                  </UBadge>
                  <p class="mt-1 text-xs text-slate-500">
                    {{ sub.sessions_remaining }}/{{ sub.sessions_total }} sessions left
                  </p>
                </div>
              </div>
            </NuxtLink>
          </div>
        </UCard>
      </div>
  </div>
</template>

