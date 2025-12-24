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
  isLoading, 
  error 
} = useSubscriptions()
const { packages, fetchPackages } = usePackages()
const { courses, fetchCourses } = useCourses()

const isPolling = ref(false)
const pollingInterval = ref<ReturnType<typeof setInterval> | null>(null)

const { getSubscriptionCourse, getSubscriptionPackage, getStatusConfig } = useSubscriptionCard()

const selectedCourse = computed(() => 
  currentSubscription.value ? getSubscriptionCourse(currentSubscription.value) : null
)
const selectedPackage = computed(() => 
  currentSubscription.value ? getSubscriptionPackage(currentSubscription.value) : null
)

useSeoMeta({
  title: computed(() => `Subscription - ${selectedCourse.value?.label || 'Loading...'}`),
  description: 'View and manage your subscription'
})

const statusConfig = computed(() => {
  if (!currentSubscription.value) {
    const config = getStatusConfig('draft')
    return {
      ...config,
      title: config.label
    }
  }
  const config = getStatusConfig(currentSubscription.value.status)
  return {
    ...config,
    title: config.label
  }
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
  <div class="min-h-screen bg-slate-50 py-8">
    <div class="mx-auto max-w-6xl px-4">
      <!-- Breadcrumbs -->
      <UBreadcrumb 
        :items="[
          { label: 'Home', icon: 'i-heroicons-home', to: '/student/dashboard' },
          { label: 'My Subscriptions', to: '/student/subscriptions' },
          { label: 'Subscription Details' }
        ]" 
        class="mb-6"
      />
      <!-- Loading State -->
      <div v-if="isLoading && !currentSubscription" class="space-y-6">
        <USkeleton class="h-64 w-full rounded-2xl" />
        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <USkeleton v-for="i in 4" :key="i" class="h-32 rounded-xl" />
        </div>
      </div>

      <!-- Error State -->
      <UAlert
        v-else-if="error"
        color="error"
        variant="soft"
        icon="i-heroicons-exclamation-triangle"
        :title="error"
        class="mb-6"
      />

      <!-- Subscription Details -->
      <template v-else-if="currentSubscription">
        <SubscriptionCard
          :subscription="currentSubscription"
          variant="hero"
          :show-actions="false"
        />

        <!-- Status Action Card -->
        <UCard class="mb-6">
          <div 
            class="p-6 border-l-4"
            :class="{
              'bg-amber-50 border-amber-500': currentSubscription.status === 'draft',
              'bg-blue-50 border-blue-500': currentSubscription.status === 'pending_payment',
              'bg-green-50 border-green-500': currentSubscription.status === 'payment_received',
              'bg-primary-50 border-primary-500': ['teacher_assigned', 'active'].includes(currentSubscription.status),
              'bg-slate-50 border-slate-500': currentSubscription.status === 'completed'
            }"
          >
            <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div class="flex items-start gap-4">
                <div 
                  class="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl"
                  :class="{
                    'bg-amber-100': currentSubscription.status === 'draft',
                    'bg-blue-100': currentSubscription.status === 'pending_payment',
                    'bg-green-100': currentSubscription.status === 'payment_received',
                    'bg-primary-100': ['teacher_assigned', 'active'].includes(currentSubscription.status),
                    'bg-slate-100': currentSubscription.status === 'completed'
                  }"
                >
                  <UIcon 
                    :name="statusConfig.icon" 
                    class="h-8 w-8"
                    :class="{
                      'text-amber-600': currentSubscription.status === 'draft',
                      'text-blue-600': currentSubscription.status === 'pending_payment',
                      'text-green-600': currentSubscription.status === 'payment_received',
                      'text-primary-600': ['teacher_assigned', 'active'].includes(currentSubscription.status),
                      'text-slate-600': currentSubscription.status === 'completed',
                      'animate-spin': currentSubscription.status === 'pending_payment' && isPolling
                    }"
                  />
                </div>
                <div class="flex-1">
                  <h3 
                    class="mb-1 text-xl font-bold"
                    :class="{
                      'text-amber-900': currentSubscription.status === 'draft',
                      'text-blue-900': currentSubscription.status === 'pending_payment',
                      'text-green-900': currentSubscription.status === 'payment_received',
                      'text-primary-900': ['teacher_assigned', 'active'].includes(currentSubscription.status),
                      'text-slate-900': currentSubscription.status === 'completed'
                    }"
                  >
                    {{ statusConfig.title }}
                  </h3>
                  <p 
                    class="text-sm"
                    :class="{
                      'text-amber-700': currentSubscription.status === 'draft',
                      'text-blue-700': currentSubscription.status === 'pending_payment',
                      'text-green-700': currentSubscription.status === 'payment_received',
                      'text-primary-700': ['teacher_assigned', 'active'].includes(currentSubscription.status),
                      'text-slate-700': currentSubscription.status === 'completed'
                    }"
                  >
                    {{ statusConfig.description }}
                  </p>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex flex-col gap-2 sm:flex-row">
                <!-- Draft: Pay Now -->
                <UButton
                  v-if="currentSubscription.status === 'draft'"
                  color="primary"
                  size="xl"
                  @click="proceedToPayment"
                >
                  <UIcon name="i-heroicons-banknotes" class="mr-2 h-5 w-5" />
                  Pay Now
                </UButton>

                <!-- Teacher Assigned: Schedule -->
                <UButton
                  v-else-if="currentSubscription.status === 'teacher_assigned'"
                  color="primary"
                  size="xl"
                  @click="goToSchedule"
                >
                  <UIcon name="i-heroicons-calendar-plus" class="mr-2 h-5 w-5" />
                  Schedule Sessions
                </UButton>

                <!-- Active: Actions -->
                <template v-else-if="currentSubscription.status === 'active'">
                  <UButton
                    color="neutral"
                    variant="outline"
                    size="xl"
                    @click="goToSchedule"
                  >
                    <UIcon name="i-heroicons-calendar-plus" class="mr-2 h-5 w-5" />
                    Schedule More
                  </UButton>
                  <UButton
                    color="primary"
                    size="xl"
                    @click="goToSessions"
                  >
                    <UIcon name="i-heroicons-video-camera" class="mr-2 h-5 w-5" />
                    View Sessions
                  </UButton>
                </template>

                <!-- Completed: Renew -->
                <UButton
                  v-else-if="currentSubscription.status === 'completed'"
                  color="primary"
                  size="xl"
                  :to="`/student/subscriptions/${subscriptionId}/renew`"
                >
                  <UIcon name="i-heroicons-arrow-path" class="mr-2 h-5 w-5" />
                  Renew Subscription
                </UButton>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Quick Actions Grid -->
        <div v-if="['teacher_assigned', 'active'].includes(currentSubscription.status)" class="grid gap-4 md:grid-cols-2">
          <UCard 
            class="group cursor-pointer transition-all duration-300"
            @click="goToSchedule"
          >
            <div class="flex items-center gap-4">
              <div class="flex h-16 w-16 items-center justify-center rounded-xl bg-primary-100 group-hover:bg-primary-200 transition-colors">
                <UIcon name="i-heroicons-calendar-days" class="h-8 w-8 text-primary-600" />
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-slate-900">Schedule Sessions</h3>
                <p class="text-sm text-slate-600">Book your weekly learning sessions</p>
              </div>
              <UIcon name="i-heroicons-chevron-right" class="h-5 w-5 text-slate-400 group-hover:text-primary-600 transition-colors" />
            </div>
          </UCard>

          <UCard 
            class="group cursor-pointer transition-all duration-300"
            @click="goToSessions"
          >
            <div class="flex items-center gap-4">
              <div class="flex h-16 w-16 items-center justify-center rounded-xl bg-green-100 group-hover:bg-green-200 transition-colors">
                <UIcon name="i-heroicons-video-camera" class="h-8 w-8 text-green-600" />
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-slate-900">My Sessions</h3>
                <p class="text-sm text-slate-600">View and manage your sessions</p>
              </div>
              <UIcon name="i-heroicons-chevron-right" class="h-5 w-5 text-slate-400 group-hover:text-green-600 transition-colors" />
            </div>
          </UCard>
        </div>
      </template>

      <!-- Not Found -->
      <UAlert
        v-else
        color="warning"
        variant="soft"
        icon="i-heroicons-question-mark-circle"
        title="Subscription not found"
        description="The subscription you're looking for doesn't exist or you don't have access to it."
        class="mt-6"
      />
    </div>
  </div>
</template>

<style scoped>
/* Smooth transitions for interactive elements */
.group {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>

