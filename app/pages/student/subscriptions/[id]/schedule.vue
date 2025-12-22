<script setup lang="ts">
import { z } from 'zod'

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

const selectedWeekIndex = ref(1)
const showSlotModal = ref(false)
const isSaving = ref(false)
const isSubmitting = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

const selectedPackage = computed(() => 
  currentSubscription.value ? getPackageById(currentSubscription.value.package) : null
)

const requiredSlots = computed(() => selectedPackage.value?.sessions_per_week || 2)

const canSubmit = computed(() => 
  currentWeek.value?.status === 'draft' && 
  slots.value.length >= requiredSlots.value
)

const schema = z.object({
  date: z.string().min(1, 'Date is required'),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time'),
  note: z.string().optional()
})

type SlotForm = z.infer<typeof schema>

const state = reactive<SlotForm>({
  date: '',
  start_time: '09:00',
  end_time: '10:00',
  note: ''
})

onMounted(async () => {
  await Promise.all([
    fetchSubscription(subscriptionId.value),
    fetchPackages()
  ])

  // Load weeks and select first draft week or create new one
  await fetchWeeks(subscriptionId.value)
  await loadWeek(selectedWeekIndex.value)
})

async function loadWeek(weekIndex: number) {
  selectedWeekIndex.value = weekIndex
  const week = await getOrCreateWeek(subscriptionId.value, weekIndex)
  if (week) {
    await fetchSlots(week.id)
  }
}

function openSlotModal() {
  // Set default date to next available day
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  state.date = tomorrow.toISOString().split('T')[0]
  state.start_time = '09:00'
  state.end_time = '10:00'
  state.note = ''
  showSlotModal.value = true
}

async function handleAddSlot() {
  if (!currentWeek.value) return

  isSaving.value = true
  error.value = null

  try {
    const startAt = new Date(`${state.date}T${state.start_time}:00`)
    const endAt = new Date(`${state.date}T${state.end_time}:00`)

    await createSlot({
      week: currentWeek.value.id,
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      note: state.note || null
    })

    showSlotModal.value = false
    success.value = 'Slot added successfully'
    setTimeout(() => success.value = null, 3000)
  } catch (err: any) {
    error.value = err?.message || 'Failed to add slot'
  } finally {
    isSaving.value = false
  }
}

async function handleDeleteSlot(slotId: string) {
  await deleteSlot(slotId)
}

async function handleSubmitWeek() {
  if (!currentWeek.value) return

  isSubmitting.value = true
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
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-primary-50/30 py-12">
    <div class="mx-auto max-w-4xl px-4">
      <!-- Back Link -->
      <div class="mb-6">
        <UButton
          variant="ghost"
          color="neutral"
          :to="`/student/subscriptions/${subscriptionId}`"
          size="sm"
        >
          <UIcon name="i-heroicons-arrow-left" class="mr-1 h-4 w-4" />
          Back to Subscription
        </UButton>
      </div>

      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-slate-900">Schedule Your Sessions</h1>
        <p class="mt-2 text-slate-600">
          Choose {{ requiredSlots }} time slots for Week {{ selectedWeekIndex }}
        </p>
      </div>

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
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <span class="text-sm font-medium text-slate-600">Select Week:</span>
            <div class="flex gap-2">
              <UButton
                v-for="i in (currentSubscription?.weeks_total || 4)"
                :key="i"
                size="sm"
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
          >
            {{ currentWeek.status }}
          </UBadge>
        </div>
      </UCard>

      <!-- Slots List -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-slate-900">
                Time Slots ({{ slots.length }}/{{ requiredSlots }})
              </h2>
              <p class="text-sm text-slate-600">
                Add at least {{ requiredSlots }} slots to submit
              </p>
            </div>
            <UButton
              v-if="currentWeek?.status === 'draft'"
              color="primary"
              @click="openSlotModal"
            >
              <UIcon name="i-heroicons-plus" class="mr-2 h-4 w-4" />
              Add Slot
            </UButton>
          </div>
        </template>

        <!-- Loading -->
        <div v-if="slotsLoading" class="space-y-4">
          <USkeleton v-for="i in 3" :key="i" class="h-20 w-full" />
        </div>

        <!-- Empty State -->
        <div v-else-if="slots.length === 0" class="py-12 text-center">
          <UIcon name="i-heroicons-calendar" class="mx-auto h-16 w-16 text-slate-300" />
          <h3 class="mt-4 text-lg font-semibold text-slate-900">No Slots Yet</h3>
          <p class="mt-2 text-slate-600">Add your preferred time slots for this week.</p>
          <UButton
            v-if="currentWeek?.status === 'draft'"
            color="primary"
            class="mt-6"
            @click="openSlotModal"
          >
            Add First Slot
          </UButton>
        </div>

        <!-- Slots -->
        <div v-else class="space-y-4">
          <div
            v-for="slot in slots"
            :key="slot.id"
            class="flex items-center justify-between rounded-lg bg-slate-50 p-4"
          >
            <div class="flex items-center gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
                <UIcon name="i-heroicons-clock" class="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p class="font-medium text-slate-900">{{ formatSlotTime(slot) }}</p>
                <p v-if="slot.note" class="text-sm text-slate-500">{{ slot.note }}</p>
              </div>
            </div>
            <UButton
              v-if="currentWeek?.status === 'draft'"
              variant="ghost"
              color="error"
              size="sm"
              @click="handleDeleteSlot(slot.id)"
            >
              <UIcon name="i-heroicons-trash" class="h-4 w-4" />
            </UButton>
          </div>
        </div>

        <!-- Submit Button -->
        <template #footer v-if="currentWeek?.status === 'draft'">
          <div class="flex items-center justify-between">
            <p class="text-sm text-slate-600">
              <template v-if="slots.length < requiredSlots">
                Add {{ requiredSlots - slots.length }} more slot(s) to submit
              </template>
              <template v-else>
                Ready to submit!
              </template>
            </p>
            <UButton
              color="primary"
              :disabled="!canSubmit"
              :loading="isSubmitting"
              @click="handleSubmitWeek"
            >
              Submit for Approval
            </UButton>
          </div>
        </template>
      </UCard>

      <!-- Add Slot Modal -->
      <UModal v-model:open="showSlotModal">
        <template #content>
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">Add Time Slot</h3>
            </template>

            <UForm :schema="schema" :state="state" class="space-y-4" @submit="handleAddSlot">
              <UFormField label="Date" name="date" required>
                <UInput
                  v-model="state.date"
                  type="date"
                  :min="new Date().toISOString().split('T')[0]"
                  class="w-full"
                />
              </UFormField>

              <div class="grid grid-cols-2 gap-4">
                <UFormField label="Start Time" name="start_time" required>
                  <UInput
                    v-model="state.start_time"
                    type="time"
                    class="w-full"
                  />
                </UFormField>

                <UFormField label="End Time" name="end_time" required>
                  <UInput
                    v-model="state.end_time"
                    type="time"
                    class="w-full"
                  />
                </UFormField>
              </div>

              <UFormField label="Note (Optional)" name="note">
                <UInput
                  v-model="state.note"
                  placeholder="Any special requests..."
                  class="w-full"
                />
              </UFormField>

              <div class="flex justify-end gap-3 pt-4">
                <UButton
                  color="neutral"
                  variant="outline"
                  :disabled="isSaving"
                  @click="showSlotModal = false"
                >
                  Cancel
                </UButton>
                <UButton
                  type="submit"
                  color="primary"
                  :loading="isSaving"
                >
                  Add Slot
                </UButton>
              </div>
            </UForm>
          </UCard>
        </template>
      </UModal>
    </div>
  </div>
</template>

