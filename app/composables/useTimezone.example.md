# Timezone Date Formatting - Usage Guide

## Global Function: `timeZoneDate`

The `timeZoneDate` function is a global, reusable function that converts server dates/times to the user's timezone for display only (does not modify server data).

### Function Signature

```typescript
timeZoneDate(
  dateStr: string | Date | null,
  targetTimezone?: string,
  type: 'date' | 'time' | 'datetime' = 'datetime',
  options?: Intl.DateTimeFormatOptions
): string
```

### Parameters

- `dateStr`: Server date/time string (e.g., "2025-12-24T18:23:00Z") or Date object
- `targetTimezone`: Target timezone (optional, defaults to user's profile timezone)
- `type`: Display type - `'date'`, `'time'`, or `'datetime'` (default: `'datetime'`)
- `options`: Formatting options (optional) - same as Intl.DateTimeFormatOptions

### Examples

```vue
<script setup>
const { timeZoneDate, userTimezone } = useTimezone()

// Server date: "2025-12-24T18:23:00Z"
const serverDate = '2025-12-24T18:23:00Z'

// Convert to user's timezone as datetime
const displayDateTime = timeZoneDate(serverDate, userTimezone.value, 'datetime')
// Result: "Wed, Dec 24, 9:23 PM" (converted to user's timezone)

// Convert to user's timezone as date only
const displayDate = timeZoneDate(serverDate, userTimezone.value, 'date')
// Result: "Dec 24, 2025"

// Convert to user's timezone as time only
const displayTime = timeZoneDate(serverDate, userTimezone.value, 'time')
// Result: "9:23 PM"

// Convert to specific timezone
const nyTime = timeZoneDate(serverDate, 'America/New_York', 'datetime')
// Result: "Wed, Dec 24, 1:23 PM" (converted to New York timezone)

// With custom format options
const longDate = timeZoneDate(serverDate, userTimezone.value, 'date', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric'
})
// Result: "Wednesday, December 24, 2025"
</script>
```

### Using with Global Toggle

The function respects the global timezone toggle state. Use it with components:

```vue
<template>
  <!-- This component automatically uses timeZoneDate when toggle is on -->
  <DateTimeDisplay :date="serverDate" type="datetime" />
  
  <!-- Or use directly in computed properties -->
  <p>{{ formattedDate }}</p>
</template>

<script setup>
const { timeZoneDate, userTimezone } = useTimezone()
const { isToggled } = useTimezoneToggle()

const formattedDate = computed(() => {
  if (isToggled.value) {
    // Convert to user's timezone
    return timeZoneDate(serverDate.value, userTimezone.value, 'datetime')
  } else {
    // Show raw format (use formatDateTimeRaw or formatDateRaw)
    return formatDateTimeRaw(serverDate.value)
  }
})
</script>
```

### Important Notes

1. **Server Data Never Changes**: This function only converts for display. The server always stores dates in UTC/ISO format.

2. **Global Toggle**: The toggle button in `DashboardTopBar` controls whether dates are shown in raw format (as stored) or converted to user's timezone.

3. **Reusable Everywhere**: Use this function in any page, component, or composable for consistent timezone conversion.

4. **Format Consistency**: All date/time formats are centralized in `useTimezone` composable for easy maintenance.




