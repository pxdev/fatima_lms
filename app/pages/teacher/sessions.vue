<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

useSeoMeta({
  title: 'My Sessions',
  description: 'Manage your teaching sessions'
})

const { profile, fetchProfile } = useProfile()
const { getItems } = useDirectusItems()

interface TeacherSession {
  id: string
  start_at: string
  end_at: string
  status: string
  zoom_start_url: string | null
  zoom_join_url: string | null
  subscription: {
    id: string
    student: {
      display_name: string
    }
    course: {
      label: string
    }
  }
}

const sessions = ref<TeacherSession[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)
const isCompleting = ref<Record<string, boolean>>({})

onMounted(async () => {
  await fetchProfile()
  
  if (profile.value?.role !== 'teacher') {
    navigateTo('/student/dashboard')
    return
  }

  await loadSessions()
})

async function loadSessions() {
  if (!profile.value?.id) return

  isLoading.value = true
  error.value = null

  try {
    const data = await getItems<TeacherSession>({
      collection: 'sessions',
      params: {
        filter: {
          'subscription.teacher': { _eq: profile.value.id }
        },
        fields: ['id', 'start_at', 'end_at', 'status', 'zoom_start_url', 'zoom_join_url',
                 'subscription.id', 'subscription.student.display_name',
                 'subscription.course.label'],
        sort: ['-start_at'],
        limit: 50
      }
    })

    sessions.value = data || []
  } catch (err: any) {
    error.value = err?.message || 'Failed to load sessions'
  } finally {
    isLoading.value = false
  }
}

async function completeSession(sessionId: string) {
  isCompleting.value[sessionId] = true

  try {
    await $fetch(`/api/sessions/${sessionId}/complete`, {
      method: 'POST'
    })

    await loadSessions()
  } catch (err: any) {
    error.value = err?.data?.statusMessage || 'Failed to complete session'
  } finally {
    isCompleting.value[sessionId] = false
  }
}

async function approvePostpone(sessionId: string) {
  try {
    await $fetch(`/api/sessions/${sessionId}/approve-postpone`, {
      method: 'POST'
    })

    await loadSessions()
  } catch (err: any) {
    error.value = err?.data?.statusMessage || 'Failed to approve postpone'
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

function startSession(session: TeacherSession) {
  if (session.zoom_start_url) {
    window.open(session.zoom_start_url, '_blank')
  } else if (session.zoom_join_url) {
    window.open(session.zoom_join_url, '_blank')
  }
}

function getUpcomingSessions() {
  const now = new Date()
  return sessions.value.filter(s => 
    new Date(s.start_at) > now && 
    ['scheduled'].includes(s.status)
  )
}

function getPostponeRequests() {
  return sessions.value.filter(s => s.status === 'student_requested_postpone')
}

function getRecentSessions() {
  return sessions.value.filter(s => 
    !['scheduled', 'student_requested_postpone'].includes(s.status)
  ).slice(0, 10)
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-slate-900">My Sessions</h1>
      <p class="mt-1 text-slate-600">Manage your teaching schedule</p>
    </div>

      <!-- Loading -->
      <div v-if="isLoading" class="space-y-4">
        <USkeleton v-for="i in 5" :key="i" class="h-24 w-full" />
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

      <div v-else class="space-y-8">
        <!-- Postpone Requests -->
        <UCard v-if="getPostponeRequests().length > 0">
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-slate-900">Postpone Requests</h2>
              <UBadge color="warning">{{ getPostponeRequests().length }} pending</UBadge>
            </div>
          </template>

          <div class="space-y-4">
            <div
              v-for="session in getPostponeRequests()"
              :key="session.id"
              class="flex items-center justify-between rounded-lg bg-amber-50 p-4"
            >
              <div>
                <p class="font-medium text-slate-900">
                  {{ session.subscription?.student?.display_name || 'Student' }}
                </p>
                <p class="text-sm text-slate-600">{{ formatDateTime(session.start_at) }}</p>
              </div>
              <UButton
                color="warning"
                size="sm"
                @click="approvePostpone(session.id)"
              >
                Approve Postpone
              </UButton>
            </div>
          </div>
        </UCard>

        <!-- Upcoming Sessions -->
        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold text-slate-900">Upcoming Sessions</h2>
          </template>

          <div v-if="getUpcomingSessions().length === 0" class="py-8 text-center">
            <UIcon name="i-heroicons-calendar" class="mx-auto h-12 w-12 text-slate-300" />
            <p class="mt-2 text-slate-600">No upcoming sessions</p>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="session in getUpcomingSessions()"
              :key="session.id"
              class="flex items-center justify-between rounded-lg bg-slate-50 p-4"
            >
              <div class="flex items-center gap-4">
                <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <UIcon name="i-heroicons-video-camera" class="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p class="font-medium text-slate-900">
                    {{ session.subscription?.student?.display_name || 'Student' }}
                  </p>
                  <p class="text-sm text-slate-600">{{ formatDateTime(session.start_at) }}</p>
                  <p class="text-xs text-slate-500">
                    {{ session.subscription?.course?.label || 'Course' }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <UButton
                  v-if="session.zoom_start_url"
                  color="primary"
                  @click="startSession(session)"
                >
                  Start Session
                </UButton>
                <UButton
                  color="success"
                  variant="outline"
                  :loading="isCompleting[session.id]"
                  @click="completeSession(session.id)"
                >
                  Mark Complete
                </UButton>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Recent Sessions -->
        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold text-slate-900">Recent Sessions</h2>
          </template>

          <div v-if="getRecentSessions().length === 0" class="py-8 text-center">
            <p class="text-slate-600">No recent sessions</p>
          </div>

          <UTable
            v-else
            :data="getRecentSessions()"
            :columns="[
              { id: 'student', header: 'Student' },
              { id: 'course', header: 'Course' },
              { id: 'start_at', header: 'Date/Time' },
              { id: 'status', header: 'Status' }
            ]"
          >
            <template #student-cell="{ row }">
              {{ row.original.subscription?.student?.display_name || '-' }}
            </template>
            <template #course-cell="{ row }">
              {{ row.original.subscription?.course?.label || '-' }}
            </template>
            <template #start_at-cell="{ row }">
              {{ formatDateTime(row.original.start_at) }}
            </template>
            <template #status-cell="{ row }">
              <UBadge :color="getStatusColor(row.original.status) as any" variant="soft" size="sm">
                {{ row.original.status.replace(/_/g, ' ') }}
              </UBadge>
            </template>
          </UTable>
        </UCard>
      </div>
  </div>
</template>

