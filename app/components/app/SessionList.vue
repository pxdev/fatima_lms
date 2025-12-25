<script setup lang="ts">
import { parseISO } from 'date-fns'

interface SessionWithDetails {
  id: string
  start_at: string
  end_at: string
  status: string
  zoom_join_url: string | null
  subscription?: {
    id: string
    teacher?: {
      display_name: string
    } | null
    course?: {
      label: string
    } | null
  } | null
}

interface Props {
  sessions: SessionWithDetails[]
  loading?: boolean
  enableFilters?: boolean
  compact?: boolean
  maxItems?: number | null
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  enableFilters: true,
  compact: false,
  maxItems: null
})

const activeFilter = ref<'all' | 'upcoming' | 'completed' | 'cancelled' | 'postponed' | 'no_show'>('all')

const filterOptions = [
  { key: 'all', label: 'All Sessions', icon: 'hugeicons:search-list-02' },
  { key: 'upcoming', label: 'Upcoming', icon: 'hugeicons:calendar-03' },
  { key: 'completed', label: 'Completed', icon: 'hugeicons:checkmark-circle-02' },
  { key: 'cancelled', label: 'Cancelled', icon: 'hugeicons:cancel-02' },
  { key: 'postponed', label: 'Postponed', icon: 'hugeicons:arrow-path' },
  { key: 'no_show', label: 'No Show', icon: 'hugeicons:warning-02' }
]

const now = computed(() => new Date())

const filterCounts = computed(() => {
  const counts: Record<string, number> = {
    all: props.sessions.length,
    upcoming: 0,
    completed: 0,
    cancelled: 0,
    postponed: 0,
    no_show: 0
  }

  for (const s of props.sessions) {
    const status = s.status
    const start = parseISO(s.start_at)
    const isUpcoming = start >= now.value && ['scheduled', 'in_progress'].includes(status)

    if (isUpcoming) counts.upcoming++
    if (status === 'completed') counts.completed++
    if (status === 'cancelled') counts.cancelled++
    if (status.includes('postpone')) counts.postponed++
    if (status.includes('no_show')) counts.no_show++
  }

  return counts
})

const activeFilterOption = computed(() => {
  return filterOptions.find(f => f.key === activeFilter.value) ?? filterOptions[0]
})

const filteredSessions = computed(() => {
  let list = [...props.sessions]

  if (activeFilter.value === 'upcoming') {
    list = list.filter(s => {
      const start = parseISO(s.start_at)
      return start >= now.value && ['scheduled', 'in_progress'].includes(s.status)
    })
  } else if (activeFilter.value === 'completed') {
    list = list.filter(s => s.status === 'completed')
  } else if (activeFilter.value === 'cancelled') {
    list = list.filter(s => s.status === 'cancelled')
  } else if (activeFilter.value === 'postponed') {
    list = list.filter(s => s.status.includes('postpone'))
  } else if (activeFilter.value === 'no_show') {
    list = list.filter(s => s.status.includes('no_show'))
  }

  if (props.maxItems && props.maxItems > 0) {
    list = list.slice(0, props.maxItems)
  }

  return list
})

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

function getStatusLabel(status: string): string {
  return status.replace(/_/g, ' ')
}

function getSessionIcon(status: string): string {
  if (status === 'completed') return 'i-heroicons-check-circle'
  if (status === 'cancelled') return 'i-heroicons-x-circle'
  if (status.includes('no_show')) return 'i-heroicons-exclamation-circle'
  if (status.includes('postpone')) return 'i-heroicons-arrow-path'
  return 'i-heroicons-video-camera'
}

function canJoinSession(session: SessionWithDetails): boolean {
  if (!session.zoom_join_url) return false
  if (!['scheduled', 'in_progress'].includes(session.status)) return false

  const start = parseISO(session.start_at)
  const diffMinutes = (start.valueOf() - now.value.valueOf()) / (1000 * 60)
  return diffMinutes <= 15
}

// Removed formatDateTime - using DateTimeDisplay component instead
</script>

<template>
  <div class="space-y-4">
    <!-- Filters -->
    <div
      v-if="enableFilters"
      class="flex items-center justify-between"
    >
      <UDropdownMenu
        :items="filterOptions.map(filter => ({
          label: filter.label,
          icon: filter.icon,
          onClick: () => { activeFilter = filter.key as any },
          badge: (filterCounts[filter.key] ?? 0) > 0
            ? (filterCounts[filter.key] ?? 0).toString()
            : undefined
        }))"
        :ui="{
          content: 'w-72 py-2',
          item: 'flex items-center gap-3 text-base py-2.5 px-4 text-slate-700 hover:bg-slate-50 data-[active=true]:bg-primary-50 data-[active=true]:text-primary-700 data-[disabled=true]:opacity-40 data-[disabled=true]:cursor-not-allowed',
          label: 'flex-1'
        }"
      >
        <UButton
          variant="outline"
          color="neutral"
          size="lg"
          class="min-w-[220px] justify-between"
        >
          <div class="flex items-center gap-3">
            <UIcon
              :name="activeFilterOption?.icon ?? 'hugeicons:list-01'"
              class="w-5 h-5 text-slate-600"
            />
            <span class="font-medium">
              {{ activeFilterOption?.label ?? 'All Sessions' }}
            </span>
            <UBadge
              v-if="(filterCounts[activeFilter] ?? 0) > 0"
              color="primary"
              variant="soft"
              size="sm"
            >
              {{ filterCounts[activeFilter] ?? 0 }}
            </UBadge>
          </div>
          <UIcon name="hugeicons:arrow-down-01" class="w-4 h-4 ml-2 text-slate-400" />
        </UButton>
      </UDropdownMenu>

      <div class="text-sm text-slate-600">
        <span class="font-semibold text-slate-900">{{ filteredSessions.length }}</span>
        {{ filteredSessions.length === 1 ? 'session' : 'sessions' }}
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <USkeleton
        v-for="i in 3"
        :key="i"
        class="h-20 w-full rounded-xl"
      />
    </div>

    <!-- Empty -->
    <UCard
      v-else-if="filteredSessions.length === 0"
      class="py-10 text-center"
    >
      <UIcon
        name="i-heroicons-calendar"
        class="mx-auto h-12 w-12 text-slate-300"
      />
      <h3 class="mt-3 text-lg font-semibold text-slate-900">
        No sessions found
      </h3>
      <p class="mt-1 text-sm text-slate-600">
        Try changing the filter or check back later.
      </p>
    </UCard>

    <!-- List -->
    <div
      v-else
      class="space-y-3"
    >
      <UCard
        v-for="session in filteredSessions"
        :key="session.id"
        class="group"
        :class="compact ? 'py-3 px-3 sm:px-4' : ''"
      >
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-4 min-w-0">
            <div
              class="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl flex-shrink-0 transition-colors duration-200"
              :class="{
                'bg-green-100': session.status === 'completed',
                'bg-red-100': session.status === 'cancelled' || session.status.includes('no_show'),
                'bg-amber-100': session.status.includes('postpone'),
                'bg-primary-50': ['scheduled', 'in_progress'].includes(session.status),
                'bg-slate-100': !['completed', 'cancelled'].includes(session.status) &&
                  !session.status.includes('no_show') &&
                  !session.status.includes('postpone') &&
                  !['scheduled', 'in_progress'].includes(session.status)
              }"
            >
              <UIcon
                :name="getSessionIcon(session.status)"
                class="h-6 w-6"
                :class="{
                  'text-green-600': session.status === 'completed',
                  'text-red-500': session.status === 'cancelled' || session.status.includes('no_show'),
                  'text-amber-600': session.status.includes('postpone'),
                  'text-primary-600': ['scheduled', 'in_progress'].includes(session.status),
                  'text-slate-500': !['completed', 'cancelled'].includes(session.status) &&
                    !session.status.includes('no_show') &&
                    !session.status.includes('postpone') &&
                    !['scheduled', 'in_progress'].includes(session.status)
                }"
              />
            </div>

            <div class="min-w-0">
              <p class="font-semibold text-slate-900 truncate">
                {{ session.subscription?.course?.label || 'Session' }}
              </p>
              <p class="text-sm text-slate-600">
                <DateTimeDisplay :date="session.start_at" type="datetime" />
              </p>
              <p
                v-if="session.subscription?.teacher?.display_name"
                class="text-xs text-slate-500 truncate"
              >
                with {{ session.subscription.teacher.display_name }}
              </p>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0">
            <UBadge
              :color="getStatusColor(session.status)"
              variant="soft"
              size="sm"
              class="capitalize"
            >
              {{ getStatusLabel(session.status) }}
            </UBadge>

            <UButton
              v-if="session.zoom_join_url && ['scheduled', 'in_progress'].includes(session.status)"
              :color="canJoinSession(session) ? 'primary' : 'neutral'"
              :variant="canJoinSession(session) ? 'solid' : 'outline'"
              size="sm"
              :href="session.zoom_join_url"
              target="_blank"
              class="min-w-[120px]"
            >
              <UIcon
                name="i-heroicons-video-camera"
                class="mr-1.5 h-4 w-4"
              />
              <span class="hidden sm:inline">
                {{ canJoinSession(session) ? 'Join Now' : 'View Link' }}
              </span>
              <span class="sm:hidden">
                Join
              </span>
            </UButton>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>


