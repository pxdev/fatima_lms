<script setup lang="ts">
import { CalendarDate, today, getLocalTimeZone } from '@internationalized/date'

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

// Get available slots for the selected date
const availableSlotsForSelectedDate = computed(() => {
  if (!selectedDate.value) return []
  
  const date = new Date(selectedDate.value.year, selectedDate.value.month - 1, selectedDate.value.day)
  return getAvailableSlotsForDate(date)
})

// Check if teacher has availability set
const hasTeacherAvailability = computed(() => {
  return teacherAvailability.value.filter(r => r.is_active).length > 0
})

// Check if a date has teacher availability (for calendar markers)
function isDateAvailable(date: CalendarDate): boolean {
  const weekday = new Date(date.year, date.month - 1, date.day).getDay()
  return hasAvailabilityOnWeekday(weekday)
}

// Format the selected date for display
function formatSelectedDate(): string {
  if (!selectedDate.value) return ''
  const date = new Date(selectedDate.value.year, selectedDate.value.month - 1, selectedDate.value.day)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

// Get weekday name for selected date
function getSelectedWeekday(): string {
  if (!selectedDate.value) return ''
  const date = new Date(selectedDate.value.year, selectedDate.value.month - 1, selectedDate.value.day)
  return getWeekdayLabel(date.getDay())
}

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
  } finally {
    isPageLoading.value = false
  }
})

async function loadWeek(weekIndex: number) {
  selectedWeekIndex.value = weekIndex
  const week = await getOrCreateWeek(subscriptionId.value, weekIndex)
  if (week) {
    await fetchSlots(week.id)
  }
}

function selectSlot(slot: { start_time: string; end_time: string }) {
  selectedSlot.value = slot
}

async function doAddSlot() {
  if (!currentWeek.value || !selectedSlot.value || !selectedDate.value) return

  error.value = null

  try {
    // Format date as YYYY-MM-DD
    const dateStr = `${selectedDate.value.year}-${String(selectedDate.value.month).padStart(2, '0')}-${String(selectedDate.value.day).padStart(2, '0')}`
    
    // Store datetime without timezone conversion
    const startAt = `${dateStr}T${selectedSlot.value.start_time}:00`
    const endAt = `${dateStr}T${selectedSlot.value.end_time}:00`

    await createSlot({
      week: currentWeek.value.id,
      start_at: startAt,
      end_at: endAt,
      note: null
    })

    selectedSlot.value = null
    success.value = 'Session scheduled successfully!'
    setTimeout(() => success.value = null, 3000)
  } catch (err: any) {
    error.value = err?.message || 'Failed to schedule session'
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
                  @click="loadWeek(i)"
                >
                  Week {{ i }}
                </UButton>
              </div>
            </div>
            <UBadge
              v-if="currentWeek"
              :color="getWeekStatusColor(currentWeek.status)"
              variant="soft"
              size="lg"
            >
              {{ currentWeek.status }}
            </UBadge>
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
                class="w-full"
              >
                <template #day="{ day }">
                  <div class="relative flex h-full w-full items-center justify-center">
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
                class="flex items-center justify-between rounded-xl border-2 p-4 transition-all cursor-pointer"
                :class="[
                  selectedSlot?.start_time === slot.start_time && selectedSlot?.end_time === slot.end_time
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50'
                ]"
                @click="selectSlot(slot)"
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
                  color="success"
                  variant="solid"
                  size="xl"
                  block
                  :disabled="!selectedSlot || isSaving"
                  :loading="isSaving"
                  @click="handleAddSlot"
                >
                  <UIcon name="i-heroicons-plus" class="mr-2 h-5 w-5" />
                  Schedule This Slot
                </UButton>
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
              <p class="text-sm text-slate-600">
                <template v-if="slots.length < requiredSlots">
                  Schedule {{ requiredSlots - slots.length }} more session(s) to submit
                </template>
                <template v-else>
                  <UIcon name="i-heroicons-check-circle" class="inline h-4 w-4 text-green-500 mr-1" />
                  All sessions scheduled! Ready to submit.
                </template>
              </p>
              <UButton
                color="success"
                variant="solid"
                size="xl"
                :disabled="!canSubmit"
                :loading="isSubmitting"
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
