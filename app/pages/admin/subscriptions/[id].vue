<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

const route = useRoute()
const subscriptionId = computed(() => route.params.id as string)

useSeoMeta({
  title: 'Subscription Details',
  description: 'View and manage subscription'
})

const { profile, fetchProfile } = useProfile()
const { getItemById, getItems, updateItem } = useDirectusItems()
// Removed formatDateOnly - using DateTimeDisplay component instead

interface SubscriptionDetail {
  id: string
  student: {
    id: string
    display_name: string
    phone: string | null
  }
  teacher: {
    id: string
    display_name: string
  } | null
  course: {
    id: string
    label: string
  }
  package: {
    id: string
    label: string
    sessions_per_week: number
  }
  status: string
  sessions_total: number
  sessions_remaining: number
  postpone_total: number
  postpone_remaining: number
  weeks_total: number
  date_created: string
  cycle_start_at: string | null
  cycle_end_at: string | null
  admin_note: string | null
}

interface Teacher {
  id: string
  display_name: string
}

const subscription = ref<SubscriptionDetail | null>(null)
const teachers = ref<Teacher[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)
const selectedTeacher = ref('')
const isAssigning = ref(false)
const adminNote = ref('')
const isSavingNote = ref(false)

onMounted(async () => {
  await fetchProfile()
  
  if (profile.value?.role !== 'admin') {
    navigateTo('/student/dashboard')
    return
  }

  await loadData()
})

async function loadData() {
  isLoading.value = true
  error.value = null

  try {
    const [subData, teachersData] = await Promise.all([
      getItemById<SubscriptionDetail>({
        collection: 'subscriptions',
        id: subscriptionId.value,
        params: {
          fields: [
            'id', 'status', 'sessions_total', 'sessions_remaining', 
            'postpone_total', 'postpone_remaining', 'weeks_total',
            'date_created', 'cycle_start_at', 'cycle_end_at', 'admin_note',
            'student.id', 'student.display_name', 'student.phone',
            'teacher.id', 'teacher.display_name',
            'course.id', 'course.label',
            'package.id', 'package.label', 'package.sessions_per_week'
          ]
        }
      }),
      getItems<Teacher>({
        collection: 'profiles',
        params: {
          filter: {
            role: { _eq: 'teacher' },
            is_active: { _eq: true }
          },
          fields: ['id', 'display_name']
        }
      })
    ])

    subscription.value = subData || null
    teachers.value = teachersData || []
    adminNote.value = subscription.value?.admin_note || ''
  } catch (err: any) {
    error.value = err?.message || 'Failed to load subscription'
  } finally {
    isLoading.value = false
  }
}

async function assignTeacher() {
  if (!selectedTeacher.value) return

  isAssigning.value = true
  error.value = null

  try {
    await updateItem({
      collection: 'subscriptions',
      id: subscriptionId.value,
      item: {
        teacher: selectedTeacher.value,
        status: 'teacher_assigned'
      }
    })

    await loadData()
    selectedTeacher.value = ''
  } catch (err: any) {
    error.value = err?.message || 'Failed to assign teacher'
  } finally {
    isAssigning.value = false
  }
}

async function saveAdminNote() {
  isSavingNote.value = true

  try {
    await updateItem({
      collection: 'subscriptions',
      id: subscriptionId.value,
      item: {
        admin_note: adminNote.value || null
      }
    })
  } catch (err: any) {
    error.value = err?.message || 'Failed to save note'
  } finally {
    isSavingNote.value = false
  }
}

async function updateStatus(newStatus: string) {
  try {
    await updateItem({
      collection: 'subscriptions',
      id: subscriptionId.value,
      item: { status: newStatus }
    })
    await loadData()
  } catch (err: any) {
    error.value = err?.message || 'Failed to update status'
  }
}

function getStatusColor(status: string): 'error' | 'primary' | 'success' | 'info' | 'warning' | 'neutral' {
  const colors: Record<string, 'error' | 'primary' | 'success' | 'info' | 'warning' | 'neutral'> = {
    draft: 'neutral',
    pending_payment: 'warning',
    payment_received: 'info',
    teacher_assigned: 'primary',
    active: 'success',
    completed: 'success',
    cancelled: 'error'
  }
  return colors[status] || 'neutral'
}
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Loading -->
    <div v-if="isLoading" class="space-y-4">
      <USkeleton class="h-8 w-1/3" />
      <USkeleton class="h-64 w-full" />
    </div>

    <!-- Error -->
    <UAlert
      v-else-if="error"
      color="error"
      variant="soft"
      icon="i-heroicons-exclamation-triangle"
      :title="error"
      class="mb-6"
      closable
      @close="error = null"
    />

    <!-- Subscription Details -->
    <template v-else-if="subscription">
      <!-- Header -->
      <div class="mb-6 flex items-start justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Subscription Details</h1>
          <p class="mt-1 text-slate-600">
            Created <DateTimeDisplay :date="subscription.date_created" type="date" />
          </p>
        </div>
        <UBadge :color="getStatusColor(subscription.status)" variant="soft" size="lg">
          {{ subscription.status.replace(/_/g, ' ') }}
        </UBadge>
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <!-- Student Info -->
        <UCard>
          <template #header>
            <h2 class="font-semibold text-slate-900">Student</h2>
          </template>
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
                <UIcon name="i-heroicons-user" class="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p class="font-medium text-slate-900">{{ subscription.student?.display_name || 'Unknown' }}</p>
                <p class="text-sm text-slate-500">{{ subscription.student?.phone || 'No phone' }}</p>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Course & Package -->
        <UCard>
          <template #header>
            <h2 class="font-semibold text-slate-900">Course & Package</h2>
          </template>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-slate-600">Course</span>
              <span class="font-medium">{{ subscription.course?.label || '-' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-600">Package</span>
              <span class="font-medium">{{ subscription.package?.label || '-' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-600">Sessions/Week</span>
              <span class="font-medium">{{ subscription.package?.sessions_per_week || '-' }}</span>
            </div>
          </div>
        </UCard>

        <!-- Teacher Assignment -->
        <UCard>
          <template #header>
            <h2 class="font-semibold text-slate-900">Teacher</h2>
          </template>
          
          <div v-if="subscription.teacher" class="flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
              <UIcon name="i-heroicons-academic-cap" class="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p class="font-medium text-slate-900">{{ subscription.teacher.display_name }}</p>
              <p class="text-sm text-slate-500">Assigned Teacher</p>
            </div>
          </div>

          <div v-else class="space-y-4">
            <p class="text-slate-500">No teacher assigned yet</p>
            
            <div v-if="subscription.status === 'payment_received'" class="flex items-center gap-2">
              <USelect
                v-model="selectedTeacher"
                :items="teachers.map(t => ({ value: t.id, label: t.display_name }))"
                value-key="value"
                label-key="label"
                placeholder="Select teacher..."
                class="flex-1"
              />
              <UButton
                color="primary"
                :loading="isAssigning"
                :disabled="!selectedTeacher"
                @click="assignTeacher"
              >
                Assign
              </UButton>
            </div>
          </div>
        </UCard>

        <!-- Stats -->
        <UCard>
          <template #header>
            <h2 class="font-semibold text-slate-900">Statistics</h2>
          </template>
          <div class="grid grid-cols-2 gap-4">
            <div class="rounded-lg bg-slate-50 p-3 text-center">
              <p class="text-2xl font-bold text-primary-600">{{ subscription.sessions_remaining }}</p>
              <p class="text-xs text-slate-500">Sessions Left</p>
            </div>
            <div class="rounded-lg bg-slate-50 p-3 text-center">
              <p class="text-2xl font-bold text-slate-700">{{ subscription.sessions_total }}</p>
              <p class="text-xs text-slate-500">Total Sessions</p>
            </div>
            <div class="rounded-lg bg-slate-50 p-3 text-center">
              <p class="text-2xl font-bold text-amber-600">{{ subscription.postpone_remaining }}</p>
              <p class="text-xs text-slate-500">Postpones Left</p>
            </div>
            <div class="rounded-lg bg-slate-50 p-3 text-center">
              <p class="text-2xl font-bold text-slate-700">{{ subscription.weeks_total }}</p>
              <p class="text-xs text-slate-500">Total Weeks</p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Admin Note -->
      <UCard class="mt-6">
        <template #header>
          <h2 class="font-semibold text-slate-900">Admin Note</h2>
        </template>
        <div class="space-y-4">
          <UTextarea
            v-model="adminNote"
            placeholder="Add internal notes about this subscription..."
            :rows="3"
            class="w-full"
          />
          <div class="flex justify-end">
            <UButton
              color="primary"
              variant="soft"
              :loading="isSavingNote"
              @click="saveAdminNote"
            >
              Save Note
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Status Actions -->
      <UCard class="mt-6">
        <template #header>
          <h2 class="font-semibold text-slate-900">Actions</h2>
        </template>
        <div class="flex flex-wrap gap-2">
          <UButton
            v-if="subscription.status === 'draft'"
            color="warning"
            variant="soft"
            @click="updateStatus('cancelled')"
          >
            Cancel Subscription
          </UButton>
          <UButton
            v-if="subscription.status === 'active'"
            color="success"
            variant="soft"
            @click="updateStatus('completed')"
          >
            Mark Completed
          </UButton>
          <UButton
            v-if="subscription.status !== 'cancelled'"
            color="error"
            variant="soft"
            @click="updateStatus('cancelled')"
          >
            Cancel
          </UButton>
        </div>
      </UCard>
    </template>

    <!-- Not Found -->
    <UAlert
      v-else
      color="warning"
      variant="soft"
      icon="i-heroicons-question-mark-circle"
      title="Subscription not found"
    />
  </div>
</template>

