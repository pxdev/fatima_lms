<script setup lang="ts">
import { CalendarDate, today, getLocalTimeZone } from '@internationalized/date'
import { format, isBefore, isSameDay, startOfDay, parseISO, getHours, getMinutes, getDay } from 'date-fns'

definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

const route = useRoute()
const subscriptionId = computed(() => route.params.id as string)

useSeoMeta({
  title: 'Schedule Sessions',
  description: 'Schedule your weekly sessions'
})

const { currentSubscription, fetchSubscription } = useSubscriptions()
const { weeks, currentWeek, fetchWeeks, getOrCreateWeek, submitWeek, getStatusColor: getWeekStatusColor } = useWeeks()
const { slots, fetchSlots, createSlot, deleteSlot, formatSlotTime, isLoading: slotsLoading } = useWeekSlots()
const { packages, fetchPackages, getPackageById } = usePackages()
const { getItems, getItemById } = useDirectusItems()

// Store all slots from all weeks to check for duplicates
const allSlots = ref<any[]>([])
const { 
  rules: teacherAvailability, 
  fetchRules: fetchTeacherAvailability, 
  getAvailableSlotsForDate,
  hasAvailabilityOnWeekday,
  getWeekdayLabel,
  isLoading: availabilityLoading
} = useTeacherAvailability()

const selectedWeekIndex = ref(1)
const error = ref<string | null>(null)
const success = ref<string | null>(null)
const isPageLoading = ref(true)

// Calendar state
const selectedDate = ref<CalendarDate>(today(getLocalTimeZone()))
const selectedSlot = ref<{ start_time: string; end_time: string } | null>(null)

// Minimum selectable date (today)
const minDate = computed(() => today(getLocalTimeZone()))

// Check if a date is in the past
function isPastDate(date: CalendarDate): boolean {
  const dateObj = new Date(date.year, date.month - 1, date.day)
  const todayObj = startOfDay(new Date())
  return isBefore(dateObj, todayObj)
}

// Throttled actions
const { execute: throttledAddSlot, isLoading: isSaving } = useThrottledAction(
  async () => {
    await doAddSlot()
  },
  { throttleMs: 1000 }
)

const { execute: throttledSubmitWeek, isLoading: isSubmitting } = useThrottledAction(
  async () => {
    await doSubmitWeek()
  },
  { throttleMs: 1000 }
)

const deletingSlotId = ref<string | null>(null)
const isDeleting = ref(false)

const selectedPackage = computed(() => 
  currentSubscription.value ? getPackageById(currentSubscription.value.package) : null
)

const requiredSlots = computed(() => selectedPackage.value?.sessions_per_week || 2)

const canSubmit = computed(() => 
  currentWeek.value?.status === 'draft' && 
  slots.value.length >= requiredSlots.value
)


// Check if a week is complete (has all required slots)
function isWeekComplete(weekIndex: number): boolean {
  const week = weeks.value.find(w => w.week_index === weekIndex)
  if (!week) return false
  
  // If week is already submitted/approved, it's complete
  if (week.status !== 'draft') return true
  
  // For draft weeks, check if they have all required slots
  // We need to check slots for that specific week
  const weekSlots = allSlots.value.filter(slot => {
    const slotWeek = weeks.value.find(w => w.id === slot.week)
    return slotWeek?.week_index === weekIndex
  })
  
  return weekSlots.length >= requiredSlots.value
}

// Get week status for display
function getWeekStatus(weekIndex: number): 'complete' | 'incomplete' | 'submitted' | 'approved' {
  const week = weeks.value.find(w => w.week_index === weekIndex)
  if (!week) return 'incomplete'
  
  if (week.status === 'approved') return 'approved'
  if (week.status === 'submitted') return 'submitted'
  if (week.status === 'draft') {
    return isWeekComplete(weekIndex) ? 'complete' : 'incomplete'
  }
  
  return 'incomplete'
}

// Get available slots for the selected date (no timezone conversion - show as teacher set them)
const availableSlotsForSelectedDate = computed(() => {
  if (!selectedDate.value) return []
  
  const date = new Date(selectedDate.value.year, selectedDate.value.month - 1, selectedDate.value.day)
  const slots = getAvailableSlotsForDate(date)
  
  // Return slots exactly as teacher set them (no conversion)
  return slots.map(slot => ({
    start_time: slot.start_time,
    end_time: slot.end_time
  }))
})

// Check if teacher has availability set
const hasTeacherAvailability = computed(() => {
  return teacherAvailability.value.filter(r => r.is_active).length > 0
})

// Check if a date has teacher availability (for calendar markers)
// Also excludes past dates
function isDateAvailable(date: CalendarDate): boolean {
  // Don't show badge for past dates
  const dateObj = new Date(date.year, date.month - 1, date.day)
  const today = startOfDay(new Date())
  if (isBefore(dateObj, today)) {
    return false
  }
  
  const weekday = getDay(dateObj)
  return hasAvailabilityOnWeekday(weekday)
}

// Check if a slot (date + time) already exists in any week
// startTime and endTime should be in HH:mm format (teacher's original time)
function isSlotAlreadyTaken(date: CalendarDate, startTime: string, endTime: string): boolean {
  if (!date || !startTime || !endTime) return false
  
  const dateStr = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`
  const [startHours, startMinutes] = startTime.split(':').map(Number)
  const [endHours, endMinutes] = endTime.split(':').map(Number)
  
  // Create date objects for comparison
  const startDate = new Date(date.year, date.month - 1, date.day, startHours, startMinutes)
  const endDate = new Date(date.year, date.month - 1, date.day, endHours, endMinutes)
  
  // Check if any existing slot matches this date and time
  return allSlots.value.some(slot => {
    // Compare dates (ignore timezone, just check if same day and time)
    const slotStart = parseISO(slot.start_at)
    const slotEnd = parseISO(slot.end_at)
    
    // Check if same date
    const sameDate = isSameDay(slotStart, startDate)
    
    if (!sameDate) return false
    
    // Check if same time (compare hours and minutes)
    const sameStartTime = getHours(slotStart) === getHours(startDate) &&
                         getMinutes(slotStart) === getMinutes(startDate)
    const sameEndTime = getHours(slotEnd) === getHours(endDate) &&
                       getMinutes(slotEnd) === getMinutes(endDate)
    
    return sameStartTime && sameEndTime
  })
}

// Get which week a slot is already scheduled in
function getSlotWeekNumber(date: CalendarDate, startTime: string, endTime: string): number | null {
  if (!date || !startTime || !endTime) return null
  
  const [startHours, startMinutes] = startTime.split(':').map(Number)
  const [endHours, endMinutes] = endTime.split(':').map(Number)
  
  const startDate = new Date(date.year, date.month - 1, date.day, startHours, startMinutes)
  const endDate = new Date(date.year, date.month - 1, date.day, endHours, endMinutes)
  
  // Find the matching slot
  const matchingSlot = allSlots.value.find(slot => {
    const slotStart = parseISO(slot.start_at)
    const slotEnd = parseISO(slot.end_at)
    
    const sameDate = isSameDay(slotStart, startDate)
    
    if (!sameDate) return false
    
    const sameStartTime = getHours(slotStart) === getHours(startDate) &&
                         getMinutes(slotStart) === getMinutes(startDate)
    const sameEndTime = getHours(slotEnd) === getHours(endDate) &&
                       getMinutes(slotEnd) === getMinutes(endDate)
    
    return sameStartTime && sameEndTime
  })
  
  if (!matchingSlot) return null
  
  // Find which week this slot belongs to
  const week = weeks.value.find(w => w.id === matchingSlot.week)
  return week ? week.week_index : null
}

// Fetch all slots from all weeks for duplicate checking
async function fetchAllSlots() {
  if (!weeks.value || weeks.value.length === 0) {
    allSlots.value = []
    return
  }
  
  try {
    const weekIds = weeks.value.map(w => w.id)
    if (weekIds.length === 0) {
      allSlots.value = []
      return
    }
    
    const slotsData = await getItems({
      collection: 'week_slots',
      params: {
        filter: {
          week: { _in: weekIds }
        },
        fields: ['id', 'week', 'start_at', 'end_at']
      }
    })
    
    allSlots.value = slotsData || []
  } catch (err) {
    console.error('Failed to fetch all slots:', err)
    allSlots.value = []
  }
}

// Format the selected date for display
function formatSelectedDate(): string {
  if (!selectedDate.value) return ''
  const date = new Date(selectedDate.value.year, selectedDate.value.month - 1, selectedDate.value.day)
  return format(date, 'EEEE, MMMM d, yyyy')
}

// Get weekday name for selected date
function getSelectedWeekday(): string {
  if (!selectedDate.value) return ''
  const date = new Date(selectedDate.value.year, selectedDate.value.month - 1, selectedDate.value.day)
  return getWeekdayLabel(getDay(date))
}

// Watch selectedDate to prevent selecting past dates
watch(selectedDate, (newDate) => {
  if (newDate && isPastDate(newDate)) {
    // Reset to today if user tries to select a past date
    selectedDate.value = today(getLocalTimeZone())
  }
})

onMounted(async () => {
  isPageLoading.value = true
  
  try {
    await Promise.all([
      fetchSubscription(subscriptionId.value),
      fetchPackages()
    ])

    // Fetch teacher's availability if subscription has a teacher assigned
    if (currentSubscription.value?.teacher) {
      await fetchTeacherAvailability(currentSubscription.value.teacher)
    }

    // Load weeks and select first draft week or create new one
    await fetchWeeks(subscriptionId.value)
    await loadWeek(selectedWeekIndex.value)
    // Fetch all slots for duplicate checking
    await fetchAllSlots()
  } finally {
    isPageLoading.value = false
  }
})

async function loadWeek(weekIndex: number) {
  selectedWeekIndex.value = weekIndex
  const week = await getOrCreateWeek(subscriptionId.value, weekIndex)
  if (week) {
    await fetchSlots(week.id)
    // Refresh all slots for duplicate checking
    await fetchAllSlots()
  }
}

function selectSlot(slot: { start_time: string; end_time: string }) {
  selectedSlot.value = slot
}

async function doAddSlot() {
  if (!currentWeek.value || !selectedSlot.value || !selectedDate.value) return

  error.value = null

  // Check if already reached the required number of slots
  if (slots.value.length >= requiredSlots.value) {
    error.value = `You can only add ${requiredSlots.value} session${requiredSlots.value === 1 ? '' : 's'} per week. Please remove a slot first if you want to change it.`
    return
  }

  try {
    // Use the selected slot times directly (no conversion)
    const startTime = selectedSlot.value.start_time
    const endTime = selectedSlot.value.end_time
    
    // Format date as YYYY-MM-DD
    const dateStr = `${selectedDate.value.year}-${String(selectedDate.value.month).padStart(2, '0')}-${String(selectedDate.value.day).padStart(2, '0')}`
    
    // Create datetime strings using the times directly
    // Store the time exactly as teacher set it, treating it as UTC
    // This way, 9:00 PM will always display as 9:00 PM regardless of browser timezone
    const [startHours, startMinutes] = startTime.split(':').map(Number)
    const [endHours, endMinutes] = endTime.split(':').map(Number)
    
    // Create ISO string treating the time as UTC (add 'Z' for UTC)
    const startDateTimeStr = `${dateStr}T${String(startHours).padStart(2, '0')}:${String(startMinutes).padStart(2, '0')}:00Z`
    const endDateTimeStr = `${dateStr}T${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00Z`
    
    // Use these directly as ISO strings (they're already in UTC format)
    const startAt = startDateTimeStr
    const endAt = endDateTimeStr

    // Check if slot already exists before creating
    if (isSlotAlreadyTaken(selectedDate.value, startTime, endTime)) {
      error.value = 'This time slot is already scheduled in another week'
      return
    }

    const created = await createSlot({
      week: currentWeek.value.id,
      start_at: startAt,
      end_at: endAt,
      note: null
    })

    if (!created) {
      error.value = 'Failed to create slot'
      return
    }

    // Refresh all slots after creating
    await fetchAllSlots()
    await fetchSlots(currentWeek.value.id) // Refresh current week's slots
    
    selectedSlot.value = null
    success.value = 'Session scheduled successfully!'
    setTimeout(() => success.value = null, 3000)
  } catch (err: any) {
    console.error('Error creating slot:', err)
    error.value = err?.data?.statusMessage || err?.message || 'Failed to schedule session'
  }
}


function handleAddSlot() {
  throttledAddSlot()
}

async function handleDeleteSlot(slotId: string) {
  if (isDeleting.value) return
  isDeleting.value = true
  deletingSlotId.value = slotId
  try {
    await deleteSlot(slotId)
    // Refresh all slots after deletion
    await fetchAllSlots()
  } finally {
    deletingSlotId.value = null
    isDeleting.value = false
  }
}

async function doSubmitWeek() {
  if (!currentWeek.value) return

  error.value = null

  try {
    await submitWeek(currentWeek.value.id)
    success.value = 'Week submitted for approval!'
    
    // Redirect back to subscription page
    setTimeout(() => {
      navigateTo(`/student/subscriptions/${subscriptionId.value}`)
    }, 2000)
  } catch (err: any) {
    error.value = err?.message || 'Failed to submit week'
  }
}

function handleSubmitWeek() {
  throttledSubmitWeek()
}

// Format time for display (HH:mm or HH:mm:ss -> h:mm AM/PM)
// Note: This is for formatting time strings from availability rules, not ISO dates
// For ISO dates, use formatTimeTz directly
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-primary-50/30 py-8">
    <div class="mx-auto max-w-6xl px-4">
      <!-- Back Link -->
      <div class="mb-6">
        <UButton
          variant="ghost"
          color="neutral"
          :to="`/student/subscriptions/${subscriptionId}`"
          size="xl"
        >
          <UIcon name="i-heroicons-arrow-left" class="mr-2 h-5 w-5" />
          Back to Subscription
        </UButton>
      </div>

      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-slate-900">Schedule Your Sessions</h1>
        <p class="mt-2 text-slate-600">
          Choose {{ requiredSlots }} time slots for Week {{ selectedWeekIndex }} from your teacher's available times
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="isPageLoading" class="space-y-6">
        <USkeleton class="h-16 w-full rounded-xl" />
        <div class="grid gap-6 lg:grid-cols-3">
          <USkeleton class="h-80 rounded-xl" />
          <USkeleton class="h-80 rounded-xl lg:col-span-2" />
        </div>
      </div>

      <!-- No Teacher Assigned -->
      <UCard v-else-if="!currentSubscription?.teacher" class="text-center py-12">
        <UIcon name="i-heroicons-user-circle" class="mx-auto h-16 w-16 text-amber-400" />
        <h3 class="mt-4 text-lg font-semibold text-slate-900">No Teacher Assigned Yet</h3>
        <p class="mt-2 text-slate-600">
          Please wait for a teacher to be assigned to your subscription before scheduling sessions.
        </p>
        <UButton
          color="primary"
          variant="outline"
          size="xl"
          class="mt-6"
          :to="`/student/subscriptions/${subscriptionId}`"
        >
          Back to Subscription
        </UButton>
      </UCard>

      <!-- No Availability Set -->
      <UCard v-else-if="!hasTeacherAvailability" class="text-center py-12">
        <UIcon name="i-heroicons-calendar-days" class="mx-auto h-16 w-16 text-amber-400" />
        <h3 class="mt-4 text-lg font-semibold text-slate-900">Teacher Availability Not Set</h3>
        <p class="mt-2 text-slate-600">
          Your teacher hasn't set their available time slots yet. Please check back later.
        </p>
        <UButton
          color="primary"
          variant="outline"
          size="xl"
          class="mt-6"
          :to="`/student/subscriptions/${subscriptionId}`"
        >
          Back to Subscription
        </UButton>
      </UCard>

      <template v-else>
        <!-- Alerts -->
        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          icon="i-heroicons-exclamation-triangle"
          :title="error"
          class="mb-6"
          closable
          @close="error = null"
        />
        <UAlert
          v-if="success"
          color="success"
          variant="soft"
          icon="i-heroicons-check-circle"
          :title="success"
          class="mb-6"
        />

        <!-- Week Selector -->
        <UCard class="mb-6">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex flex-wrap items-center gap-4">
              <span class="text-sm font-medium text-slate-600">Select Week:</span>
              <div class="flex flex-wrap gap-2">
                <UButton
                  v-for="i in (currentSubscription?.weeks_total || 4)"
                  :key="i"
                  size="xl"
                  :color="selectedWeekIndex === i ? 'primary' : 'neutral'"
                  :variant="selectedWeekIndex === i ? 'solid' : 'outline'"
                  class="relative"
                  @click="loadWeek(i)"
                >
                  <span class="flex items-center gap-2">
                    Week {{ i }}
                    <!-- Status indicator -->
                    <UIcon
                      v-if="getWeekStatus(i) === 'complete'"
                      name="i-heroicons-check-circle"
                      class="h-4 w-4 text-green-500"
                    />
                    <UIcon
                      v-else-if="getWeekStatus(i) === 'submitted'"
                      name="i-heroicons-clock"
                      class="h-4 w-4 text-amber-500"
                    />
                    <UIcon
                      v-else-if="getWeekStatus(i) === 'approved'"
                      name="i-heroicons-check-badge"
                      class="h-4 w-4 text-blue-500"
                    />
                  </span>
                </UButton>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <UBadge
                v-if="currentWeek"
                :color="getWeekStatusColor(currentWeek.status)"
                variant="soft"
                size="lg"
              >
                {{ currentWeek.status }}
              </UBadge>
              <UBadge
                v-if="currentWeek && currentWeek.status === 'draft'"
                :color="(isWeekComplete(selectedWeekIndex) ? 'success' : 'warning') as any"
                variant="soft"
                size="lg"
              >
                {{ slots.length }}/{{ requiredSlots }} slots
              </UBadge>
            </div>
          </div>
        </UCard>

        <!-- Main Content Grid -->
        <div class="grid gap-6 lg:grid-cols-3">
          <!-- Calendar -->
          <UCard>
            <template #header>
              <h2 class="text-lg font-semibold text-slate-900">Select a Date</h2>
            </template>

            <div class="flex justify-center">
              <UCalendar 
                v-model="selectedDate"
                :min="minDate"
                class="w-full"
              >
                <template #day="{ day }">
                  <div 
                    class="relative flex h-full w-full items-center justify-center"
                    :class="{ 
                      'opacity-40 cursor-not-allowed pointer-events-none': isPastDate(day)
                    }"
                  >
                    {{ day.day }}
                    <!-- Available day indicator -->
                    <span 
                      v-if="isDateAvailable(day)"
                      class="absolute bottom-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-green-500"
                    />
                  </div>
                </template>
              </UCalendar>
            </div>

            <!-- Legend -->
            <div class="mt-4 flex items-center justify-center gap-4 text-xs text-slate-500">
              <div class="flex items-center gap-1">
                <span class="h-2 w-2 rounded-full bg-green-500" />
                <span>Teacher Available</span>
              </div>
            </div>
          </UCard>

          <!-- Available Slots for Selected Date -->
          <UCard class="lg:col-span-2">
            <template #header>
              <div>
                <h2 class="text-lg font-semibold text-slate-900">
                  {{ getSelectedWeekday() }}'s Available Slots
                </h2>
                <p class="text-sm text-slate-500">{{ formatSelectedDate() }}</p>
              </div>
            </template>

            <!-- No availability for this day -->
            <div v-if="availableSlotsForSelectedDate.length === 0" class="py-12 text-center">
              <UIcon name="i-heroicons-calendar-days" class="mx-auto h-16 w-16 text-slate-200" />
              <p class="mt-4 text-slate-600">No available slots on this day</p>
              <p class="text-sm text-slate-400">Your teacher is not available on {{ getSelectedWeekday() }}s</p>
              <p class="mt-2 text-sm text-slate-500">Try selecting a different date</p>
            </div>

            <!-- Available slots -->
            <div v-else class="space-y-3">
              <p class="text-sm text-slate-600 mb-4">
                Select a time slot to schedule your session:
              </p>
              
              <div
                v-for="(slot, index) in availableSlotsForSelectedDate"
                :key="index"
                class="flex items-center justify-between rounded-xl border-2 p-4 transition-all"
                :class="[
                  isSlotAlreadyTaken(selectedDate, slot.start_time, slot.end_time)
                    ? 'border-slate-200 bg-slate-100 opacity-50 cursor-not-allowed'
                    : selectedSlot?.start_time === slot.start_time && selectedSlot?.end_time === slot.end_time
                    ? 'border-primary-500 bg-primary-50 cursor-pointer'
                    : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50 cursor-pointer'
                ]"
                @click="!isSlotAlreadyTaken(selectedDate, slot.start_time, slot.end_time) && selectSlot(slot)"
              >
                <div class="flex items-center gap-4">
                  <div class="flex h-14 w-14 items-center justify-center rounded-xl bg-green-100">
                    <UIcon name="i-heroicons-clock" class="h-7 w-7 text-green-600" />
                  </div>
                  <div>
                    <p class="text-lg font-semibold text-slate-900">
                      {{ formatTime(slot.start_time) }} - {{ formatTime(slot.end_time) }}
                    </p>
                    <p class="text-sm text-slate-500">
                      {{ getSelectedWeekday() }}
                    </p>
                    <p 
                      v-if="isSlotAlreadyTaken(selectedDate, slot.start_time, slot.end_time)"
                      class="text-xs text-amber-600 font-medium mt-1"
                    >
                      Already scheduled in Week {{ getSlotWeekNumber(selectedDate, slot.start_time, slot.end_time) }}
                    </p>
                  </div>
                </div>

                <!-- Selection indicator -->
                <div
                  class="flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all"
                  :class="[
                    selectedSlot?.start_time === slot.start_time && selectedSlot?.end_time === slot.end_time
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-slate-300'
                  ]"
                >
                  <UIcon
                    v-if="selectedSlot?.start_time === slot.start_time && selectedSlot?.end_time === slot.end_time"
                    name="i-heroicons-check"
                    class="h-4 w-4 text-white"
                  />
                </div>
              </div>

              <!-- Add Slot Button -->
              <div v-if="currentWeek?.status === 'draft'" class="pt-4">
                <UButton
                  v-if="selectedSlot && slots.length < requiredSlots && !isSlotAlreadyTaken(selectedDate, selectedSlot.start_time, selectedSlot.end_time)"
                  color="success"
                  variant="solid"
                  size="xl"
                  block
                  :disabled="!selectedSlot || isSaving || slots.length >= requiredSlots"
                  :loading="isSaving"
                  @click="handleAddSlot"
                >
                  <UIcon name="i-heroicons-plus" class="mr-2 h-5 w-5" />
                  Schedule This Slot
                </UButton>
                <UAlert
                  v-else-if="selectedSlot && slots.length >= requiredSlots"
                  color="warning"
                  variant="soft"
                  icon="i-heroicons-exclamation-triangle"
                  :title="`You can only add ${requiredSlots} session${requiredSlots === 1 ? '' : 's'} per week`"
                  description="Please remove a slot first if you want to change it."
                  class="mt-4"
                />
                <UAlert
                  v-else-if="selectedSlot && isSlotAlreadyTaken(selectedDate, selectedSlot.start_time, selectedSlot.end_time)"
                  color="warning"
                  variant="soft"
                  icon="i-heroicons-exclamation-triangle"
                  title="This time slot is already scheduled in another week"
                  class="mt-4"
                />
              </div>
            </div>
          </UCard>
        </div>

        <!-- Scheduled Slots -->
        <UCard class="mt-6">
          <template #header>
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-lg font-semibold text-slate-900">
                  Scheduled Sessions ({{ slots.length }}/{{ requiredSlots }})
                </h2>
                <p class="text-sm text-slate-600">
                  Your selected time slots for Week {{ selectedWeekIndex }}
                </p>
              </div>
              <UBadge 
                :color="slots.length >= requiredSlots ? 'success' : 'warning'" 
                variant="soft"
                size="lg"
              >
                {{ slots.length >= requiredSlots ? 'Ready to Submit' : `${requiredSlots - slots.length} more needed` }}
              </UBadge>
            </div>
          </template>

          <!-- Loading -->
          <div v-if="slotsLoading" class="space-y-4">
            <USkeleton v-for="i in 3" :key="i" class="h-20 w-full" />
          </div>

          <!-- Empty State -->
          <div v-else-if="slots.length === 0" class="py-12 text-center">
            <UIcon name="i-heroicons-calendar" class="mx-auto h-16 w-16 text-slate-300" />
            <h3 class="mt-4 text-lg font-semibold text-slate-900">No Sessions Scheduled</h3>
            <p class="mt-2 text-slate-600">Select a date and time slot above to schedule your sessions.</p>
          </div>

          <!-- Slots List -->
          <div v-else class="space-y-4">
            <div
              v-for="slot in slots"
              :key="slot.id"
              class="flex items-center justify-between rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4"
            >
              <div class="flex items-center gap-4">
                <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
                  <UIcon name="i-heroicons-clock" class="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <p class="font-semibold text-slate-900">{{ formatSlotTime(slot) }}</p>
                  <p v-if="slot.note" class="text-sm text-slate-500">{{ slot.note }}</p>
                </div>
              </div>
              <UButton
                v-if="currentWeek?.status === 'draft'"
                variant="outline"
                color="error"
                size="xl"
                :loading="deletingSlotId === slot.id"
                :disabled="isDeleting"
                @click="handleDeleteSlot(slot.id)"
              >
                <UIcon name="i-heroicons-trash" class="h-5 w-5" />
              </UButton>
            </div>
          </div>

          <!-- Submit Button -->
          <template #footer v-if="currentWeek?.status === 'draft'">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <p class="text-sm font-medium" :class="slots.length >= requiredSlots ? 'text-green-600' : 'text-amber-600'">
                  <template v-if="slots.length < requiredSlots">
                    <UIcon name="i-heroicons-exclamation-triangle" class="inline h-4 w-4 mr-1" />
                    Schedule {{ requiredSlots - slots.length }} more session{{ requiredSlots - slots.length === 1 ? '' : 's' }} to submit this week
                  </template>
                  <template v-else>
                    <UIcon name="i-heroicons-check-circle" class="inline h-4 w-4 text-green-500 mr-1" />
                    All {{ requiredSlots }} session{{ requiredSlots === 1 ? '' : 's' }} scheduled! Ready to submit.
                  </template>
                </p>
                <p v-if="slots.length < requiredSlots" class="text-xs text-slate-500 mt-1">
                  You must schedule all {{ requiredSlots }} session{{ requiredSlots === 1 ? '' : 's' }} before submitting for review.
                </p>
              </div>
              <UButton
                color="success"
                variant="solid"
                size="xl"
                :disabled="!canSubmit"
                :loading="isSubmitting"
                class="ml-4"
                @click="handleSubmitWeek"
              >
                <UIcon name="i-heroicons-paper-airplane" class="mr-2 h-5 w-5" />
                Submit for Approval
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </div>
  </div>
</template>
