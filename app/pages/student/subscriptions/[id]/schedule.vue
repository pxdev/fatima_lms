<script setup lang="ts">
import { toRaw } from 'vue'
import { today, getLocalTimeZone } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'
import { format, isBefore, isSameDay, startOfDay, parseISO, getHours, getMinutes, getDay } from 'date-fns'
import { useTimeoutFn } from '@vueuse/core'

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

// Composables
const { currentSubscription, fetchSubscription } = useSubscriptions()
const { weeks, currentWeek, fetchWeeks, getOrCreateWeek, submitWeek, getStatusColor: getWeekStatusColor } = useWeeks()
const { slots, fetchSlots, createSlot, deleteSlot, formatSlotTime, isLoading: slotsLoading } = useWeekSlots()
const { packages, fetchPackages, getPackageById } = usePackages()
const { getItems } = useDirectusItems()
const { 
  rules: teacherAvailability, 
  fetchRules: fetchTeacherAvailability, 
  getAvailableSlotsForDate,
  hasAvailabilityOnWeekday,
  getWeekdayLabel,
} = useTeacherAvailability()

// State
const allSlots = ref<Array<{ id: string; week: string; start_at: string; end_at: string }>>([])
const selectedWeekIndex = ref(1)
const selectedDate = ref<DateValue>(today(getLocalTimeZone()))
const selectedSlot = ref<{ start_time: string; end_time: string } | null>(null)
const deletingSlotId = ref<string | null>(null)

// UI State
const [error, toggleError] = useToggle(false)
const [success, toggleSuccess] = useToggle(false)
const errorMessage = ref<string>('')
const successMessage = ref<string>('')
const isPageLoading = ref(true)
const isDeleting = ref(false)

// Computed
const minDate = computed(() => today(getLocalTimeZone()))
const selectedPackage = computed(() => {
  if (!currentSubscription.value) return null
  const packageId = typeof currentSubscription.value.package === 'string' 
    ? currentSubscription.value.package 
    : currentSubscription.value.package?.id
  return packageId ? getPackageById(packageId) : null
})
// Calculate required slots per week from subscription data
// Use sessions_total / weeks_total to get the actual sessions per week
// This ensures the requirement matches what's actually in the subscription
// Fallback to package sessions_per_week if subscription data is not available
const requiredSlots = computed(() => {
  if (currentSubscription.value?.sessions_total && currentSubscription.value?.weeks_total && currentSubscription.value.weeks_total > 0) {
    // Calculate from subscription: total sessions divided by total weeks
    // Use Math.round to get the closest whole number (e.g., 12/4 = 3, 13/4 = 3.25 -> 3)
    const calculated = Math.round(currentSubscription.value.sessions_total / currentSubscription.value.weeks_total)
    return calculated > 0 ? calculated : (selectedPackage.value?.sessions_per_week || 2)
  }
  // Fallback to package value if subscription data not available
  return selectedPackage.value?.sessions_per_week || 2
})
const canSubmit = computed(() => 
  currentWeek.value?.status === 'draft' && slots.value.length >= requiredSlots.value
)
const hasTeacherAvailability = computed(() => 
  teacherAvailability.value.filter(r => r.is_active).length > 0
)
const totalWeeks = computed(() => currentSubscription.value?.weeks_total || 4)

// ========== Utility Functions ==========

/**
 * Convert DateValue to native Date object
 */
function dateValueToDate(date: DateValue): Date {
  return new Date(date.year, date.month - 1, date.day)
}

/**
 * Parse time string (HH:mm) to hours and minutes
 */
function parseTime(time: string): { hours: number; minutes: number } {
  const parts = time.split(':').map(Number)
  return {
    hours: parts[0] ?? 0,
    minutes: parts[1] ?? 0
  }
}

/**
 * Create Date object from DateValue and time string
 */
function createDateTime(date: DateValue, time: string): Date {
  const { hours, minutes } = parseTime(time)
  return new Date(date.year, date.month - 1, date.day, hours, minutes)
}

/**
 * Check if two slots have the same date and time
 */
function slotsMatch(
  slot1Start: Date,
  slot1End: Date,
  slot2Start: Date,
  slot2End: Date
): boolean {
  const sameDate = isSameDay(slot1Start, slot2Start)
  if (!sameDate) return false
  
  return (
    getHours(slot1Start) === getHours(slot2Start) &&
    getMinutes(slot1Start) === getMinutes(slot2Start) &&
    getHours(slot1End) === getHours(slot2End) &&
    getMinutes(slot1End) === getMinutes(slot2End)
  )
}

/**
 * Check if a date is in the past
 */
function isPastDate(date: DateValue): boolean {
  const dateObj = dateValueToDate(date)
  const todayObj = startOfDay(new Date())
  return isBefore(dateObj, todayObj)
}

// ========== Actions ==========

const { execute: throttledAddSlot, isLoading: isSaving } = useThrottledAction(
  async () => await doAddSlot(),
  { throttleMs: 1000 }
)

const { execute: throttledSubmitWeek, isLoading: isSubmitting } = useThrottledAction(
  async () => await doSubmitWeek(),
  { throttleMs: 1000 }
)

// Auto-hide success message after 4 seconds
const { start: startSuccessTimer } = useTimeoutFn(() => {
  toggleSuccess(false)
  successMessage.value = ''
}, 4000)

// ========== Computed Properties ==========

/**
 * Calculate overall progress across all weeks
 */
const overallProgress = computed(() => {
  if (!currentSubscription.value) {
    return { completed: 0, total: 0, percentage: 0 }
  }
  
  const maxWeeks = totalWeeks.value
  let completedWeeks = 0
  
  for (let i = 1; i <= maxWeeks; i++) {
    const week = weeks.value.find(w => w.week_index === i)
    if (!week) continue
    
    if (week.status === 'submitted' || week.status === 'approved') {
      completedWeeks++
    } else if (week.status === 'draft') {
      const weekSlots = allSlots.value.filter(slot => slot.week === week.id)
      if (weekSlots.length >= requiredSlots.value) {
        completedWeeks++
      }
    }
  }
  
  return {
    completed: completedWeeks,
    total: maxWeeks,
    percentage: maxWeeks > 0 ? Math.round((completedWeeks / maxWeeks) * 100) : 0
  }
})

/**
 * Get available slots for the selected date
 */
const availableSlotsForSelectedDate = computed(() => {
  if (!selectedDate.value) return []
  
  const date = dateValueToDate(selectedDate.value as DateValue)
  const availableSlots = getAvailableSlotsForDate(date)
  
  return availableSlots.map(slot => ({
    start_time: slot.start_time,
    end_time: slot.end_time
  }))
})

/**
 * Get slots count for a specific week
 */
function getWeekSlotsCount(weekId: string): number {
  return allSlots.value.filter(slot => slot.week === weekId).length
}

// ========== Week Status Functions ==========

/**
 * Check if a week is complete (has all required slots)
 */
function isWeekComplete(weekIndex: number): boolean {
  const week = weeks.value.find(w => w.week_index === weekIndex)
  if (!week) return false
  
  if (week.status !== 'draft') return true
  
  const weekSlotsCount = getWeekSlotsCount(week.id)
  return weekSlotsCount >= requiredSlots.value
}

/**
 * Get week status for display
 */
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

/**
 * Check if a date has teacher availability (for calendar markers)
 */
function isDateAvailable(date: DateValue | any): boolean {
  if (isPastDate(date as DateValue)) return false
  
  const dateObj = dateValueToDate(date as DateValue)
  const weekday = getDay(dateObj)
  return hasAvailabilityOnWeekday(weekday)
}

// ========== Slot Validation Functions ==========

/**
 * Check if a slot (date + time) already exists in any week
 */
function isSlotAlreadyTaken(date: DateValue, startTime: string, endTime: string): boolean {
  if (!date || !startTime || !endTime) return false
  
  const newSlotStart = createDateTime(date, startTime)
  const newSlotEnd = createDateTime(date, endTime)
  
  return allSlots.value.some(slot => {
    const slotStart = parseISO(slot.start_at)
    const slotEnd = parseISO(slot.end_at)
    return slotsMatch(newSlotStart, newSlotEnd, slotStart, slotEnd)
  })
}

/**
 * Get which week a slot is already scheduled in
 */
function getSlotWeekNumber(date: DateValue, startTime: string, endTime: string): number | null {
  if (!date || !startTime || !endTime) return null
  
  const newSlotStart = createDateTime(date, startTime)
  const newSlotEnd = createDateTime(date, endTime)
  
  const matchingSlot = allSlots.value.find(slot => {
    const slotStart = parseISO(slot.start_at)
    const slotEnd = parseISO(slot.end_at)
    return slotsMatch(newSlotStart, newSlotEnd, slotStart, slotEnd)
  })
  
  if (!matchingSlot) return null
  
  const week = weeks.value.find(w => w.id === matchingSlot.week)
  return week?.week_index ?? null
}

// ========== Data Fetching ==========

/**
 * Fetch all slots from all weeks for duplicate checking
 */
async function fetchAllSlots() {
  if (!weeks.value?.length) {
    allSlots.value = []
    return
  }
  
  try {
    const weekIds = weeks.value.map(w => w.id)
    const slotsData = await getItems({
      collection: 'week_slots',
      params: {
        filter: { week: { _in: weekIds } },
        fields: ['id', 'week', 'start_at', 'end_at']
      }
    })
    
    allSlots.value = (slotsData || []) as Array<{ id: string; week: string; start_at: string; end_at: string }>
  } catch (err) {
    console.error('Failed to fetch all slots:', err)
    allSlots.value = []
  }
}

// ========== Formatting Functions ==========

/**
 * Format the selected date for display
 */
function formatSelectedDate(): string {
  if (!selectedDate.value) return ''
  const date = dateValueToDate(selectedDate.value as DateValue)
  return format(date, 'EEEE, MMMM d, yyyy')
}

/**
 * Get weekday name for selected date
 */
function getSelectedWeekday(): string {
  if (!selectedDate.value) return ''
  const date = dateValueToDate(selectedDate.value as DateValue)
  return getWeekdayLabel(getDay(date))
}

/**
 * Format time for display (HH:mm -> h:mm AM/PM)
 */
function formatTime(time: string): string {
  const { hours, minutes } = parseTime(time)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`
}

// ========== Watchers ==========

/**
 * Prevent selecting past dates
 */
watch(selectedDate, (newDate) => {
  if (newDate && isPastDate(newDate as DateValue)) {
    selectedDate.value = today(getLocalTimeZone()) as any
  }
})

// ========== Event Handlers ==========

/**
 * Load a specific week
 */
async function loadWeek(weekIndex: number) {
  selectedWeekIndex.value = weekIndex
  const week = await getOrCreateWeek(subscriptionId.value, weekIndex)
  if (week) {
    await fetchSlots(week.id)
    await fetchAllSlots()
  }
}

/**
 * Select a time slot
 */
function selectSlot(slot: { start_time: string; end_time: string }) {
  selectedSlot.value = slot
}

/**
 * Show error message
 */
function showError(message: string) {
  toggleError(true)
  errorMessage.value = message
}

/**
 * Show success message
 */
function showSuccess(message: string) {
  toggleSuccess(true)
  successMessage.value = message
  startSuccessTimer()
}

/**
 * Create ISO datetime string from date and time
 */
function createISOString(date: DateValue, time: string): string {
  const { hours, minutes } = parseTime(time)
  const dateStr = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`
  return `${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00Z`
}

/**
 * Add a slot to the current week
 */
async function doAddSlot() {
  if (!currentWeek.value || !selectedSlot.value || !selectedDate.value) return

  toggleError(false)

  if (slots.value.length >= requiredSlots.value) {
    showError(`You can only add ${requiredSlots.value} session${requiredSlots.value === 1 ? '' : 's'} per week. Please remove a slot first if you want to change it.`)
    return
  }

  const { start_time, end_time } = selectedSlot.value

  if (isSlotAlreadyTaken(selectedDate.value as DateValue, start_time, end_time)) {
    showError('This time slot is already scheduled in another week')
    return
  }

  try {
    const startAt = createISOString(selectedDate.value as DateValue, start_time)
    const endAt = createISOString(selectedDate.value as DateValue, end_time)

    const created = await createSlot({
      week: currentWeek.value.id,
      start_at: startAt,
      end_at: endAt,
      note: null
    })

    if (!created) {
      showError('Failed to create slot')
      return
    }

    await Promise.all([
      fetchAllSlots(),
      fetchSlots(currentWeek.value.id)
    ])
    
    selectedSlot.value = null
    
    const message = slots.value.length >= requiredSlots.value
      ? `🎉 Week ${selectedWeekIndex.value} complete! All ${requiredSlots.value} sessions scheduled.`
      : '✓ Session scheduled successfully!'
    
    showSuccess(message)
  } catch (err: any) {
    console.error('Error creating slot:', err)
    showError(err?.data?.statusMessage || err?.message || 'Failed to schedule session')
  }
}

function handleAddSlot() {
  throttledAddSlot()
}

/**
 * Delete a slot
 */
async function handleDeleteSlot(slotId: string) {
  if (isDeleting.value) return
  
  isDeleting.value = true
  deletingSlotId.value = slotId
  
  try {
    await deleteSlot(slotId)
    await fetchAllSlots()
  } finally {
    deletingSlotId.value = null
    isDeleting.value = false
  }
}

/**
 * Submit week for approval
 */
async function doSubmitWeek() {
  if (!currentWeek.value) return

  toggleError(false)

  try {
    // Verify we have the required number of slots
    if (slots.value.length < requiredSlots.value) {
      showError(`Please schedule all ${requiredSlots.value} required sessions before submitting`)
      return
    }

    const result = await submitWeek(currentWeek.value.id)
    
    if (result && result.status === 'submitted') {
      showSuccess('Week submitted for approval! Your teacher will review it shortly.')
      
      useTimeoutFn(() => {
        navigateTo(`/student/subscriptions/${subscriptionId.value}`)
      }, 2000)
    } else {
      showError('Week submission may have failed. Please check the week status.')
    }
  } catch (err: any) {
    console.error('[Schedule] Submit week error:', err)
    showError(err?.data?.errors?.[0]?.message || err?.message || 'Failed to submit week. Please try again.')
  }
}

function handleSubmitWeek() {
  throttledSubmitWeek()
}

// ========== Lifecycle ==========

onMounted(async () => {
  isPageLoading.value = true
  
  try {
    await Promise.all([
      fetchSubscription(subscriptionId.value),
      fetchPackages()
    ])

    // Note: Removed auto-fix logic to prevent overriding admin manual changes
    // If sessions_total needs to be corrected, it should be done manually in Directus admin panel
    // or through a proper admin interface, not automatically on page load

    // Fetch teacher availability
    // Handle Directus relation: teacher can be ID string or expanded object
    if (currentSubscription.value?.teacher) {
      let teacherId: string | null = null
      const teacherValue = toRaw(currentSubscription.value.teacher)
      
      // Convert to plain object for inspection
      const teacherPlain = JSON.parse(JSON.stringify(teacherValue))
      
      if (typeof teacherValue === 'string') {
        // Teacher is ID string (ideal case)
        teacherId = teacherValue
      } else if (teacherValue && typeof teacherValue === 'object') {
        // Teacher is expanded relation object
        // Try to get ID from the object
        if (teacherPlain?.id && typeof teacherPlain.id === 'string') {
          teacherId = teacherPlain.id
        } else {
          // If no ID in object, log for debugging
          console.warn('[Schedule] Teacher object without ID:', teacherPlain)
        }
      }
      
      if (teacherId) {
        await fetchTeacherAvailability(teacherId)
      } else {
        console.error('[Schedule] Could not extract teacher ID from:', teacherPlain)
        console.error('[Schedule] Full subscription:', JSON.parse(JSON.stringify(toRaw(currentSubscription.value))))
      }
    } else {
      console.warn('[Schedule] No teacher assigned to subscription yet')
    }

    await fetchWeeks(subscriptionId.value)
    await loadWeek(selectedWeekIndex.value)
    await fetchAllSlots()
  } finally {
    isPageLoading.value = false
  }
})
</script>

  <template>
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-primary-50/30 py-8">
    <div class="mx-auto max-w-6xl px-4">
      <!-- Breadcrumbs -->
      <UBreadcrumb 
        :items="[
          { label: 'Home', icon: 'i-heroicons-home', to: '/student/dashboard' },
          { label: 'My Subscriptions', to: '/student/subscriptions' },
          { label: 'Subscription', to: `/student/subscriptions/${subscriptionId}` },
          { label: 'Schedule Sessions' }
        ]" 
        class="mb-6"
      />

      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-slate-900">Schedule Your Sessions</h1>
        <p class="mt-2 text-slate-600">
          Choose {{ requiredSlots }} time slots for Week {{ selectedWeekIndex }} from your teacher's available times
        </p>
      </div>

      <!-- Progress Bar at Top -->
      <UCard v-if="currentSubscription" class="mb-6">
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-slate-700">Total Progress</span>
            <span class="text-lg font-bold" :class="overallProgress.percentage === 100 ? 'text-green-600' : 'text-primary-600'">
              {{ overallProgress.percentage }}%
            </span>
          </div>
          <div class="h-3 overflow-hidden rounded-full bg-slate-200">
            <div
              class="h-full rounded-full transition-all duration-500 ease-out"
              :class="overallProgress.percentage === 100 ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-primary-500 to-primary-600'"
              :style="{ width: `${overallProgress.percentage}%` }"
            />
          </div>
          <p class="text-xs text-slate-500 text-center">
            {{ overallProgress.completed }} of {{ overallProgress.total }} weeks completed
          </p>
        </div>
      </UCard>

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
          :title="errorMessage"
          class="mb-6"
          closable
          @close="toggleError(false)"
        />
        <UAlert
          v-if="success"
          color="success"
          variant="soft"
          icon="i-heroicons-check-circle"
          :title="successMessage"
          class="mb-6"
        />

        <!-- Enhanced Week Steps -->
        <UCard class="mb-6">
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-slate-600">Select Week:</span>
              <div class="flex items-center gap-3">
                <UBadge
                  v-if="currentWeek"
                  :color="getWeekStatusColor(currentWeek.status) as any"
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
            
            <!-- Improved Week Steps -->
            <div class="flex items-center justify-center gap-1 overflow-x-auto py-2">
              <div
                v-for="i in (currentSubscription?.weeks_total || 4)"
                :key="i"
                class="flex items-center flex-shrink-0"
              >
                <!-- Step Circle -->
                <button
                  @click="loadWeek(i)"
                  class="group relative flex flex-col items-center"
                >
                  <div
                    class="relative flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-200"
                    :class="{
                      'border-primary-500 bg-primary-500 text-white scale-110': selectedWeekIndex === i && getWeekStatus(i) === 'incomplete',
                      'border-green-500 bg-green-500 text-white': getWeekStatus(i) === 'complete' || getWeekStatus(i) === 'approved',
                      'border-amber-500 bg-amber-500 text-white': getWeekStatus(i) === 'submitted',
                      'border-slate-300 bg-white text-slate-400 hover:border-primary-300 hover:bg-slate-50': selectedWeekIndex !== i && getWeekStatus(i) === 'incomplete'
                    }"
                  >
                    <!-- Check Icon for Completed/Approved -->
                    <UIcon
                      v-if="getWeekStatus(i) === 'complete' || getWeekStatus(i) === 'approved'"
                      name="i-heroicons-check"
                      class="h-6 w-6"
                    />
                    <!-- Clock Icon for Submitted -->
                    <UIcon
                      v-else-if="getWeekStatus(i) === 'submitted'"
                      name="i-heroicons-clock"
                      class="h-5 w-5"
                    />
                    <!-- Week Number for Incomplete -->
                    <span
                      v-else
                      class="text-sm font-bold"
                      :class="{
                        'text-white': selectedWeekIndex === i,
                        'text-slate-500': selectedWeekIndex !== i
                      }"
                    >
                      {{ i }}
                    </span>
                  </div>
                  
                  <!-- Week Label -->
                  <span
                    class="mt-2 text-xs font-medium"
                    :class="{
                      'text-primary-600': selectedWeekIndex === i,
                      'text-slate-500': selectedWeekIndex !== i
                    }"
                  >
                    Week {{ i }}
                  </span>
                </button>
                
                <!-- Connector Line -->
                <div
                  v-if="i < (currentSubscription?.weeks_total || 4)"
                  class="h-0.5 w-8 sm:w-12 mx-1 transition-colors duration-200"
                  :class="{
                    'bg-green-500': getWeekStatus(i) === 'complete' || getWeekStatus(i) === 'approved' || getWeekStatus(i) === 'submitted',
                    'bg-slate-200': getWeekStatus(i) === 'incomplete'
                  }"
                />
              </div>
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
                
                v-model="selectedDate as any"
                :min="minDate"
                class="w-full"
              >
                <template #day="{ day }">
                  <div 
                    class="relative flex h-full w-full items-center justify-center"
                    :class="{ 
                      'opacity-40 cursor-not-allowed pointer-events-none': isPastDate(day as DateValue)
                    }"
                  >
                    {{ day.day }}
                    <!-- Available day indicator -->
                    <span 
                      v-if="isDateAvailable(day as DateValue) && !isPastDate(day as DateValue)"
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
              
              <UCard
                v-for="(slot, index) in availableSlotsForSelectedDate"
                :key="index"
                :class="[
                  'group relative cursor-pointer transition-all duration-200',
                  isSlotAlreadyTaken(selectedDate as DateValue, slot.start_time, slot.end_time)
                    ? 'opacity-50 cursor-not-allowed'
                    : selectedSlot?.start_time === slot.start_time && selectedSlot?.end_time === slot.end_time
                    ? 'ring-2 ring-primary-500 scale-[1.02]'
                    : 'hover:ring-2 hover:ring-primary-300 hover:scale-[1.01]'
                ]"
                @click="!isSlotAlreadyTaken(selectedDate as DateValue, slot.start_time, slot.end_time) && selectSlot(slot)"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-4 flex-1">
                    <!-- Time Icon -->
                    <div class="relative flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-green-100 to-green-50 group-hover:from-green-200 group-hover:to-green-100 transition-all duration-200">
                      <UIcon name="i-heroicons-clock" class="h-8 w-8 text-green-600" />
                    </div>
                    
                    <!-- Slot Info -->
                    <div class="flex-1">
                      <div class="flex items-baseline gap-2">
                        <p class="text-xl font-bold text-slate-900">
                          {{ formatTime(slot.start_time) }}
                        </p>
                        <UIcon name="i-heroicons-arrow-right" class="h-4 w-4 text-slate-400" />
                        <p class="text-xl font-bold text-slate-900">
                          {{ formatTime(slot.end_time) }}
                        </p>
                      </div>
                      <div class="flex items-center gap-2 mt-1">
                        <UIcon name="i-heroicons-calendar" class="h-4 w-4 text-slate-400" />
                        <p class="text-sm text-slate-500">
                          {{ getSelectedWeekday() }}
                        </p>
                      </div>
                      <p 
                        v-if="isSlotAlreadyTaken(selectedDate as DateValue, slot.start_time, slot.end_time)"
                        class="text-xs text-amber-600 font-medium mt-1.5 flex items-center gap-1"
                      >
                        <UIcon name="i-heroicons-exclamation-triangle" class="h-3 w-3" />
                        Already scheduled in Week {{ getSlotWeekNumber(selectedDate as DateValue, slot.start_time, slot.end_time) }}
                      </p>
                    </div>
                  </div>

                  <!-- Enhanced Selection indicator -->
                  <div
                    class="flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-200"
                    :class="[
                      selectedSlot?.start_time === slot.start_time && selectedSlot?.end_time === slot.end_time
                        ? 'border-primary-500 bg-primary-500 scale-110 ring-2 ring-primary-200'
                        : 'border-slate-300 bg-white group-hover:border-primary-300'
                    ]"
                  >
                    <UIcon
                      v-if="selectedSlot?.start_time === slot.start_time && selectedSlot?.end_time === slot.end_time"
                      name="i-heroicons-check"
                      class="h-5 w-5 text-white animate-in zoom-in duration-200"
                    />
                  </div>
                </div>
              </UCard>

              <!-- Enhanced Add Slot Button -->
              <div v-if="currentWeek?.status === 'draft'" class="pt-4">
                <UButton
                  v-if="selectedSlot && slots.length < requiredSlots && !isSlotAlreadyTaken(selectedDate as DateValue, selectedSlot.start_time, selectedSlot.end_time)"
                  color="success"
                  variant="solid"
                  size="xl"
                  block
                  :disabled="!selectedSlot || isSaving || slots.length >= requiredSlots"
                  :loading="isSaving"
                  class="transition-all duration-200 font-semibold"
                  @click="handleAddSlot"
                >
                  <UIcon name="i-heroicons-plus-circle" class="mr-2 h-5 w-5" />
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
                  v-else-if="selectedSlot && isSlotAlreadyTaken(selectedDate as DateValue, selectedSlot.start_time, selectedSlot.end_time)"
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

          <!-- Enhanced Slots List -->
          <div v-else class="space-y-3">
            <TransitionGroup
              name="slot-list"
              tag="div"
              class="space-y-3"
            >
              <UCard
                v-for="slot in slots"
                :key="slot.id"
                class="group transition-all duration-200 hover:ring-2 hover:ring-primary-200"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-4 flex-1">
                    <div class="relative flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 group-hover:from-primary-200 group-hover:to-primary-100 transition-all duration-200">
                      <UIcon name="i-heroicons-clock" class="h-7 w-7 text-primary-600" />
                      <div class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-white">
                        <span class="text-[10px] font-bold">{{ slots.indexOf(slot) + 1 }}</span>
                      </div>
                    </div>
                    <div class="flex-1">
                      <p class="text-lg font-bold text-slate-900">{{ formatSlotTime(slot) }}</p>
                      <p v-if="slot.note" class="text-sm text-slate-500 mt-0.5">{{ slot.note }}</p>
                    </div>
                  </div>
                  <UButton
                    v-if="currentWeek?.status === 'draft'"
                    variant="outline"
                    color="error"
                    size="xl"
                    class="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    :loading="deletingSlotId === slot.id"
                    :disabled="isDeleting"
                    @click="handleDeleteSlot(slot.id)"
                  >
                    <UIcon name="i-heroicons-trash" class="h-5 w-5" />
                  </UButton>
                </div>
              </UCard>
            </TransitionGroup>
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

<style scoped>
/* Slot List Animations */
.slot-list-enter-active,
.slot-list-leave-active {
  transition: all 0.3s ease;
}

.slot-list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.slot-list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.slot-list-move {
  transition: transform 0.3s ease;
}

/* Smooth transitions for week selector */
@keyframes pulse-ring {
  0% {
    transform: scale(0.95);
    opacity: 1;
  }
  100% {
    transform: scale(1.1);
    opacity: 0;
  }
}

/* Calendar date hover effects */
.calendar-day-hover {
  transition: all 0.2s ease;
}

/* Slot card hover effects */
.slot-card-hover {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
