<script setup lang="ts">
import { parseISO, differenceInMinutes } from 'date-fns'

definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

useSeoMeta({
  title: 'Student Dashboard',
  description: 'Your learning dashboard'
})

const { profile, fetchProfile, isLoading: profileLoading } = useProfile()
const { subscriptions, fetchMySubscriptions, isLoading: subsLoading } = useSubscriptions()
const { getItems } = useDirectusItems()
const { packages, fetchPackages } = usePackages()
const { courses, fetchCourses } = useCourses()

interface UpcomingSession {
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

const upcomingSessions = ref<UpcomingSession[]>([])
const sessionsLoading = ref(false)

const isLoading = computed(() => profileLoading.value || subsLoading.value)

onMounted(async () => {
  // Sync session statuses first (auto-complete expired sessions)
  try {
    await $fetch('/api/sessions/sync-status', { method: 'POST' })
  } catch (err) {
    console.warn('Failed to sync session statuses:', err)
  }
  
  await Promise.all([
    fetchProfile(),
    fetchCourses(),
    fetchPackages()
  ])
  
  if (profile.value?.id) {
    await Promise.all([
      fetchMySubscriptions(profile.value.id),
      loadUpcomingSessions()
    ])
  }
})

async function loadUpcomingSessions() {
  if (!profile.value?.id) return
  
  sessionsLoading.value = true
  
  try {
    // Get subscription IDs for this student
    const subIds = subscriptions.value.map(s => s.id)
    
    // If no subscriptions loaded yet, fetch them first
    if (subIds.length === 0) {
      await fetchMySubscriptions(profile.value.id)
    }
    
    const activeSubIds = subscriptions.value
      .filter(s => ['active', 'teacher_assigned'].includes(s.status))
      .map(s => s.id)
    
    if (activeSubIds.length === 0) {
      upcomingSessions.value = []
      return
    }

    const now = new Date().toISOString()
    const data = await getItems<UpcomingSession>({
      collection: 'sessions',
      params: {
        filter: {
          _and: [
            { subscription: { _in: activeSubIds } },
            { status: { _in: ['scheduled', 'in_progress'] } },
            { start_at: { _gte: now } }
          ]
        },
        fields: ['id', 'start_at', 'end_at', 'status', 'zoom_join_url',
                 'subscription.id', 'subscription.teacher.display_name',
                 'subscription.course.label'],
        sort: ['start_at'],
        limit: 5
      }
    })
    
    upcomingSessions.value = data || []
  } catch (err) {
    console.error('Failed to load upcoming sessions:', err)
    upcomingSessions.value = []
  } finally {
    sessionsLoading.value = false
  }
}

const { formatDateTime: formatDateTimeTz } = useTimezone()

function formatDateTime(dateStr: string): string {
  return formatDateTimeTz(dateStr)
}

function canJoinSession(session: UpcomingSession): boolean {
  if (!session.zoom_join_url) return false
  
  const now = new Date()
  const start = parseISO(session.start_at)
  const diffMinutes = differenceInMinutes(start, now)
  
  // Can join 15 minutes before
  return diffMinutes <= 15
}

function joinSession(session: UpcomingSession) {
  if (session.zoom_join_url) {
    window.open(session.zoom_join_url, '_blank')
  }
}

function getActiveSubscription() {
  return subscriptions.value.find(s => 
    ['active', 'teacher_assigned', 'payment_received'].includes(s.status)
  )
}

function getPendingSubscriptions() {
  return subscriptions.value.filter(s => 
    ['draft', 'pending_payment'].includes(s.status)
  )
}
</script>

<template>
  <div>
    <!-- Breadcrumbs -->
    <UBreadcrumb 
      :items="[
        { label: 'Dashboard', icon: 'i-heroicons-home' }
      ]" 
      class="mb-6"
    />

    <!-- Header -->
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">
          Welcome back{{ profile?.display_name ? `, ${profile.display_name}` : '' }}!
        </h1>
        <p class="mt-1 text-slate-600">Manage your learning journey</p>
      </div>
      <UButton
        color="primary"
        variant="solid"
        size="xl"
        to="/student/subscribe"
        class="hidden sm:flex"
      >
        <UIcon name="i-heroicons-plus" class="mr-2 h-5 w-5" />
        New Subscription
      </UButton>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="grid gap-6 md:grid-cols-2">
      <USkeleton v-for="i in 3" :key="i" class="h-48 rounded-xl" />
    </div>

    <!-- Content -->
    <div v-else>
      <!-- Empty State -->
      <UCard v-if="subscriptions.length === 0" class="text-center py-12">
        <UIcon name="i-heroicons-academic-cap" class="mx-auto h-16 w-16 text-slate-300" />
        <h3 class="mt-4 text-lg font-semibold text-slate-900">No Subscriptions Yet</h3>
        <p class="mt-2 text-slate-600">Start your learning journey by creating a new subscription.</p>
        <UButton
          color="primary"
          variant="solid"
          size="xl"
          class="mt-6"
          to="/student/subscribe"
        >
          <UIcon name="i-heroicons-rocket-launch" class="mr-2 h-5 w-5" />
          Get Started
        </UButton>
      </UCard>

      <template v-else>
        <!-- Upcoming Sessions -->
        <UCard class="mb-6">
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-slate-900">Upcoming Sessions</h2>
              <UBadge v-if="upcomingSessions.length > 0" color="primary" variant="soft">
                {{ upcomingSessions.length }} scheduled
              </UBadge>
            </div>
          </template>

          <!-- Sessions Loading -->
          <div v-if="sessionsLoading" class="space-y-3">
            <USkeleton v-for="i in 2" :key="i" class="h-20 w-full" />
          </div>

          <!-- No Sessions -->
          <div v-else-if="upcomingSessions.length === 0" class="py-8 text-center">
            <UIcon name="i-heroicons-calendar" class="mx-auto h-12 w-12 text-slate-300" />
            <p class="mt-2 text-slate-600">No upcoming sessions scheduled</p>
            <p class="text-sm text-slate-500">Sessions will appear here once your teacher schedules them</p>
          </div>

          <!-- Sessions List -->
          <div v-else class="space-y-3">
            <div
              v-for="session in upcomingSessions"
              :key="session.id"
              class="flex items-center justify-between rounded-lg bg-slate-50 p-4"
            >
              <div class="flex items-center gap-4">
                <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
                  <UIcon name="i-heroicons-video-camera" class="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <p class="font-medium text-slate-900">
                    {{ session.subscription?.course?.label || 'Session' }}
                  </p>
                  <p class="text-sm text-slate-600">{{ formatDateTime(session.start_at) }}</p>
                  <p v-if="session.subscription?.teacher?.display_name" class="text-xs text-slate-500">
                    with {{ session.subscription.teacher.display_name }}
                  </p>
                </div>
              </div>
              
              <div class="flex items-center gap-3">
                <UBadge :color="canJoinSession(session) ? 'success' : 'info'" variant="soft" size="lg">
                  {{ canJoinSession(session) ? 'Ready to Join' : 'Scheduled' }}
                </UBadge>
                <UButton
                  v-if="session.zoom_join_url"
                  :color="canJoinSession(session) ? 'success' : 'neutral'"
                  :variant="canJoinSession(session) ? 'solid' : 'outline'"
                  size="xl"
                  :href="session.zoom_join_url"
                  target="_blank"
                >
                  <UIcon name="i-heroicons-video-camera" class="mr-2 h-5 w-5" />
                  Join Zoom
                </UButton>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Subscriptions Grid -->
        <h2 class="mb-4 text-lg font-semibold text-slate-900">My Subscriptions</h2>
        <div class="grid gap-6 md:grid-cols-2">
          <SubscriptionCard
            v-for="sub in subscriptions"
            :key="sub.id"
            :subscription="sub"
            variant="compact"
          />
        </div>
      </template>
    </div>
  </div>
</template>

