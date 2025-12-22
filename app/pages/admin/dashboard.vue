<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

useSeoMeta({
  title: 'Admin Dashboard',
  description: 'Manage subscriptions and teachers'
})

const { profile, fetchProfile } = useProfile()

interface AdminSubscription {
  id: string
  student: {
    id: string
    display_name: string
  }
  course: {
    id: string
    label: string
  }
  package: {
    id: string
    label: string
  }
  teacher: string | null
  status: string
  sessions_total: number
  sessions_remaining: number
}

interface Teacher {
  id: string
  display_name: string
  is_active: boolean
}

const { getItems, updateItem } = useDirectusItems()

const subscriptions = ref<AdminSubscription[]>([])
const teachers = ref<Teacher[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)

const selectedTeacher = ref<Record<string, string>>({})
const isAssigning = ref<Record<string, boolean>>({})

// Filter subscriptions needing teacher assignment
const pendingAssignments = computed(() => 
  subscriptions.value.filter(s => s.status === 'payment_received' && !s.teacher)
)

onMounted(async () => {
  await fetchProfile()
  
  // Check if user is admin
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
    // Fetch subscriptions with related data
    const subsData = await getItems<AdminSubscription>({
      collection: 'subscriptions',
      params: {
        fields: ['id', 'status', 'teacher', 'sessions_total', 'sessions_remaining', 
                 'student.id', 'student.display_name',
                 'course.id', 'course.label',
                 'package.id', 'package.label'],
        sort: ['-date_created']
      }
    })
    subscriptions.value = subsData || []

    // Fetch active teachers
    const teachersData = await getItems<Teacher>({
      collection: 'profiles',
      params: {
        filter: {
          role: { _eq: 'teacher' },
          is_active: { _eq: true }
        },
        fields: ['id', 'display_name', 'is_active']
      }
    })
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
    await updateItem<AdminSubscription>({
      collection: 'subscriptions',
      id: subscriptionId,
      item: {
        teacher: teacherId,
        status: 'teacher_assigned'
      }
    })

    // Refresh data
    await loadData()
  } catch (err: any) {
    error.value = err?.message || 'Failed to assign teacher'
  } finally {
    isAssigning.value[subscriptionId] = false
  }
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
      <h1 class="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
      <p class="mt-1 text-slate-600">Manage subscriptions and assign teachers</p>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="space-y-4">
      <USkeleton class="h-12 w-full" />
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

    <div v-else class="space-y-8">
        <!-- Pending Teacher Assignments -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-slate-900">
                Pending Teacher Assignments
              </h2>
              <UBadge v-if="pendingAssignments.length > 0" color="warning">
                {{ pendingAssignments.length }} pending
              </UBadge>
            </div>
          </template>

          <div v-if="pendingAssignments.length === 0" class="py-8 text-center">
            <UIcon name="i-heroicons-check-circle" class="mx-auto h-12 w-12 text-primary-400" />
            <p class="mt-2 text-slate-600">No pending assignments</p>
          </div>

          <div v-else class="divide-y">
            <div
              v-for="sub in pendingAssignments"
              :key="sub.id"
              class="flex items-center justify-between gap-4 py-4"
            >
              <div class="flex-1">
                <p class="font-medium text-slate-900">{{ sub.student?.display_name || 'Unknown Student' }}</p>
                <p class="text-sm text-slate-600">
                  {{ sub.course?.label || 'Course' }} • {{ sub.package?.label || 'Package' }}
                </p>
              </div>

              <div class="flex items-center gap-3">
                <USelect
                  v-model="selectedTeacher[sub.id]"
                  :items="teachers.map(t => ({ value: t.id, label: t.display_name }))"
                  value-key="value"
                  label-key="label"
                  placeholder="Select teacher"
                  class="w-48"
                />
                <UButton
                  color="primary"
                  :loading="isAssigning[sub.id]"
                  :disabled="!selectedTeacher[sub.id] || isAssigning[sub.id]"
                  @click="assignTeacher(sub.id)"
                >
                  Assign
                </UButton>
              </div>
            </div>
          </div>
        </UCard>

        <!-- All Subscriptions -->
        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold text-slate-900">All Subscriptions</h2>
          </template>

          <UTable
            :data="subscriptions"
            :columns="[
              { key: 'student.display_name', label: 'Student' },
              { key: 'course.label', label: 'Course' },
              { key: 'package.label', label: 'Package' },
              { key: 'status', label: 'Status' },
              { key: 'sessions_remaining', label: 'Sessions Left' },
              { key: 'actions', label: '' }
            ]"
          >
            <template #student.display_name-data="{ row }">
              {{ row.student?.display_name || 'Unknown' }}
            </template>
            <template #course.label-data="{ row }">
              {{ row.course?.label || '-' }}
            </template>
            <template #package.label-data="{ row }">
              {{ row.package?.label || '-' }}
            </template>
            <template #status-data="{ row }">
              <UBadge :color="getStatusColor(row.status)" variant="soft" size="sm">
                {{ row.status.replace(/_/g, ' ') }}
              </UBadge>
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
  </div>
</template>

