<template>
  <div class="flex flex-col">
    <span class="font-medium">{{ displayValue.date }}</span>
    <span class="text-sm text-slate-600">{{ displayValue.time }}</span>
  </div>
</template>

<script setup lang="ts">
import { parseISO } from 'date-fns'

interface Props {
  startAt: string | null
  endAt: string | null
  showToggle?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showToggle: true
})

// Use global toggle state instead of local state
const { isToggled } = useTimezoneToggle()

const { 
  timeZoneDate,
  formatSlotTimeRaw,
  userTimezone
} = useTimezone()

const displayValue = computed(() => {
  if (!props.startAt || !props.endAt) {
    return { date: '', time: '' }
  }
  
  if (isToggled.value) {
    // Use timezone-aware formatting - convert to user's timezone
    // Format date part (same for start and end)
    const dateStr = timeZoneDate(
      props.startAt,
      userTimezone.value,
      'date',
      { weekday: 'short', month: 'short', day: 'numeric' }
    )
    
    // Format time parts
    const startTime = timeZoneDate(props.startAt, userTimezone.value, 'time')
    const endTime = timeZoneDate(props.endAt, userTimezone.value, 'time')
    
    return {
      date: dateStr,
      time: `${startTime} - ${endTime}`
    }
  } else {
    // Use raw formatting (as stored in Directus - no timezone conversion)
    return formatSlotTimeRaw({
      start_at: props.startAt,
      end_at: props.endAt
    })
  }
})

// Toggle is now handled globally via useTimezoneToggle composable
</script>

