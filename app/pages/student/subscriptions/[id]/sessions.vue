<script setup lang="ts">
import { parseISO, isAfter, isBefore, differenceInMinutes } from 'date-fns'

definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

const route = useRoute()
const subscriptionId = computed(() => route.params.id as string)

useSeoMeta({
  title: 'My Sessions',
  description: 'View and manage your sessions'
})

const { 
  sessions, 
  isLoading, 
  error, 
  fetchSessions, 
  requestPostpone,
  getStatusColor, 
  formatSessionTime,
  canJoinSession,
  joinSession 
} = useSessions()
const { profile, fetchProfile } = useProfile()

const showPostponeModal = ref(false)
const selectedSession = ref<any>(null)
const postponeReason = ref('')

// Throttled postpone action
const { execute: throttledPostpone, isLoading: isRequesting } = useThrottledAction(
  async () => {
    await doPostpone()
  },
  { throttleMs: 1000 }
)

onMounted(async () => {
  // Sync session statuses first (auto-complete expired sessions)
  try {
    await $fetch('/api/sessions/sync-status', { method: 'POST' })
  } catch (err) {
    console.warn('Failed to sync session statuses:', err)
  }
  
  await Promise.all([
    fetchProfile(),
    fetchSessions(subscriptionId.value)
  ])
})

function openPostponeModal(session: any) {
  selectedSession.value = session
  postponeReason.value = ''
  showPostponeModal.value = true
}

async function doPostpone() {
  if (!selectedSession.value || !postponeReason.value.trim()) return

  try {
    await requestPostpone(selectedSession.value.id, postponeReason.value)
    showPostponeModal.value = false
    await fetchSessions(subscriptionId.value)
  } catch (err) {
    console.error('Failed to request postpone:', err)
  }
}

function handlePostpone() {
  throttledPostpone()
}

function getUpcomingSessions() {
  const now = new Date()
  return sessions.value.filter(s => 
    isAfter(parseISO(s.start_at), now) && 
    ['scheduled', 'in_progress'].includes(s.status)
  )
}

function getPastSessions() {
  const now = new Date()
  return sessions.value.filter(s => 
    isBefore(parseISO(s.start_at), now) || 
    !['scheduled', 'in_progress'].includes(s.status)
  ).sort((a, b) => parseISO(b.start_at).valueOf() - parseISO(a.start_at).valueOf()) // Most recent first
}

function isSessionMissed(session: any): boolean {
  const now = new Date()
  return isBefore(parseISO(session.start_at), now) && session.status === 'scheduled'
}

function getSessionIcon(session: any): string {
  if (session.status === 'completed') return 'i-heroicons-check-circle'
  if (session.status === 'cancelled') return 'i-heroicons-x-circle'
  if (isSessionMissed(session)) return 'i-heroicons-clock'
  if (session.status.includes('no_show')) return 'i-heroicons-exclamation-circle'
  if (session.status.includes('postpone')) return 'i-heroicons-arrow-path'
  return 'i-heroicons-video-camera'
}

function getSessionIconColor(session: any): string {
  if (session.status === 'completed') return 'bg-green-100 text-green-600'
  if (session.status === 'cancelled') return 'bg-red-100 text-red-500'
  if (isSessionMissed(session)) return 'bg-amber-100 text-amber-600'
  if (session.status.includes('no_show')) return 'bg-red-100 text-red-500'
  if (session.status.includes('postpone')) return 'bg-amber-100 text-amber-600'
  return 'bg-slate-100 text-slate-400'
}

function getDisplayStatus(session: any): string {
  if (isSessionMissed(session)) return 'missed'
  return session.status
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-primary-50/30 py-12">
    <div class="mx-auto max-w-4xl px-4">
      <!-- Back Link -->
      <div class="mb-6">
        <UButton
          variant="ghost"
          color="neutral"
          :to="`/student/subscriptions/${subscriptionId}`"
          size="sm"
        >
          <UIcon name="i-heroicons-arrow-left" class="mr-1 h-4 w-4" />
          Back to Subscription
        </UButton>
      </div>

      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-slate-900">My Sessions</h1>
        <p class="mt-2 text-slate-600">View and manage your scheduled sessions</p>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="space-y-4">
        <USkeleton v-for="i in 4" :key="i" class="h-24 w-full rounded-xl" />
      </div>

      <!-- Error -->
      <UAlert
        v-else-if="error"
        color="error"
        variant="soft"
        icon="i-heroicons-exclamation-triangle"
        :title="error"
      />

      <!-- Empty State -->
      <UCard v-else-if="sessions.length === 0" class="py-12 text-center">
        <UIcon name="i-heroicons-calendar" class="mx-auto h-16 w-16 text-slate-300" />
        <h3 class="mt-4 text-lg font-semibold text-slate-900">No Sessions Yet</h3>
        <p class="mt-2 text-slate-600">Sessions will appear here once your schedule is approved.</p>
      </UCard>

      <!-- Sessions List -->
      <div v-else class="space-y-8">
        <!-- Upcoming Sessions -->
        <div v-if="getUpcomingSessions().length > 0">
          <h2 class="mb-4 text-lg font-semibold text-slate-900">Upcoming Sessions</h2>
          <div class="space-y-4">
            <UCard
              v-for="session in getUpcomingSessions()"
              :key="session.id"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <div class="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-100">
                    <UIcon name="i-heroicons-video-camera" class="h-7 w-7 text-primary-600" />
                  </div>
                  <div>
                    <p class="font-semibold text-slate-900">
                      {{ formatSessionTime(session) }}
                    </p>
                    <div class="mt-1 flex items-center gap-2">
                      <UBadge :color="getStatusColor(session.status)" variant="soft" size="sm">
                        {{ session.status.replace(/_/g, ' ') }}
                      </UBadge>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <UButton
                    v-if="session.status === 'scheduled'"
                    variant="outline"
                    color="warning"
                    size="sm"
                    @click="openPostponeModal(session)"
                  >
                    Request Postpone
                  </UButton>
                  <UButton
                    v-if="canJoinSession(session)"
                    color="primary"
                    @click="joinSession(session)"
                  >
                    <UIcon name="i-heroicons-video-camera" class="mr-2 h-4 w-4" />
                    Join Now
                  </UButton>
                  <UButton
                    v-else-if="session.zoom_join_url"
                    variant="outline"
                    color="neutral"
                    disabled
                  >
                    Join (opens soon)
                  </UButton>
                </div>
              </div>
            </UCard>
          </div>
        </div>

        <!-- Past Sessions -->
        <div v-if="getPastSessions().length > 0">
          <h2 class="mb-4 text-lg font-semibold text-slate-900">Past Sessions</h2>
          <div class="space-y-4">
            <UCard
              v-for="session in getPastSessions()"
              :key="session.id"
              :class="{ 'opacity-60': session.status === 'cancelled' }"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <div 
                    class="flex h-14 w-14 items-center justify-center rounded-xl"
                    :class="getSessionIconColor(session)"
                  >
                    <UIcon :name="getSessionIcon(session)" class="h-7 w-7" />
                  </div>
                  <div>
                    <p class="font-semibold text-slate-700">
                      {{ formatSessionTime(session) }}
                    </p>
                    <div class="mt-1 flex items-center gap-2">
                      <UBadge 
                        :color="isSessionMissed(session) ? 'warning' : getStatusColor(session.status)" 
                        variant="soft" 
                        size="sm"
                      >
                        {{ getDisplayStatus(session).replace(/_/g, ' ') }}
                      </UBadge>
                      <span v-if="isSessionMissed(session)" class="text-xs text-amber-600">
                        Session time passed
                      </span>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <UButton
                    v-if="session.status === 'completed'"
                    variant="outline"
                    color="primary"
                    size="sm"
                    :to="`/student/sessions/${session.id}/rate`"
                  >
                    <UIcon name="i-heroicons-star" class="mr-1 h-4 w-4" />
                    Rate Session
                  </UButton>
                  <UBadge 
                    v-else-if="isSessionMissed(session)" 
                    color="warning" 
                    variant="soft"
                  >
                    Contact teacher
                  </UBadge>
                </div>
              </div>
            </UCard>
          </div>
        </div>
      </div>

      <!-- Postpone Modal -->
      <UModal v-model:open="showPostponeModal">
        <template #content>
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">Request Postpone</h3>
            </template>

            <p class="mb-4 text-slate-600">
              Please provide a reason for postponing this session.
            </p>

            <UTextarea
              v-model="postponeReason"
              placeholder="Enter your reason..."
              :rows="3"
              class="w-full"
            />

            <template #footer>
              <div class="flex justify-end gap-3">
                <UButton
                  color="neutral"
                  variant="outline"
                  :disabled="isRequesting"
                  @click="showPostponeModal = false"
                >
                  Cancel
                </UButton>
                <UButton
                  color="warning"
                  :loading="isRequesting"
                  :disabled="!postponeReason.trim()"
                  @click="handlePostpone"
                >
                  Submit Request
                </UButton>
              </div>
            </template>
          </UCard>
        </template>
      </UModal>
    </div>
  </div>
</template>

