<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

useSeoMeta({
  title: 'All Subscriptions',
  description: 'Manage all subscriptions'
})

const { profile, fetchProfile } = useProfile()
const { getItems, updateItem } = useDirectusItems()

interface AdminSubscription {
  id: string
  student: {
    id: string
    display_name: string
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
  }
  status: string
  sessions_total: number
  sessions_remaining: number
  postpone_remaining: number
  date_created: string
}

interface Teacher {
  id: string
  display_name: string
}

const subscriptions = ref<AdminSubscription[]>([])
const teachers = ref<Teacher[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)

const statusFilter = ref('')
const selectedTeacher = ref<Record<string, string>>({})
const isAssigning = ref<Record<string, boolean>>({})

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending_payment', label: 'Pending Payment' },
  { value: 'payment_received', label: 'Payment Received' },
  { value: 'teacher_assigned', label: 'Teacher Assigned' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
]

const filteredSubscriptions = computed(() => {
  if (!statusFilter.value) return subscriptions.value
  return subscriptions.value.filter(s => s.status === statusFilter.value)
})

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
    const [subsData, teachersData] = await Promise.all([
      getItems<AdminSubscription>({
        collection: 'subscriptions',
        params: {
          fields: ['id', 'status', 'sessions_total', 'sessions_remaining', 'postpone_remaining', 'date_created',
                   'student.id', 'student.display_name',
                   'teacher.id', 'teacher.display_name',
                   'course.id', 'course.label',
                   'package.id', 'package.label'],
          sort: ['-date_created']
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

    subscriptions.value = subsData || []
    teachers.value = teachersData || []
  } catch (err: any) {
    error.value = err?.message || 'Failed to load data'
  } finally {
    isLoading.value = false
  }
}

async function assignTeacher(subscriptionId: string) {
  const teacherId = selectedTeacher.value[subscriptionId]
  if (!teacherId) return

  isAssigning.value[subscriptionId] = true

  try {
    await updateItem({
      collection: 'subscriptions',
      id: subscriptionId,
      item: {
        teacher: teacherId,
        status: 'teacher_assigned'
      }
    })

    await loadData()
  } catch (err: any) {
    error.value = err?.message || 'Failed to assign teacher'
  } finally {
    isAssigning.value[subscriptionId] = false
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
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
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-slate-900">All Subscriptions</h1>
      <p class="mt-1 text-slate-600">{{ subscriptions.length }} total subscriptions</p>
    </div>

      <!-- Filters -->
      <UCard class="mb-6">
        <div class="flex items-center gap-4">
          <USelect
            v-model="statusFilter"
            :items="statusOptions"
            value-key="value"
            label-key="label"
            placeholder="Filter by status"
            class="w-48"
          />
          <span class="text-sm text-slate-600">
            Showing {{ filteredSubscriptions.length }} of {{ subscriptions.length }}
          </span>
        </div>
      </UCard>

      <!-- Loading -->
      <div v-if="isLoading" class="space-y-4">
        <USkeleton class="h-16 w-full" />
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
      />

      <!-- Subscriptions Table -->
      <UCard v-else>
        <UTable
          :data="filteredSubscriptions"
          :columns="[
            { key: 'student.display_name', label: 'Student' },
            { key: 'course.label', label: 'Course' },
            { key: 'package.label', label: 'Package' },
            { key: 'teacher', label: 'Teacher' },
            { key: 'status', label: 'Status' },
            { key: 'sessions', label: 'Sessions' },
            { key: 'date_created', label: 'Created' },
            { key: 'actions', label: '' }
          ]"
        >
          <template #student.display_name-data="{ row }">
            <span class="font-medium">{{ row.student?.display_name || '-' }}</span>
          </template>
          <template #course.label-data="{ row }">
            {{ row.course?.label || '-' }}
          </template>
          <template #package.label-data="{ row }">
            {{ row.package?.label || '-' }}
          </template>
          <template #teacher-data="{ row }">
            <template v-if="row.teacher">
              {{ row.teacher.display_name }}
            </template>
            <template v-else-if="row.status === 'payment_received'">
              <div class="flex items-center gap-2">
                <USelect
                  v-model="selectedTeacher[row.id]"
                  :items="teachers.map(t => ({ value: t.id, label: t.display_name }))"
                  value-key="value"
                  label-key="label"
                  placeholder="Select..."
                  size="sm"
                  class="w-32"
                />
                <UButton
                  size="xs"
                  color="primary"
                  :loading="isAssigning[row.id]"
                  :disabled="!selectedTeacher[row.id]"
                  @click="assignTeacher(row.id)"
                >
                  Assign
                </UButton>
              </div>
            </template>
            <template v-else>
              <span class="text-slate-400">-</span>
            </template>
          </template>
          <template #status-data="{ row }">
            <UBadge :color="getStatusColor(row.status)" variant="soft" size="sm">
              {{ row.status.replace(/_/g, ' ') }}
            </UBadge>
          </template>
          <template #sessions-data="{ row }">
            {{ row.sessions_remaining }}/{{ row.sessions_total }}
          </template>
          <template #date_created-data="{ row }">
            {{ formatDate(row.date_created) }}
          </template>
          <template #actions-data="{ row }">
            <UButton
              variant="ghost"
              color="neutral"
              size="sm"
              :to="`/admin/subscriptions/${row.id}`"
            >
              View
            </UButton>
          </template>
        </UTable>
      </UCard>
  </div>
</template>

