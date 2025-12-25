<script setup lang="ts">
import type { Subscription } from '~/composables/useSubscriptions'

interface Props {
  subscription: Subscription
  variant?: 'compact' | 'default' | 'hero'
  expandable?: boolean
  showActions?: boolean
  expanded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  expandable: false,
  showActions: true,
  expanded: false
})

const emit = defineEmits<{
  click: [subscription: Subscription]
  'update:expanded': [value: boolean]
  expand: [subscription: Subscription]
}>()

const {
  getStatusConfig,
  getSessionsProgress,
  getSubscriptionCourse,
  getSubscriptionPackage,
  getStatusColor
} = useSubscriptionCard()

const isExpanded = computed({
  get: () => props.expanded,
  set: (value) => emit('update:expanded', value)
})

const course = computed(() => getSubscriptionCourse(props.subscription))
const package_ = computed(() => getSubscriptionPackage(props.subscription))
const progress = computed(() => getSessionsProgress(props.subscription))
const statusConfig = computed(() => getStatusConfig(props.subscription.status))

// Get teacher display name
const teacherDisplayName = computed(() => {
  if (!props.subscription.teacher) return null
  if (typeof props.subscription.teacher === 'object' && props.subscription.teacher !== null) {
    return (props.subscription.teacher as any).display_name || null
  }
  return null
})

function handleClick() {
  emit('click', props.subscription)
  if (props.expandable) {
    isExpanded.value = !isExpanded.value
    emit('expand', props.subscription)
  }
}

function handleActionClick(e: Event) {
  e.stopPropagation()
}
</script>

<template>
  <!-- Compact Variant (for dashboard grid) -->
  <UCard
    v-if="variant === 'compact'"
    class="group transition-all duration-300"
    @click="handleClick"
  >

  

    <div class="space-y-4">
      <!-- Header -->
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1 min-w-0">
          <div class="flex flex-wrap items-center gap-2 mb-2">
            <h3 class="text-base font-semibold text-slate-900 truncate">
              {{ course?.label || 'Course' }}
            </h3>
            <UBadge
              :color="getStatusColor(subscription.status) as any"
              variant="soft"
              size="sm"
            >
              {{ statusConfig.label }}
            </UBadge>
          </div>
          <p class="text-sm text-slate-600 truncate">
            {{ package_?.label || 'Package' }}
          </p>
          <!-- Teacher and Subscription ID -->
          <div class="mt-2 space-y-1.5">
            <div v-if="teacherDisplayName" class="flex items-center gap-1.5 text-xs text-slate-500">
              <UIcon name="hugeicons:user-02" class="h-3.5 w-3.5 flex-shrink-0" />
              <span class="truncate">{{ teacherDisplayName }}</span>
            </div>
            <div class="flex items-center gap-1.5 text-xs">
              <UIcon name="hugeicons:tag-01" class="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <span class="font-mono text-[10px] sm:text-xs text-slate-600 break-all">{{ subscription.id }}</span>
            </div>
          </div>
        </div>
        <UButton
          variant="ghost"
          color="info"
          size="sm"
          square
          class="flex-shrink-0"
          :to="`/student/subscriptions/${subscription.id}`"
          @click="handleActionClick"
        >
          <UIcon name="hugeicons:arrow-right-01" class="h-4 w-4" />
        </UButton>
      </div>

      <!-- Course Progress -->
      <div class="space-y-2">
        <div class="flex items-center justify-between gap-2">
          <span class="text-xs font-medium text-slate-700">Course Progress</span>
          <span class="text-xs font-semibold text-slate-900 whitespace-nowrap">
            {{ progress.completed }}/{{ progress.total }}
          </span>
        </div>
        <UProgress
          v-model="progress.completed"
          :max="progress.total"
          color="primary"
          size="sm"
        />
      </div>

      <!-- Quick Stats -->
      <div class="flex flex-wrap gap-2 sm:gap-3 text-xs">
        <div class="flex items-center gap-1.5 min-w-0 flex-1 sm:flex-initial">
          <UIcon name="hugeicons:video-01" class="h-4 w-4 text-primary-600 flex-shrink-0" />
          <span class="text-slate-500 whitespace-nowrap">Left:</span>
          <span class="font-semibold text-slate-900">{{ subscription.sessions_remaining }}</span>
        </div>
        <div class="flex items-center gap-1.5 min-w-0 flex-1 sm:flex-initial">
          <UIcon name="hugeicons:clock-05" class="h-4 w-4 text-amber-600 flex-shrink-0" />
          <span class="text-slate-500 whitespace-nowrap">Postpones:</span>
          <span class="font-semibold text-amber-600">{{ subscription.postpone_remaining }}</span>
        </div>
      </div>

      <!-- Footer Action -->
      <UButton
        v-if="showActions"
        block
        size="sm"
        :color="subscription.status === 'draft' ? 'warning' : 'primary'"
        :variant="subscription.status === 'draft' ? 'solid' : 'outline'"
        class="min-h-[44px]"
        :to="`/student/subscriptions/${subscription.id}`"
        @click="handleActionClick"
      >
        <UIcon
          :name="subscription.status === 'draft' ? 'hugeicons:credit-card-02' : 'hugeicons:eye'"
          class="mr-1.5 h-4 w-4"
        />
        {{ subscription.status === 'draft' ? 'Pay Now' : 'View Details' }}
      </UButton>
    </div>
  </UCard>

  <!-- Default Variant (for subscriptions list) -->
  <UCard
    v-else-if="variant === 'default'"
    class="group cursor-pointer transition-all duration-300"
    :class="statusConfig.border"
    @click="handleClick"
  >
    <!-- Main Content -->
    <div class="">
      <div class="flex flex-col sm:flex-row items-start gap-4">
        <!-- Status Icon -->
        <div
          class="flex h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0 items-center justify-center rounded-xl transition-transform duration-300 mx-auto sm:mx-0"
          :class="[
            statusConfig.bg,
            isExpanded && props.expandable ? 'scale-110' : 'group-hover:scale-105'
          ]"
        >
          <UIcon
            :name="statusConfig.icon"
            class="h-6 w-6 sm:h-7 sm:w-7"
            :class="`text-${statusConfig.color}-600`"
          />
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0 w-full">
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex flex-wrap items-center gap-2 mb-2">
                <h3 class="text-base sm:text-lg font-semibold text-slate-900">
                  {{ course?.label || 'Course' }}
                </h3>
                <UBadge
                  :color="getStatusColor(subscription.status) as any"
                  variant="soft"
                  size="sm"
                >
                  {{ statusConfig.label }}
                </UBadge>
              </div>
              <p class="text-sm text-slate-600">
                {{ package_?.label || 'Package' }}
              </p>
              <!-- Teacher and Subscription ID -->
              <div class="mt-2 space-y-1.5">
                <div v-if="teacherDisplayName" class="flex items-center gap-1.5 text-xs text-slate-500">
                  <UIcon name="hugeicons:user-02" class="h-3.5 w-3.5 flex-shrink-0" />
                  <span class="truncate">{{ teacherDisplayName }}</span>
                </div>
                <div class="flex items-start gap-1.5 text-xs">
                  <UIcon name="hugeicons:tag-01" class="h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <span class="font-mono text-[10px] sm:text-xs text-slate-600 break-all">{{ subscription.id }}</span>
                </div>
              </div>
            </div>

            <!-- Action Button -->
            <div class="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
              <UButton
                :color="subscription.status === 'draft' ? 'warning' : 'primary'"
                :variant="subscription.status === 'draft' ? 'solid' : 'outline'"
                size="sm"
                class="flex-1 sm:flex-initial"
                @click="handleActionClick"
                :to="`/student/subscriptions/${subscription.id}`"
              >
                <UIcon
                  :name="subscription.status === 'draft' ? 'hugeicons:credit-card-02' : 'hugeicons:arrow-right-01'"
                  class="h-4 w-4"
                />
                <span class="hidden sm:inline">
                  {{ subscription.status === 'draft' ? 'Pay' : 'Manage' }}
                </span>
              </UButton>
              <!-- Expand Icon -->
              <UButton
                v-if="expandable"
                variant="ghost"
                color="neutral"
                size="sm"
                square
                @click.stop="handleClick"
              >
                <UIcon
                  name="hugeicons:arrow-down-01"
                  class="h-5 w-5 text-slate-400 transition-transform duration-300"
                  :class="{ 'rotate-180': isExpanded }"
                />
              </UButton>
            </div>
          </div>

          <!-- Quick Stats -->
          <div class="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
            <div class="flex flex-col items-center sm:flex-row sm:items-center gap-1 sm:gap-2">
              <div class="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-primary-200 flex-shrink-0">
                <UIcon name="hugeicons:video-01" class="h-5 w-5 text-primary-600" />
              </div>
              <div class="text-center sm:text-left min-w-0">
                <p class="text-xs text-slate-500 truncate">Remaining</p>
                <p class="font-semibold text-slate-900">{{ subscription.sessions_remaining }}</p>
              </div>
            </div>
            <div class="flex flex-col items-center sm:flex-row sm:items-center gap-1 sm:gap-2">
              <div class="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-amber-50 flex-shrink-0">
                <UIcon name="hugeicons:clock-05" class="h-5 w-5 text-amber-600" />
              </div>
              <div class="text-center sm:text-left min-w-0">
                <p class="text-xs text-slate-500 truncate">Postpones</p>
                <p class="text-sm font-semibold text-amber-600">{{ subscription.postpone_remaining }}</p>
              </div>
            </div>
            <div class="flex flex-col items-center sm:flex-row sm:items-center gap-1 sm:gap-2">
              <div class="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-blue-50 flex-shrink-0">
                <UIcon name="hugeicons:calendar-02" class="h-5 w-5 text-blue-600" />
              </div>
              <div class="text-center sm:text-left min-w-0">
                <p class="text-xs text-slate-500 truncate">Weeks</p>
                <p class="text-sm font-semibold text-slate-900">{{ subscription.weeks_total }}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- Expanded Details -->
    <div
      v-if="expandable"
      v-show="isExpanded"
      class="pt-6 mt-10 sm:pt-7 px-4 sm:px-5 pb-4 sm:pb-5 bg-slate-50/60 border-t border-slate-200"
    >
      <!-- Top row: progress summary -->
      <div class="mb-4 sm:mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">Overall Progress</p>
          <p class="mt-1 text-sm sm:text-base font-semibold text-slate-900">
            {{ progress.completed }} of {{ progress.total }} sessions completed
          </p>
        </div>
        <div class="w-full sm:w-56">
          <div class="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Progress</span>
            <span class="font-semibold text-slate-900">{{ progress.percentage }}%</span>
          </div>
          <UProgress
            v-model="progress.completed"
            :max="progress.total"
            color="primary"
            size="md"
          />
        </div>
      </div>

      <!-- Details grid -->
      <div class="grid gap-4 sm:grid-cols-2">
        <!-- Course Details -->
        <div class="space-y-3">
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">Course Details</p>
          <div class="space-y-1.5 text-sm">
            <div class="flex items-start justify-between gap-3">
              <span class="text-slate-500">Course</span>
              <span class="font-semibold text-slate-900 text-right">
                {{ course?.label || 'N/A' }}
              </span>
            </div>
            <div class="flex items-start justify-between gap-3">
              <span class="text-slate-500">Package</span>
              <span class="font-semibold text-slate-900 text-right">
                {{ package_?.label || 'N/A' }}
              </span>
            </div>
            <div
              v-if="teacherDisplayName"
              class="flex items-start justify-between gap-3"
            >
              <span class="text-slate-500">Teacher</span>
              <span class="font-semibold text-slate-900 text-right">
                {{ teacherDisplayName }}
              </span>
            </div>
          </div>
        </div>

        <!-- Subscription Stats -->
        <div class="space-y-3">
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">Statistics</p>
          <div class="space-y-1.5 text-sm">
            <div class="flex items-center justify-between gap-3">
              <span class="text-slate-500">Total Sessions</span>
              <span class="font-semibold text-slate-900">
                {{ subscription.sessions_total }}
              </span>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="text-slate-500">Completed</span>
              <span class="font-semibold text-green-600">
                {{ progress.completed }}
              </span>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="text-slate-500">Remaining</span>
              <span class="font-semibold text-slate-900">
                {{ subscription.sessions_remaining }}
              </span>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="text-slate-500">Postpones Used</span>
              <span class="font-semibold text-amber-600">
                {{ subscription.postpone_total - subscription.postpone_remaining }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div v-if="showActions" class="mt-4 flex flex-col sm:flex-row gap-2">
        <UButton
          block
          :color="subscription.status === 'draft' ? 'warning' : 'primary'"
          :variant="subscription.status === 'draft' ? 'solid' : 'outline'"
          size="sm"
          class="min-h-[44px]"
          :to="`/student/subscriptions/${subscription.id}`"
          @click="handleActionClick"
        >
          <UIcon
            :name="subscription.status === 'draft' ? 'hugeicons:credit-card-02' : 'hugeicons:eye'"
            class="mr-2 h-4 w-4"
          />
          <span class="hidden sm:inline">{{ subscription.status === 'draft' ? 'Complete Payment' : 'View Full Details' }}</span>
          <span class="sm:hidden">{{ subscription.status === 'draft' ? 'Pay' : 'Manage' }}</span>
        </UButton>
        <UButton
          v-if="['active', 'teacher_assigned'].includes(subscription.status)"
          block
          variant="outline"
          color="neutral"
          size="sm"
          class="min-h-[44px]"
          :to="`/student/subscriptions/${subscription.id}/sessions`"
          @click="handleActionClick"
        >
          <UIcon name="hugeicons:video-02" class="mr-2 h-4 w-4" />
          <span class="hidden sm:inline">View Sessions</span>
          <span class="sm:hidden">Sessions</span>
        </UButton>
      </div>
    </div>
  </UCard>

  <!-- Hero Variant (for subscription detail page) -->
  <div v-else-if="variant === 'hero'">
    <!-- Hero Header Card -->
    <UCard class="mb-4 sm:mb-6">
      <div class="bg-gradient-to-r from-primary/20 to-secondary/20 p-4 sm:p-6 md:p-8">
        <div class="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-center md:justify-between">
          <div class="flex-1 min-w-0">
            <div class="mb-2 sm:mb-3">
              <UBadge
                :color="getStatusColor(subscription.status) as any"
                variant="solid"
                size="sm"
                class="sm:size-lg"
              >
                {{ statusConfig.label }}
              </UBadge>
            </div>
            <h1 class="mb-2 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold break-words">
              {{ course?.label || 'Course' }}
            </h1>
            <p class="text-sm sm:text-base md:text-lg break-words">
              {{ package_?.label || 'Package' }}
            </p>
            <!-- Teacher and Subscription ID -->
            <div class="mt-3 space-y-2">
              <div v-if="teacherDisplayName" class="flex items-center gap-1.5 text-xs sm:text-sm">
                <UIcon name="hugeicons:user-02" class="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span class="truncate">{{ teacherDisplayName }}</span>
              </div>
              <div class="flex items-start gap-1.5 text-xs sm:text-sm">
                <UIcon name="hugeicons:tag-01" class="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 mt-0.5" />
                <div class="flex-1 min-w-0">
                  <span class=" font-medium">ID: </span>
                  <span class="font-mono text-[10px] sm:text-xs  break-all">{{ subscription.id }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Progress Circle -->
          <div class="flex items-center justify-center mt-2 sm:mt-4 md:mt-0 flex-shrink-0">
            <div class="relative">
              <svg class="h-20 w-20 sm:h-24 sm:w-24 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="rgba(255,255,255,0.8)"
                  stroke-width="8"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="white"
                  stroke-width="8"
                  fill="none"
                  stroke-dasharray="251.2"
                  :stroke-dashoffset="251.2 - (progress.percentage / 100) * 251.2"
                  class="transition-all duration-500 ease-out"
                />
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-xl sm:text-xl font-bold">{{ progress.percentage }}%</span>
                <span class="text-[10px]">Complete</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Course Progress Section -->
      <div class="p-4 sm:p-6">
        <div class="mb-3 space-y-3">
          <div class="flex items-center justify-between gap-2">
            <span class="text-sm sm:text-base font-semibold text-slate-700">Course Progress</span>
            <span class="text-sm sm:text-base font-bold text-slate-900 whitespace-nowrap">
              {{ progress.percentage }}%
            </span>
          </div>
          <UProgress
            v-model="progress.completed"
            :max="progress.total"
            color="primary"
            size="lg"
          />
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 text-xs sm:text-sm text-slate-600">
            <span>{{ progress.completed }} of {{ progress.total }} sessions completed</span>
            <span class="font-medium whitespace-nowrap">{{ subscription.sessions_remaining }} remaining</span>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Stats Grid -->
    <div class="mb-4 sm:mb-6 grid gap-2 sm:gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
      <!-- Sessions Remaining -->
      <UCard class="group transition-all duration-300">
        <div class="p-3 sm:p-4 md:p-5">
          <div class="mb-2 sm:mb-3 flex items-center justify-center sm:justify-start">
            <div class="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-primary-200">
              <UIcon name="hugeicons:video-01" class="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
            </div>
          </div>
          <p class="text-xl sm:text-2xl font-bold text-slate-900 text-center sm:text-left">
            {{ subscription.sessions_remaining }}
          </p>
          <p class="mt-1 text-xs sm:text-sm font-medium text-slate-600 text-center sm:text-left break-words">Sessions Remaining</p>
          <p class="mt-1 text-xs text-slate-500 text-center sm:text-left">Keep learning!</p>
        </div>
      </UCard>

      <!-- Total Sessions -->
      <UCard class="group transition-all duration-300">
        <div class="p-3 sm:p-4 md:p-5">
          <div class="mb-2 sm:mb-3 flex items-center justify-center sm:justify-start">
            <div class="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-slate-100">
              <UIcon name="hugeicons:clipboard-check" class="h-5 w-5 sm:h-6 sm:w-6 text-slate-600" />
            </div>
          </div>
          <p class="text-xl sm:text-2xl font-bold text-slate-900 text-center sm:text-left">
            {{ subscription.sessions_total }}
          </p>
          <p class="mt-1 text-xs sm:text-sm font-medium text-slate-600 text-center sm:text-left break-words">Total Sessions</p>
          <p class="mt-1 text-xs text-slate-500 text-center sm:text-left">In your package</p>
        </div>
      </UCard>

      <!-- Postpones Remaining -->
      <UCard class="group transition-all duration-300">
        <div class="p-3 sm:p-4 md:p-5">
          <div class="mb-2 sm:mb-3 flex items-center justify-center sm:justify-start">
            <div class="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-amber-100">
              <UIcon name="hugeicons:clock-05" class="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
            </div>
          </div>
          <p class="text-xl sm:text-2xl font-bold text-amber-600 text-center sm:text-left">
            {{ subscription.postpone_remaining }}
          </p>
          <p class="mt-1 text-xs sm:text-sm font-medium text-slate-600 text-center sm:text-left break-words">Postpones Left</p>
          <p class="mt-1 text-xs text-slate-500 text-center sm:text-left">Reschedule options</p>
        </div>
      </UCard>

      <!-- Weeks Total -->
      <UCard class="group transition-all duration-300">
        <div class="p-3 sm:p-4 md:p-5">
          <div class="mb-2 sm:mb-3 flex items-center justify-center sm:justify-start">
            <div class="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-blue-100">
              <UIcon name="hugeicons:calendar-02" class="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
          </div>
          <p class="text-xl sm:text-2xl font-bold text-slate-900 text-center sm:text-left">
            {{ subscription.weeks_total }}
          </p>
          <p class="mt-1 text-xs sm:text-sm font-medium text-slate-600 text-center sm:text-left break-words">Total Weeks</p>
          <p class="mt-1 text-xs text-slate-500 text-center sm:text-left">Learning duration</p>
        </div>
      </UCard>
    </div>
  </div>
</template>

