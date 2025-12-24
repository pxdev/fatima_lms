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
      <div class="flex items-start justify-between">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
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
        </div>
        <UButton
          variant="ghost"
          color="info"
          size="sm"
          :to="`/student/subscriptions/${subscription.id}`"
          @click="handleActionClick"
        >
          <UIcon name="i-heroicons-arrow-right" class="h-4 w-4" />
        </UButton>
      </div>

      <!-- Progress -->
      <div>
        <div class="mb-1.5 flex justify-between text-xs">
          <span class="text-slate-600">Progress</span>
          <span class="font-medium text-slate-900">
            {{ progress.completed }}/{{ progress.total }}
          </span>
        </div>
        <div class="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            class="h-full rounded-full bg-primary-500 transition-all duration-500"
            :style="{ width: `${progress.percentage}%` }"
          />
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="flex gap-3 text-xs">
        <div class="flex items-center gap-1.5">
          <UIcon name="i-heroicons-book-open" class="h-3.5 w-3.5 text-primary-600" />
          <span class="text-slate-500">Left:</span>
          <span class="font-semibold text-slate-900">{{ subscription.sessions_remaining }}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <UIcon name="i-heroicons-arrow-path" class="h-3.5 w-3.5 text-amber-600" />
          <span class="text-slate-500">Postpones:</span>
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
        :to="`/student/subscriptions/${subscription.id}`"
        @click="handleActionClick"
      >
        <UIcon
          :name="subscription.status === 'draft' ? 'i-heroicons-credit-card' : 'i-heroicons-eye'"
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
    <div class="flex items-start gap-4">
      <!-- Status Icon -->
      <div
        class="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl transition-transform duration-300"
        :class="[
          statusConfig.bg,
          isExpanded && props.expandable ? 'scale-110' : 'group-hover:scale-105'
        ]"
      >
        <UIcon
          :name="statusConfig.icon"
          class="h-7 w-7"
          :class="`text-${statusConfig.color}-600`"
        />
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <h3 class="text-lg font-semibold text-slate-900">
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
          </div>

          <!-- Action Button -->
          <UButton
            :color="subscription.status === 'draft' ? 'warning' : 'primary'"
            :variant="subscription.status === 'draft' ? 'solid' : 'outline'"
            size="sm"
            @click="handleActionClick"
            :to="`/student/subscriptions/${subscription.id}`"
          >
            <UIcon
              :name="subscription.status === 'draft' ? 'i-heroicons-banknotes' : 'i-heroicons-arrow-right'"
              class="h-4 w-4"
            />
          </UButton>
        </div>

        <!-- Quick Stats -->
        <div class="mt-3 grid grid-cols-3 gap-3">
          <div class="flex items-center gap-2">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50">
              <UIcon name="i-heroicons-book-open" class="h-4 w-4 text-primary-600" />
            </div>
            <div>
              <p class="text-xs text-slate-500">Remaining</p>
              <p class="text-sm font-semibold text-slate-900">{{ subscription.sessions_remaining }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
              <UIcon name="i-heroicons-arrow-path" class="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p class="text-xs text-slate-500">Postpones</p>
              <p class="text-sm font-semibold text-amber-600">{{ subscription.postpone_remaining }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
              <UIcon name="i-heroicons-calendar" class="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p class="text-xs text-slate-500">Weeks</p>
              <p class="text-sm font-semibold text-slate-900">{{ subscription.weeks_total }}</p>
            </div>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="mt-4">
          <div class="mb-1.5 flex items-center justify-between text-xs">
            <span class="text-slate-600">Sessions Progress</span>
            <span class="font-semibold text-slate-900">
              {{ progress.completed }} / {{ progress.total }} ({{ progress.percentage }}%)
            </span>
          </div>
          <div class="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              class="h-full rounded-full bg-primary-600 transition-all duration-700 ease-out"
              :style="{ width: `${progress.percentage}%` }"
            />
          </div>
        </div>
      </div>

      <!-- Expand Icon -->
      <div v-if="expandable" class="flex-shrink-0">
        <UIcon
          name="i-heroicons-chevron-down"
          class="h-5 w-5 text-slate-400 transition-transform duration-300"
          :class="{ 'rotate-180': isExpanded }"
        />
      </div>
    </div>

    <!-- Expanded Details -->
    <div
      v-if="expandable"
      v-show="isExpanded"
      class="mt-4 border-t border-slate-200 pt-4"
    >
      <div class="grid gap-4 sm:grid-cols-2">
        <!-- Course Details -->
        <div class="space-y-2">
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">Course Details</p>
          <div class="space-y-1">
            <p class="text-sm text-slate-900">
              <span class="font-medium">Course:</span> {{ course?.label || 'N/A' }}
            </p>
            <p class="text-sm text-slate-600">
              <span class="font-medium">Package:</span> {{ package_?.label || 'N/A' }}
            </p>
          </div>
        </div>

        <!-- Subscription Stats -->
        <div class="space-y-2">
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">Statistics</p>
          <div class="space-y-1 text-sm">
            <div class="flex justify-between">
              <span class="text-slate-600">Total Sessions:</span>
              <span class="font-semibold text-slate-900">{{ subscription.sessions_total }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-600">Sessions Completed:</span>
              <span class="font-semibold text-green-600">{{ progress.completed }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-600">Postpones Used:</span>
              <span class="font-semibold text-amber-600">
                {{ subscription.postpone_total - subscription.postpone_remaining }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div v-if="showActions" class="mt-4 flex gap-2">
        <UButton
          block
          :color="subscription.status === 'draft' ? 'warning' : 'primary'"
          :variant="subscription.status === 'draft' ? 'solid' : 'outline'"
          :to="`/student/subscriptions/${subscription.id}`"
          @click="handleActionClick"
        >
          <UIcon
            :name="subscription.status === 'draft' ? 'i-heroicons-banknotes' : 'i-heroicons-eye'"
            class="mr-2 h-4 w-4"
          />
          {{ subscription.status === 'draft' ? 'Complete Payment' : 'View Full Details' }}
        </UButton>
        <UButton
          v-if="['active', 'teacher_assigned'].includes(subscription.status)"
          block
          variant="outline"
          color="neutral"
          :to="`/student/subscriptions/${subscription.id}/sessions`"
          @click="handleActionClick"
        >
          <UIcon name="i-heroicons-video-camera" class="mr-2 h-4 w-4" />
          View Sessions
        </UButton>
      </div>
    </div>
  </UCard>

  <!-- Hero Variant (for subscription detail page) -->
  <div v-else-if="variant === 'hero'">
    <!-- Hero Header Card -->
    <UCard class="mb-6">
      <div class="bg-gradient-to-br from-primary-600 to-primary-700 p-8 text-white">
        <div class="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div class="flex-1">
            <div class="mb-3">
              <UBadge
                :color="getStatusColor(subscription.status) as any"
                variant="solid"
                size="lg"
              >
                {{ statusConfig.label }}
              </UBadge>
            </div>
            <h1 class="mb-2 text-3xl font-bold md:text-4xl">
              {{ course?.label || 'Course' }}
            </h1>
            <p class="text-lg text-primary-100">
              {{ package_?.label || 'Package' }}
            </p>
          </div>

          <!-- Progress Circle -->
          <div class="flex items-center justify-center">
            <div class="relative">
              <svg class="h-24 w-24 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="rgba(255,255,255,0.2)"
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
                <span class="text-2xl font-bold">{{ progress.percentage }}%</span>
                <span class="text-xs text-primary-100">Complete</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Progress Bar Section -->
      <div class="p-6">
        <div class="mb-2 flex items-center justify-between">
          <span class="text-sm font-medium text-slate-600">Sessions Progress</span>
          <span class="text-sm font-semibold text-slate-900">
            {{ progress.completed }} / {{ progress.total }} sessions
          </span>
        </div>
        <div class="h-3 overflow-hidden rounded-full bg-slate-200">
          <div
            class="h-full rounded-full bg-primary-600 transition-all duration-500 ease-out"
            :style="{ width: `${progress.percentage}%` }"
          />
        </div>
      </div>
    </UCard>

    <!-- Stats Grid -->
    <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <!-- Sessions Remaining -->
      <UCard class="group transition-all duration-300">
        <div class="p-5">
          <div class="mb-3 flex items-center justify-between">
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100">
              <UIcon name="i-heroicons-book-open" class="h-6 w-6 text-primary-600" />
            </div>
          </div>
          <p class="text-2xl font-bold text-slate-900">
            {{ subscription.sessions_remaining }}
          </p>
          <p class="mt-1 text-sm font-medium text-slate-600">Sessions Remaining</p>
          <p class="mt-1 text-xs text-slate-500">Keep learning!</p>
        </div>
      </UCard>

      <!-- Total Sessions -->
      <UCard class="group transition-all duration-300">
        <div class="p-5">
          <div class="mb-3 flex items-center justify-between">
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
              <UIcon name="i-heroicons-clipboard-document-list" class="h-6 w-6 text-slate-600" />
            </div>
          </div>
          <p class="text-2xl font-bold text-slate-900">
            {{ subscription.sessions_total }}
          </p>
          <p class="mt-1 text-sm font-medium text-slate-600">Total Sessions</p>
          <p class="mt-1 text-xs text-slate-500">In your package</p>
        </div>
      </UCard>

      <!-- Postpones Remaining -->
      <UCard class="group transition-all duration-300">
        <div class="p-5">
          <div class="mb-3 flex items-center justify-between">
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
              <UIcon name="i-heroicons-arrow-path" class="h-6 w-6 text-amber-600" />
            </div>
          </div>
          <p class="text-2xl font-bold text-amber-600">
            {{ subscription.postpone_remaining }}
          </p>
          <p class="mt-1 text-sm font-medium text-slate-600">Postpones Left</p>
          <p class="mt-1 text-xs text-slate-500">Reschedule options</p>
        </div>
      </UCard>

      <!-- Weeks Total -->
      <UCard class="group transition-all duration-300">
        <div class="p-5">
          <div class="mb-3 flex items-center justify-between">
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <UIcon name="i-heroicons-calendar" class="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p class="text-2xl font-bold text-slate-900">
            {{ subscription.weeks_total }}
          </p>
          <p class="mt-1 text-sm font-medium text-slate-600">Total Weeks</p>
          <p class="mt-1 text-xs text-slate-500">Learning duration</p>
        </div>
      </UCard>
    </div>
  </div>
</template>

