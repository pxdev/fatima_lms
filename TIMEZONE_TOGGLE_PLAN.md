# Timezone Toggle Feature - Implementation Plan

## Overview
Add a toggle button beside every date/time block in dashboard pages to switch between:
- **Default (Raw)**: Display dates/times exactly as stored in Directus (UTC/raw format)
- **Toggled (User Timezone)**: Display dates/times converted to user's profile timezone

## Current State Analysis

### Existing Infrastructure
1. **`useTimezone` composable** (`app/composables/useTimezone.ts`)
   - Currently converts ALL dates to user's timezone
   - Functions: `formatDate`, `formatTime`, `formatDateTime`, `formatSlotTime`, `formatDateOnly`
   - Uses `date-fns-tz` for timezone conversion

2. **`useWeekSlots` composable** (`app/composables/useWeekSlots.ts`)
   - `formatSlotTime` function shows dates as-is (raw from Directus)
   - Extracts date/time components directly from ISO string to avoid timezone conversion

3. **User Profile**
   - Has `timezone` field (e.g., 'Asia/Riyadh')
   - Accessible via `useProfile()` composable

### Pages That Display Dates/Times
1. **Student Dashboard** (`app/pages/student/dashboard.vue`)
   - Uses `formatDateTime` from `useTimezone` (converts to user timezone)

2. **Teacher Dashboard** (`app/pages/teacher/dashboard.vue`)
   - Uses `formatDateTime` and `formatTime` from `useTimezone` (converts to user timezone)

3. **Student Schedule** (`app/pages/student/subscriptions/[id]/schedule.vue`)
   - Uses `formatSlotTime` from `useWeekSlots` (shows raw)
   - Uses `format` from `date-fns` directly

4. **Teacher Sessions** (`app/pages/teacher/sessions.vue`)
   - Uses `formatDateTime` from `useTimezone` (converts to user timezone)

5. **Teacher Sessions Approval** (`app/pages/teacher/sessions-approval/index.vue`)
   - Uses `format` from `date-fns` directly
   - Uses `formatSlotTime` from `useWeekSlots`

6. **Teacher Subscriptions** (`app/pages/teacher/subscriptions/[id].vue`)
   - Uses `format` from `date-fns` directly

7. **Admin Pages** (`app/pages/admin/subscriptions/*.vue`)
   - Uses `formatDateOnly` from `useTimezone`

## Implementation Strategy

### Phase 1: Create Raw Formatting Functions
**File**: `app/composables/useTimezone.ts`

Add new functions that format dates/times WITHOUT timezone conversion:
- `formatDateRaw(dateStr, options?)` - Format date as stored (UTC)
- `formatTimeRaw(dateStr, options?)` - Format time as stored (UTC)
- `formatDateTimeRaw(dateStr, options?)` - Format date+time as stored (UTC)
- `formatSlotTimeRaw(slot)` - Format slot time as stored (UTC)

These functions will:
- Parse ISO strings directly
- Extract UTC components
- Format without timezone conversion
- Similar to current `useWeekSlots.formatSlotTime` approach

### Phase 2: Create Reusable Date/Time Display Component
**File**: `app/components/common/DateTimeDisplay.vue`

A reusable component that:
- Accepts `date` prop (ISO string or Date object)
- Accepts `type` prop ('date' | 'time' | 'datetime' | 'slot')
- Shows raw format by default
- Has a toggle button (icon button) beside the date/time
- When toggled, shows user timezone format
- Stores toggle state (local state per component instance)
- Uses appropriate formatting function based on `type`

**Props:**
```typescript
{
  date: string | Date
  type: 'date' | 'time' | 'datetime' | 'slot'
  slotEnd?: string // For slot type
  formatOptions?: Intl.DateTimeFormatOptions
  showToggle?: boolean // Default: true
}
```

**Slots:**
- Default slot for custom content
- `toggle` slot for custom toggle button

### Phase 3: Create Slot Time Display Component
**File**: `app/components/common/SlotTimeDisplay.vue`

Specialized component for slot times (start + end):
- Accepts `startAt` and `endAt` props
- Shows date on one line, time range on another (as currently done)
- Toggle button beside the date/time block
- Uses `formatSlotTimeRaw` by default
- Uses `formatSlotTime` from `useTimezone` when toggled

### Phase 4: Update All Dashboard Pages

Replace date/time formatting in all pages:

1. **Student Dashboard**
   - Replace `formatDateTime(session.start_at)` with `<DateTimeDisplay :date="session.start_at" type="datetime" />`

2. **Teacher Dashboard**
   - Replace `formatDateTime(session.start_at)` with `<DateTimeDisplay :date="session.start_at" type="datetime" />`
   - Replace `formatTime(session.start_at)` with `<DateTimeDisplay :date="session.start_at" type="time" />`

3. **Student Schedule**
   - Replace `getFormattedSlotTime(slot)` with `<SlotTimeDisplay :start-at="slot.start_at" :end-at="slot.end_at" />`

4. **Teacher Sessions**
   - Replace `formatDateTime(session.start_at)` with `<DateTimeDisplay :date="session.start_at" type="datetime" />`

5. **Teacher Sessions Approval**
   - Replace `format(parseISO(...))` with `<DateTimeDisplay :date="..." type="datetime" />`
   - Replace `formatSlotTimeDisplay(slot)` with `<SlotTimeDisplay :start-at="slot.start_at" :end-at="slot.end_at" />`

6. **Teacher Subscriptions**
   - Replace `format(parseISO(...))` with `<DateTimeDisplay :date="..." type="date" />`

7. **Admin Pages**
   - Replace `formatDateOnly(...)` with `<DateTimeDisplay :date="..." type="date" />`

### Phase 5: Optional - Global Toggle Preference

**File**: `app/composables/useTimezoneToggle.ts`

Create a composable to manage global toggle preference:
- Store preference in localStorage or user profile
- Provide `useTimezone` computed that returns true/false
- All components can optionally use this for global toggle state

**OR** keep it per-component (simpler, more flexible)

## Technical Details

### Raw Formatting Implementation

For raw formatting, we need to:
1. Parse ISO string: `2024-12-28T21:00:00Z`
2. Extract UTC components directly (avoid Date object timezone conversion)
3. Format using extracted components

Example for `formatDateTimeRaw`:
```typescript
function formatDateTimeRaw(dateStr: string | Date): string {
  if (!dateStr) return ''
  
  const isoStr = typeof dateStr === 'string' ? dateStr : dateStr.toISOString()
  const match = isoStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/)
  
  if (!match) {
    // Fallback to parseISO and use UTC methods
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
    return format(date, 'EEE, MMM d, h:mm a') // This will use local timezone, need UTC
  }
  
  const [, year, month, day, hours, minutes] = match
  const date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes)))
  return format(date, 'EEE, MMM d, h:mm a')
}
```

**Better approach**: Use UTC methods on Date object:
```typescript
function formatDateTimeRaw(dateStr: string | Date): string {
  if (!dateStr) return ''
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
  
  // Format using UTC components
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth()
  const day = date.getUTCDate()
  const hours = date.getUTCHours()
  const minutes = date.getUTCMinutes()
  
  const datePart = format(new Date(Date.UTC(year, month, day)), 'EEE, MMM d')
  const timePart = format(new Date(Date.UTC(2000, 0, 1, hours, minutes)), 'h:mm a')
  
  return `${datePart}, ${timePart}`
}
```

### Component Structure

```vue
<template>
  <div class="flex items-center gap-2">
    <span>{{ displayValue }}</span>
    <UButton
      v-if="showToggle"
      :icon="isToggled ? 'i-heroicons-globe-alt' : 'i-heroicons-clock'"
      size="xs"
      variant="ghost"
      color="gray"
      @click="toggle"
      :title="isToggled ? 'Show in original timezone' : 'Show in my timezone'"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  date: string | Date
  type: 'date' | 'time' | 'datetime' | 'slot'
  slotEnd?: string
  formatOptions?: Intl.DateTimeFormatOptions
  showToggle?: boolean
}>()

const isToggled = ref(false)
const { formatDateRaw, formatTimeRaw, formatDateTimeRaw } = useTimezoneRaw()
const { formatDate, formatTime, formatDateTime } = useTimezone()

const displayValue = computed(() => {
  if (isToggled.value) {
    // Use timezone-aware formatting
    switch (props.type) {
      case 'date': return formatDate(props.date, props.formatOptions)
      case 'time': return formatTime(props.date, props.formatOptions)
      case 'datetime': return formatDateTime(props.date, props.formatOptions)
      default: return formatDateTime(props.date, props.formatOptions)
    }
  } else {
    // Use raw formatting
    switch (props.type) {
      case 'date': return formatDateRaw(props.date, props.formatOptions)
      case 'time': return formatTimeRaw(props.date, props.formatOptions)
      case 'datetime': return formatDateTimeRaw(props.date, props.formatOptions)
      default: return formatDateTimeRaw(props.date, props.formatOptions)
    }
  }
})

function toggle() {
  isToggled.value = !isToggled.value
}
</script>
```

## File Structure

```
app/
├── composables/
│   ├── useTimezone.ts (extend with raw functions)
│   └── useTimezoneRaw.ts (new - raw formatting functions)
├── components/
│   └── common/
│       ├── DateTimeDisplay.vue (new)
│       └── SlotTimeDisplay.vue (new)
└── pages/
    ├── student/
    │   ├── dashboard.vue (update)
    │   └── subscriptions/[id]/schedule.vue (update)
    ├── teacher/
    │   ├── dashboard.vue (update)
    │   ├── sessions.vue (update)
    │   ├── sessions-approval/index.vue (update)
    │   └── subscriptions/[id].vue (update)
    └── admin/
        └── subscriptions/*.vue (update)
```

## Testing Checklist

- [ ] Raw dates show as stored in Directus (UTC)
- [ ] Toggle button appears beside each date/time
- [ ] Toggled dates show in user's profile timezone
- [ ] Toggle state is independent per component
- [ ] Works for all date/time types (date, time, datetime, slot)
- [ ] Works across all dashboard pages
- [ ] Handles edge cases (null dates, invalid dates)
- [ ] UI is responsive and accessible

## Notes

- Keep toggle state local to each component (not global) for flexibility
- Use consistent icon for toggle button (clock icon for raw, globe icon for timezone)
- Consider adding tooltip to explain what the toggle does
- Ensure raw formatting matches exactly what's in Directus (no conversion)





