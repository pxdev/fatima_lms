<template>
  <span>{{ displayValue }}</span>
</template>

<script setup lang="ts">
interface Props {
  time: string // Time string in HH:mm format (e.g., "09:00")
  showToggle?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showToggle: true
})

// Use global toggle state
const { isToggled } = useTimezoneToggle()

const { formatTimeRaw } = useTimezone()

const displayValue = computed(() => {
  if (!props.time) return ''
  
  // Normalize time to HH:mm format (remove seconds if present)
  // Database might store "09:00:00" but we want to display "09:00"
  const normalizedTime = props.time.substring(0, 5) // Take first 5 characters (HH:mm)
  
  // Parse HH:mm format (e.g., "09:00")
  const [hours, minutes] = normalizedTime.split(':').map(Number)
  if (isNaN(hours) || isNaN(minutes)) return normalizedTime
  
  // Always show in 24-hour format (HH:mm) to match original format
  // For time-only strings, we can't do timezone conversion, so we just normalize the format
  // The toggle state doesn't change the format, just ensures consistent display
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
})
</script>

