<script setup lang="ts">
import { parseISO, differenceInMinutes, isAfter, isBefore } from 'date-fns'
import PagesHeader from '~/components/app/PagesHeader.vue'

definePageMeta({
  middleware: 'auth',
  layout: 'default'
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

</script>

<template>
  <div>
    <!-- Header -->
    <PagesHeader
      :title="'My Sessions'"
      :description="'View and manage all your learning sessions'"
      :crumbs="[
        { label: 'Home', to: '/student/dashboard' },
        { label: 'My Sessions' }
      ]"
    />
    
    <u-container>

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
      <SessionList :sessions="sessions" />
    </div>
    </u-container>
  </div>
</template>

