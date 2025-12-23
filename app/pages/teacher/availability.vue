<script setup lang="ts">
import { z } from 'zod'

definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

useSeoMeta({
  title: 'Manage Availability',
  description: 'Set your available time slots'
})

const { profile, fetchProfile } = useProfile()
const { 
  rules, 
  isLoading, 
  error, 
  weekdays,
  fetchRules, 
  createRule, 
  updateRule,
  deleteRule,
  getWeekdayLabel 
} = useTeacherAvailability()

const showModal = ref(false)
const editingRule = ref<any>(null)
const deleteConfirm = ref<string | null>(null)
const formError = ref<string | null>(null)

// Throttled actions for rate limiting
const { execute: throttledSubmit, isLoading: isSaving } = useThrottledAction(
  async () => {
    await doSubmit()
  },
  { throttleMs: 1000 }
)

const { execute: throttledDelete, isLoading: isDeleting } = useThrottledAction(
  async () => {
    if (deleteConfirm.value) {
      await doDelete(deleteConfirm.value)
    }
  },
  { throttleMs: 1000 }
)

const { execute: throttledToggle, isLoading: isToggling } = useThrottledAction(
  async () => {},
  { throttleMs: 500 }
)

const schema = z.object({
  weekday: z.number().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  is_active: z.boolean()
})

type RuleForm = z.infer<typeof schema>

const state = reactive<RuleForm>({
  weekday: 0,
  start_time: '09:00',
  end_time: '17:00',
  is_active: true
})

onMounted(async () => {
  await fetchProfile()
  
  if (profile.value?.role !== 'teacher') {
    navigateTo('/student/dashboard')
    return
  }

  if (profile.value?.id) {
    await fetchRules(profile.value.id)
  }
})

function normalizeTime(time: string): string {
  // Convert "09:00:00" to "09:00" for comparison
  return time.substring(0, 5)
}

function isDuplicateSlot(weekday: number, startTime: string, endTime: string, excludeId?: string): boolean {
  const normalizedStart = normalizeTime(startTime)
  const normalizedEnd = normalizeTime(endTime)
  
  return rules.value.some(rule => {
    if (excludeId && rule.id === excludeId) return false
    if (rule.weekday !== weekday) return false
    // Check for exact match (normalized to HH:mm)
    return normalizeTime(rule.start_time) === normalizedStart && 
           normalizeTime(rule.end_time) === normalizedEnd
  })
}

function openAddModal() {
  editingRule.value = null
  state.weekday = 0
  state.start_time = '09:00'
  state.end_time = '17:00'
  state.is_active = true
  formError.value = null
  showModal.value = true
}

function openEditModal(rule: any) {
  editingRule.value = rule
  state.weekday = rule.weekday
  state.start_time = rule.start_time
  state.end_time = rule.end_time
  state.is_active = rule.is_active
  formError.value = null
  showModal.value = true
}

async function doSubmit() {
  if (!profile.value?.id) return

  formError.value = null

  // Check for duplicate slot (frontend validation)
  const excludeId = editingRule.value?.id
  if (isDuplicateSlot(state.weekday, state.start_time, state.end_time, excludeId)) {
    formError.value = 'A time slot with the same day and times already exists'
    return
  }

  try {
    if (editingRule.value) {
      await updateRule(editingRule.value.id, {
        weekday: state.weekday,
        start_time: state.start_time,
        end_time: state.end_time,
        is_active: state.is_active
      })
    } else {
      await createRule({
        teacher: profile.value.id,
        weekday: state.weekday,
        start_time: state.start_time,
        end_time: state.end_time,
        is_active: state.is_active
      })
    }

    showModal.value = false
    await fetchRules(profile.value.id)
  } catch (err: any) {
    // Handle backend validation errors
    formError.value = err?.data?.statusMessage || err?.message || 'Failed to save time slot'
  }
}

function handleSubmit() {
  throttledSubmit()
}

async function doDelete(id: string) {
  if (!profile.value?.id) return

  await deleteRule(id)
  deleteConfirm.value = null
  await fetchRules(profile.value.id)
}

function handleDelete() {
  throttledDelete()
}

const togglingRuleId = ref<string | null>(null)

async function toggleActive(rule: any) {
  if (isToggling.value) return
  togglingRuleId.value = rule.id
  try {
    await updateRule(rule.id, { is_active: !rule.is_active })
  } finally {
    togglingRuleId.value = null
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">My Availability</h1>
        <p class="mt-1 text-slate-600">Set your weekly available time slots</p>
      </div>
      <UButton color="primary" @click="openAddModal" class="hidden sm:flex">
        <UIcon name="i-heroicons-plus" class="mr-2 h-4 w-4" />
        Add Slot
      </UButton>
    </div>

      <!-- Loading -->
      <div v-if="isLoading" class="space-y-4">
        <USkeleton v-for="i in 5" :key="i" class="h-20 w-full rounded-xl" />
      </div>

      <!-- Error -->
      <UAlert
        v-else-if="error"
        color="error"
        variant="soft"
        icon="i-heroicons-exclamation-triangle"
        :title="error"
        class="mb-6"
      />

      <!-- Empty State -->
      <UCard v-else-if="rules.length === 0" class="py-12 text-center">
        <UIcon name="i-heroicons-calendar" class="mx-auto h-16 w-16 text-slate-300" />
        <h3 class="mt-4 text-lg font-semibold text-slate-900">No Availability Set</h3>
        <p class="mt-2 text-slate-600">Add your available time slots so students can book sessions.</p>
        <UButton color="primary" class="mt-6" @click="openAddModal">
          Add Time Slot
        </UButton>
      </UCard>

      <!-- Rules List -->
      <div v-else class="space-y-4">
        <UCard
          v-for="rule in rules"
          :key="rule.id"
          :class="{ 'opacity-50': !rule.is_active }"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <UIcon name="i-heroicons-clock" class="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p class="font-semibold text-slate-900">{{ getWeekdayLabel(rule.weekday) }}</p>
                <p class="text-sm text-slate-600">
                  {{ rule.start_time }} - {{ rule.end_time }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <UBadge
                :color="rule.is_active ? 'success' : 'neutral'"
                variant="soft"
                :class="{ 'cursor-pointer': !isToggling, 'opacity-50': togglingRuleId === rule.id }"
                @click="toggleActive(rule)"
              >
                {{ togglingRuleId === rule.id ? 'Updating...' : (rule.is_active ? 'Active' : 'Inactive') }}
              </UBadge>
              <UButton
                variant="ghost"
                color="neutral"
                size="sm"
                @click="openEditModal(rule)"
              >
                <UIcon name="i-heroicons-pencil" class="h-4 w-4" />
              </UButton>
              <UButton
                variant="ghost"
                color="error"
                size="sm"
                @click="deleteConfirm = rule.id"
              >
                <UIcon name="i-heroicons-trash" class="h-4 w-4" />
              </UButton>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Add/Edit Modal -->
      <UModal v-model:open="showModal">
        <template #content>
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">
                {{ editingRule ? 'Edit Time Slot' : 'Add Time Slot' }}
              </h3>
            </template>

            <UForm :schema="schema" :state="state" class="space-y-4" @submit="handleSubmit">
              <UAlert
                v-if="formError"
                color="error"
                variant="soft"
                icon="i-heroicons-exclamation-triangle"
                :title="formError"
                class="mb-4"
              />

              <UFormField label="Day of Week" name="weekday" required>
                <USelect
                  v-model="state.weekday"
                  :items="weekdays"
                  value-key="value"
                  label-key="label"
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

              <UFormField label="Status" name="is_active">
                <UCheckbox v-model="state.is_active" label="Active" />
              </UFormField>

              <div class="flex justify-end gap-3 pt-4">
                <UButton
                  color="neutral"
                  variant="outline"
                  :disabled="isSaving"
                  @click="showModal = false"
                >
                  Cancel
                </UButton>
                <UButton
                  type="submit"
                  color="primary"
                  :loading="isSaving"
                >
                  {{ editingRule ? 'Save Changes' : 'Add Slot' }}
                </UButton>
              </div>
            </UForm>
          </UCard>
        </template>
      </UModal>

      <!-- Delete Confirmation Modal -->
      <UModal v-model:open="deleteConfirm">
        <template #content>
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">Delete Time Slot</h3>
            </template>

            <p class="text-slate-600">
              Are you sure you want to delete this time slot? This action cannot be undone.
            </p>

            <template #footer>
              <div class="flex justify-end gap-3">
                <UButton
                  color="neutral"
                  variant="outline"
                  :disabled="isDeleting"
                  @click="deleteConfirm = null"
                >
                  Cancel
                </UButton>
                <UButton
                  color="error"
                  :loading="isDeleting"
                  :disabled="isDeleting"
                  @click="handleDelete"
                >
                  Delete
                </UButton>
              </div>
            </template>
          </UCard>
        </template>
      </UModal>
  </div>
</template>


