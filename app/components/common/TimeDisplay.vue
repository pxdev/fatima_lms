<template>
  <span>{{ displayValue }}</span>
</template>

<script setup lang="ts">
import { formatInTimeZone } from 'date-fns-tz'

interface Props {
  time: string // Time string in HH:mm or HH:mm:ss format (e.g., "09:00" or "09:00:00")
  showToggle?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showToggle: true
})

// Use global toggle state
const { isToggled } = useTimezoneToggle()
const { userTimezone } = useTimezone()

const displayValue = computed(() => {
  if (!props.time) return ''
  
  // Normalize time to HH:mm format (remove seconds if present)
  // Database might store "09:00:00" but we want to parse "09:00"
  const normalizedTime = props.time.substring(0, 5) // Take first 5 characters (HH:mm)
  
  // Parse HH:mm format (e.g., "09:00")
  const [hours, minutes] = normalizedTime.split(':').map(Number)
  if (isNaN(hours) || isNaN(minutes)) return normalizedTime
  
  if (isToggled.value) {
    // Convert to user's timezone
    // Create a datetime object using today's date with the time from server (assumed to be in server timezone, typically UTC)
    const today = new Date()
    const serverDate = new Date(Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate(),
      hours, // Server time hours (assumed UTC)
      minutes
    ))
    
    // Convert to user's timezone and format
    const convertedTime = formatInTimeZone(serverDate, userTimezone.value, 'h:mm a')
    return convertedTime
  } else {
    // Show in 24-hour format (HH:mm) when toggle is OFF - same as stored in Directus
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  }
})
</script>

