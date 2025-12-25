<template>
  <span>{{ displayValue }}</span>
</template>

<script setup lang="ts">
interface Props {
  date: string | Date | null
  type?: 'date' | 'time' | 'datetime'
  formatOptions?: Intl.DateTimeFormatOptions
  showToggle?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'datetime',
  showToggle: true
})

// Use global toggle state instead of local state
const { isToggled } = useTimezoneToggle()

const { 
  formats,
  timeZoneDate,
  formatDateRaw,
  formatTimeRaw,
  formatDateTimeRaw,
  userTimezone
} = useTimezone()

const displayValue = computed(() => {
  if (!props.date) return ''
  
  if (isToggled.value) {
    // Use timezone-aware formatting - convert to user's timezone
    return timeZoneDate(
      props.date,
      userTimezone.value,
      props.type,
      props.formatOptions
    )
  } else {
    // Use raw formatting (as stored in Directus - no timezone conversion)
    switch (props.type) {
      case 'date':
        // Determine format based on formatOptions
        let dateFormat = formats.date
        if (props.formatOptions?.weekday === 'long') {
          dateFormat = formats.dateLong
        } else if (props.formatOptions?.weekday === 'short') {
          dateFormat = formats.dateShort
        } else if (props.formatOptions?.month === 'long') {
          dateFormat = formats.dateLong
        }
        return formatDateRaw(props.date, { format: dateFormat })
      case 'time':
        return formatTimeRaw(props.date, { 
          format: formats.time,
          hour12: props.formatOptions?.hour12 !== false
        })
      case 'datetime':
        return formatDateTimeRaw(props.date, {
          format: formats.datetime,
          hour12: props.formatOptions?.hour12 !== false
        })
      default:
        return formatDateTimeRaw(props.date, {
          format: formats.datetime,
          hour12: props.formatOptions?.hour12 !== false
        })
    }
  }
})

// Toggle is now handled globally via useTimezoneToggle composable
</script>

