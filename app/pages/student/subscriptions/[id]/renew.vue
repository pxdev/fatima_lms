<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

const route = useRoute()
const subscriptionId = computed(() => route.params.id as string)

useSeoMeta({
  title: 'Renew Subscription',
  description: 'Renew your learning subscription'
})

const { profile, fetchProfile } = useProfile()
const { currentSubscription, fetchSubscription, createSubscription, isLoading, error } = useSubscriptions()
const { packages, fetchPackages, getPackageById, getTotalSessions } = usePackages()
const { courses, fetchCourses, getCourseById } = useCourses()

const isRenewing = ref(false)
const success = ref(false)
const newSubscription = ref<any>(null)

const oldCourse = computed(() => 
  currentSubscription.value ? getCourseById(currentSubscription.value.course) : null
)
const oldPackage = computed(() => 
  currentSubscription.value ? getPackageById(currentSubscription.value.package) : null
)

onMounted(async () => {
  await Promise.all([
    fetchProfile(),
    fetchSubscription(subscriptionId.value),
    fetchCourses(),
    fetchPackages()
  ])
})

async function handleRenew() {
  if (!profile.value?.id || !currentSubscription.value || !oldPackage.value) return

  isRenewing.value = true

  try {
    const pkg = oldPackage.value
    const totalSessions = getTotalSessions(pkg)

    // Create new subscription with same course, package, and teacher
    const subscription = await createSubscription({
      student: profile.value.id,
      course: currentSubscription.value.course,
      package: currentSubscription.value.package,
      weeks_total: pkg.weeks_per_cycle,
      sessions_total: totalSessions,
      sessions_remaining: totalSessions,
      postpone_total: 2,
      postpone_remaining: 2
    })

    if (subscription) {
      newSubscription.value = subscription
      success.value = true
    }
  } finally {
    isRenewing.value = false
  }
}

function goToNewSubscription() {
  if (newSubscription.value) {
    navigateTo(`/student/subscriptions/${newSubscription.value.id}`)
  }
}
</script>

<template>
  <div class="min-h-screen py-12">
    <div class="mx-auto max-w-2xl px-4">
      <!-- Breadcrumbs -->
      <UBreadcrumb 
        :items="[
          { label: 'Home', icon: 'i-heroicons-home', to: '/student/dashboard' },
          { label: 'My Subscriptions', to: '/student/subscriptions' },
          { label: 'Subscription', to: `/student/subscriptions/${subscriptionId}` },
          { label: 'Renew Subscription' }
        ]" 
        class="mb-6"
      />

      <!-- Loading -->
      <UCard v-if="isLoading" class="space-y-4">
        <USkeleton class="h-8 w-1/2" />
        <USkeleton class="h-32 w-full" />
      </UCard>

      <!-- Success -->
      <UCard v-else-if="success" class="py-12 text-center">
        <UIcon name="i-heroicons-check-circle" class="mx-auto h-16 w-16 text-primary-500" />
        <h3 class="mt-4 text-xl font-bold text-slate-900">Subscription Renewed!</h3>
        <p class="mt-2 text-slate-600">Your new subscription has been created.</p>
        <UButton
          color="primary"
          class="mt-6"
          @click="goToNewSubscription"
        >
          View New Subscription
        </UButton>
      </UCard>

      <!-- Renewal Form -->
      <UCard v-else>
        <template #header>
          <h1 class="text-2xl font-bold text-slate-900">Renew Your Subscription</h1>
          <p class="mt-1 text-slate-600">Continue learning with the same settings</p>
        </template>

        <!-- Error -->
        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          icon="i-heroicons-exclamation-triangle"
          :title="error"
          class="mb-6"
        />

        <div class="space-y-6">
          <!-- Current Subscription Info -->
          <div class="rounded-lg bg-slate-50 p-4">
            <h3 class="text-sm font-medium text-slate-500 mb-3">Current Subscription</h3>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-slate-600">Course</span>
                <span class="font-medium">{{ oldCourse?.label || '-' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-600">Package</span>
                <span class="font-medium">{{ oldPackage?.label || '-' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-600">Sessions/Week</span>
                <span class="font-medium">{{ oldPackage?.sessions_per_week || '-' }}</span>
              </div>
            </div>
          </div>

          <!-- New Subscription Preview -->
          <div class="rounded-lg border-2 border-primary-200 bg-primary-50 p-4">
            <h3 class="text-sm font-medium text-primary-700 mb-3">New Subscription Will Include</h3>
            <div class="space-y-2 text-primary-800">
              <div class="flex justify-between">
                <span>Total Sessions</span>
                <span class="font-bold">{{ oldPackage ? getTotalSessions(oldPackage) : '-' }}</span>
              </div>
              <div class="flex justify-between">
                <span>Weeks</span>
                <span class="font-bold">{{ oldPackage?.weeks_per_cycle || '-' }}</span>
              </div>
              <div class="flex justify-between">
                <span>Postpone Credits</span>
                <span class="font-bold">2</span>
              </div>
            </div>
          </div>

          <!-- Teacher Info -->
          <div v-if="currentSubscription?.teacher" class="flex items-center gap-3 rounded-lg bg-blue-50 p-4">
            <UIcon name="i-heroicons-user-circle" class="h-6 w-6 text-blue-600" />
            <div>
              <p class="text-sm font-medium text-blue-800">Same Teacher</p>
              <p class="text-xs text-blue-600">You'll continue with your current teacher</p>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              color="neutral"
              variant="outline"
              :to="`/student/subscriptions/${subscriptionId}`"
              :disabled="isRenewing"
            >
              Cancel
            </UButton>
            <UButton
              color="primary"
              :loading="isRenewing"
              @click="handleRenew"
            >
              <UIcon name="i-heroicons-arrow-path" class="mr-2 h-4 w-4" />
              Renew Subscription
            </UButton>
          </div>
        </template>
      </UCard>
    </div>
  </div>
</template>

