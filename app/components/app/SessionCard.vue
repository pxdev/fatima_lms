<script setup lang="ts">
import { parseISO } from 'date-fns'
import DateTimeDisplay from '~/components/common/DateTimeDisplay.vue'

export interface SessionCardData {
  id: string
  start_at: string
  end_at: string
  status: string
  zoom_join_url?: string | null
  subscription?: {
    id: string
    teacher?: {
      id: string
      display_name: string
    } | null
    student?: {
      id: string
      display_name: string
    } | null
    course?: {
      id: string
      label: string
    } | null
  } | null
}

interface Props {
  session: SessionCardData
  compact?: boolean
  showJoinButton?: boolean
  showTeacher?: boolean
  showStudent?: boolean
  variant?: 'default' | 'minimal' | 'detailed'
  dateTimeType?: 'date' | 'time' | 'datetime' // Type of date/time display
  showEndTime?: boolean // Show end time separately
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
  showJoinButton: true,
  showTeacher: false,
  showStudent: false,
  variant: 'default',
  dateTimeType: 'datetime',
  showEndTime: false
})

const emit = defineEmits<{
  join: [session: SessionCardData]
  click: [session: SessionCardData]
}>()

const now = computed(() => new Date())

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

function getIconBgColor(status: string): string {
  if (status === 'completed') return 'bg-green-100'
  if (status === 'cancelled' || status.includes('no_show')) return 'bg-red-100'
  if (status.includes('postpone')) return 'bg-amber-100'
  if (['scheduled', 'in_progress'].includes(status)) return 'bg-primary-50'
  return 'bg-slate-100'
}

function getIconColor(status: string): string {
  if (status === 'completed') return 'text-green-600'
  if (status === 'cancelled' || status.includes('no_show')) return 'text-red-500'
  if (status.includes('postpone')) return 'text-amber-600'
  if (['scheduled', 'in_progress'].includes(status)) return 'text-primary-600'
  return 'text-slate-500'
}

function canJoinSession(): boolean {
  if (!props.session.zoom_join_url) return false
  if (!['scheduled', 'in_progress'].includes(props.session.status)) return false

  const start = parseISO(props.session.start_at)
  const diffMinutes = (start.valueOf() - now.value.valueOf()) / (1000 * 60)
  return diffMinutes <= 15
}

function handleJoin() {
  if (props.session.zoom_join_url) {
    emit('join', props.session)
    window.open(props.session.zoom_join_url, '_blank')
  }
}

function handleClick() {
  emit('click', props.session)
}
</script>

<template>
  <UCard
    class="group transition-all duration-200"
    :class="[
      compact ? 'py-3 px-3 sm:px-4' : '',
      { 'cursor-pointer hover:shadow-md': $attrs.onClick }
    ]"
    v-bind="$attrs"
    @click="handleClick"
  >
    <div class="flex items-center justify-between gap-4">
      <!-- Left: Icon and Info -->
      <div class="flex items-center gap-4 min-w-0 flex-1">
        <!-- Status Icon -->
        <div
          class="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl flex-shrink-0 transition-colors duration-200"
          :class="getIconBgColor(session.status)"
        >
          <UIcon
            :name="getSessionIcon(session.status)"
            class="h-6 w-6"
            :class="getIconColor(session.status)"
          />
        </div>

        <!-- Session Details -->
        <div class="min-w-0 flex-1">
          <!-- Course/Title -->
          <p class="font-semibold text-slate-900 truncate">
            {{ session.subscription?.course?.label || 'Session' }}
          </p>

          <!-- Date/Time -->
          <div class="text-sm text-slate-600">
            <DateTimeDisplay :date="session.start_at" :type="dateTimeType" />
            <span v-if="showEndTime" class="ml-2">
              - <DateTimeDisplay :date="session.end_at" type="time" />
            </span>
          </div>

          <!-- Teacher or Student Name -->
          <p
            v-if="showTeacher && session.subscription?.teacher?.display_name"
            class="text-xs text-slate-500 truncate"
          >
            with {{ session.subscription.teacher.display_name }}
          </p>
          <p
            v-else-if="showStudent && session.subscription?.student?.display_name"
            class="text-xs text-slate-500 truncate"
          >
            {{ session.subscription.student.display_name }}
          </p>
        </div>
      </div>

      <!-- Right: Status Badge and Actions -->
      <div class="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0">
        <!-- Status Badge -->
        <UBadge
          :color="getStatusColor(session.status)"
          variant="soft"
          size="sm"
          class="capitalize"
        >
          {{ getStatusLabel(session.status) }}
        </UBadge>

        <!-- Join Button -->
        <UButton
          v-if="showJoinButton && session.zoom_join_url && ['scheduled', 'in_progress'].includes(session.status)"
          :color="canJoinSession() ? 'primary' : 'neutral'"
          :variant="canJoinSession() ? 'solid' : 'outline'"
          size="sm"
          @click.stop="handleJoin"
          class="min-w-[120px]"
        >
          <UIcon
            name="i-heroicons-video-camera"
            class="mr-1.5 h-4 w-4"
          />
          <span class="hidden sm:inline">
            {{ canJoinSession() ? 'Join Now' : 'View Link' }}
          </span>
          <span class="sm:hidden">
            Join
          </span>
        </UButton>
      </div>
    </div>
  </UCard>
</template>

