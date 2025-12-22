<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

const route = useRoute()
const subscriptionId = computed(() => route.params.id as string)

const { 
  currentSubscription, 
  fetchSubscription, 
  updateSubscriptionStatus,
  getStatusColor, 
  isLoading, 
  error 
} = useSubscriptions()
const { packages, fetchPackages, getPackageById } = usePackages()
const { courses, fetchCourses, getCourseById } = useCourses()

const selectedCourse = computed(() => 
  currentSubscription.value ? getCourseById(currentSubscription.value.course) : null
)
const selectedPackage = computed(() => 
  currentSubscription.value ? getPackageById(currentSubscription.value.package) : null
)

const isPolling = ref(false)
const pollingInterval = ref<NodeJS.Timeout | null>(null)

useSeoMeta({
  title: computed(() => `Subscription - ${selectedCourse.value?.label || 'Loading...'}`),
  description: 'View and manage your subscription'
})

onMounted(async () => {
  await Promise.all([
    fetchSubscription(subscriptionId.value),
    fetchCourses(),
    fetchPackages()
  ])

  // Start polling if waiting for payment
  if (currentSubscription.value?.status === 'pending_payment') {
    startPolling()
  }
})

onUnmounted(() => {
  stopPolling()
})

function startPolling() {
  isPolling.value = true
  pollingInterval.value = setInterval(async () => {
    await fetchSubscription(subscriptionId.value)
    
    // Stop polling when status changes
    if (currentSubscription.value?.status !== 'pending_payment') {
      stopPolling()
    }
  }, 5000) // Poll every 5 seconds
}

function stopPolling() {
  isPolling.value = false
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value)
    pollingInterval.value = null
  }
}

async function proceedToPayment() {
  if (!currentSubscription.value || !selectedPackage.value) return

  // Update status to pending_payment
  await updateSubscriptionStatus(currentSubscription.value.id, 'pending_payment')

  // Start polling for payment confirmation
  startPolling()

  // Redirect to Lemon Squeezy checkout
  const lemonVariantId = selectedPackage.value.lemon_variant_id
  if (lemonVariantId) {
    const checkoutUrl = `https://mrsfatima.lemonsqueezy.com/checkout/buy/${lemonVariantId}?checkout[custom][subscription_id]=${currentSubscription.value.id}`
    window.open(checkoutUrl, '_blank')
  }
}

function goToSchedule() {
  navigateTo(`/student/subscriptions/${subscriptionId.value}/schedule`)
}

function goToSessions() {
  navigateTo(`/student/subscriptions/${subscriptionId.value}/sessions`)
}
</script>

<template>
  <div class="max-w-3xl mx-auto">

      <!-- Loading State -->
      <UCard v-if="isLoading && !currentSubscription">
        <USkeleton class="mb-4 h-8 w-1/3" />
        <USkeleton class="mb-2 h-4 w-full" />
        <USkeleton class="mb-2 h-4 w-2/3" />
        <USkeleton class="h-32 w-full" />
      </UCard>

      <!-- Error State -->
      <UAlert
        v-else-if="error"
        color="error"
        variant="soft"
        icon="i-heroicons-exclamation-triangle"
        :title="error"
      />

      <!-- Subscription Details -->
      <template v-else-if="currentSubscription">
        <UCard>
          <!-- Header -->
          <div class="flex items-start justify-between">
            <div>
              <h1 class="text-2xl font-bold text-slate-900">
                {{ selectedCourse?.label || 'Course' }}
              </h1>
              <p class="mt-1 text-slate-600">
                {{ selectedPackage?.label || 'Package' }}
              </p>
            </div>
            <UBadge
              :color="getStatusColor(currentSubscription.status)"
              variant="soft"
              size="lg"
            >
              {{ currentSubscription.status.replace(/_/g, ' ') }}
            </UBadge>
          </div>

          <!-- Stats Grid -->
          <div class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div class="rounded-lg bg-slate-50 p-4 text-center">
              <p class="text-2xl font-bold text-primary-600">
                {{ currentSubscription.sessions_remaining }}
              </p>
              <p class="text-xs text-slate-500">Sessions Left</p>
            </div>
            <div class="rounded-lg bg-slate-50 p-4 text-center">
              <p class="text-2xl font-bold text-slate-700">
                {{ currentSubscription.sessions_total }}
              </p>
              <p class="text-xs text-slate-500">Total Sessions</p>
            </div>
            <div class="rounded-lg bg-slate-50 p-4 text-center">
              <p class="text-2xl font-bold text-amber-600">
                {{ currentSubscription.postpone_remaining }}
              </p>
              <p class="text-xs text-slate-500">Postpones Left</p>
            </div>
            <div class="rounded-lg bg-slate-50 p-4 text-center">
              <p class="text-2xl font-bold text-slate-700">
                {{ currentSubscription.weeks_total }}
              </p>
              <p class="text-xs text-slate-500">Weeks</p>
            </div>
          </div>

          <!-- Status-specific content -->
          <div class="mt-6">
            <!-- Draft: Show Pay Now -->
            <div v-if="currentSubscription.status === 'draft'" class="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div class="flex items-center gap-3">
                <UIcon name="i-heroicons-credit-card" class="h-6 w-6 text-amber-600" />
                <div class="flex-1">
                  <p class="font-medium text-amber-800">Payment Required</p>
                  <p class="text-sm text-amber-700">Complete your payment to activate your subscription.</p>
                </div>
                <UButton color="primary" @click="proceedToPayment">
                  Pay Now
                </UButton>
              </div>
            </div>

            <!-- Pending Payment: Show polling message -->
            <div v-else-if="currentSubscription.status === 'pending_payment'" class="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div class="flex items-center gap-3">
                <UIcon 
                  name="i-heroicons-arrow-path" 
                  class="h-6 w-6 text-blue-600"
                  :class="{ 'animate-spin': isPolling }"
                />
                <div>
                  <p class="font-medium text-blue-800">Waiting for Payment</p>
                  <p class="text-sm text-blue-700">Please complete your payment in the new window. This page will update automatically.</p>
                </div>
              </div>
            </div>

            <!-- Payment Received: Waiting for teacher -->
            <div v-else-if="currentSubscription.status === 'payment_received'" class="rounded-lg border border-green-200 bg-green-50 p-4">
              <div class="flex items-center gap-3">
                <UIcon name="i-heroicons-check-circle" class="h-6 w-6 text-green-600" />
                <div>
                  <p class="font-medium text-green-800">Payment Confirmed!</p>
                  <p class="text-sm text-green-700">An admin will assign a teacher to you shortly.</p>
                </div>
              </div>
            </div>

            <!-- Teacher Assigned: Can schedule -->
            <div v-else-if="currentSubscription.status === 'teacher_assigned'" class="rounded-lg border border-primary-200 bg-primary-50 p-4">
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <UIcon name="i-heroicons-user-circle" class="h-6 w-6 text-primary-600" />
                  <div>
                    <p class="font-medium text-primary-800">Teacher Assigned!</p>
                    <p class="text-sm text-primary-700">You can now schedule your sessions.</p>
                  </div>
                </div>
                <UButton color="primary" @click="goToSchedule">
                  Schedule Sessions
                </UButton>
              </div>
            </div>

            <!-- Active: Show sessions link -->
            <div v-else-if="currentSubscription.status === 'active'" class="space-y-4">
              <div class="rounded-lg border border-primary-200 bg-primary-50 p-4">
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <UIcon name="i-heroicons-play-circle" class="h-6 w-6 text-primary-600" />
                    <div>
                      <p class="font-medium text-primary-800">Subscription Active</p>
                      <p class="text-sm text-primary-700">Your sessions are scheduled and ready.</p>
                    </div>
                  </div>
                  <div class="flex gap-2">
                    <UButton color="neutral" variant="outline" @click="goToSchedule">
                      Schedule More
                    </UButton>
                    <UButton color="primary" @click="goToSessions">
                      View Sessions
                    </UButton>
                  </div>
                </div>
              </div>
            </div>

            <!-- Completed: Show renewal option -->
            <div v-else-if="currentSubscription.status === 'completed'" class="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <UIcon name="i-heroicons-check-circle" class="h-6 w-6 text-slate-600" />
                  <div>
                    <p class="font-medium text-slate-800">Subscription Completed</p>
                    <p class="text-sm text-slate-600">All sessions have been completed. Ready to continue?</p>
                  </div>
                </div>
                <UButton color="primary" :to="`/student/subscriptions/${subscriptionId}/renew`">
                  <UIcon name="i-heroicons-arrow-path" class="mr-2 h-4 w-4" />
                  Renew
                </UButton>
              </div>
            </div>
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
        description="The subscription you're looking for doesn't exist or you don't have access to it."
      />
  </div>
</template>

