<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

useSeoMeta({
  title: 'Confirm Subscription',
  description: 'Review and confirm your subscription'
})

const route = useRoute()
const courseId = computed(() => route.query.course as string)
const packageId = computed(() => route.query.package as string)

const { profile, fetchProfile } = useProfile()
const { courses, fetchCourses, getCourseById } = useCourses()
const { packages, fetchPackages, getPackageById, getTotalSessions } = usePackages()
const { createSubscription, updateSubscriptionStatus, isLoading, error } = useSubscriptions()

const selectedCourse = computed(() => getCourseById(courseId.value))
const selectedPackage = computed(() => getPackageById(packageId.value))

const isCreating = ref(false)
const createdSubscription = ref<any>(null)

onMounted(async () => {
  if (!courseId.value || !packageId.value) {
    navigateTo('/student/onboarding/course')
    return
  }
  
  await Promise.all([
    fetchProfile(),
    fetchCourses(),
    fetchPackages()
  ])
})

function goBack() {
  navigateTo(`/student/onboarding/package?course=${courseId.value}`)
}

async function confirmSubscription() {
  if (!profile.value?.id || !selectedPackage.value || !courseId.value) {
    return
  }

  isCreating.value = true

  try {
    const pkg = selectedPackage.value
    const totalSessions = getTotalSessions(pkg)

    // Create subscription with all required fields
    const subscription = await createSubscription({
      student: profile.value.id,
      course: courseId.value,
      package: packageId.value,
      weeks_total: pkg.weeks_per_cycle,
      sessions_total: totalSessions,
      sessions_remaining: totalSessions,
      postpone_total: 2,
      postpone_remaining: 2
    })

    if (subscription) {
      createdSubscription.value = subscription
      
      // Redirect to payment or dashboard
      // For now, redirect to subscriptions list
      navigateTo(`/student/subscriptions/${subscription.id}`)
    }
  } catch (err) {
    console.error('Failed to create subscription:', err)
  } finally {
    isCreating.value = false
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
          { label: 'Subscriptions', to: '/student/subscriptions' },
          { label: 'New Subscription', to: '/student/subscribe' },
          { label: 'Select Course', to: '/student/onboarding/course' },
          { label: 'Select Package', to: `/student/onboarding/package?course=${courseId}` },
          { label: 'Confirm' }
        ]" 
        class="mb-6"
      />

      <!-- Header -->
      <div class="mb-10 text-center">
        <div class="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-sm font-medium text-primary-700">
          <span>Step 3 of 3</span>
        </div>
        <h1 class="text-3xl font-bold text-slate-900">Confirm Your Subscription</h1>
        <p class="mt-2 text-slate-600">Review your selection before proceeding</p>
      </div>

      <!-- Loading State -->
      <UCard v-if="!selectedCourse || !selectedPackage" class="space-y-4">
        <USkeleton class="h-6 w-1/2" />
        <USkeleton class="h-20 w-full" />
        <USkeleton class="h-20 w-full" />
      </UCard>

      <!-- Error State -->
      <UAlert
        v-else-if="error"
        color="error"
        variant="soft"
        icon="i-heroicons-exclamation-triangle"
        :title="error"
        class="mb-6"
      />

      <!-- Confirmation Card -->
      <UCard v-else>
        <div class="space-y-6">
          <!-- Course Summary -->
          <div class="rounded-lg bg-slate-50 p-4">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                <UIcon name="i-heroicons-academic-cap" class="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p class="text-sm text-slate-500">Course</p>
                <p class="font-semibold text-slate-900">{{ selectedCourse.label }}</p>
              </div>
            </div>
          </div>

          <!-- Package Summary -->
          <div class="rounded-lg bg-slate-50 p-4">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                <UIcon name="i-heroicons-cube" class="h-5 w-5 text-primary-600" />
              </div>
              <div class="flex-1">
                <p class="text-sm text-slate-500">Package</p>
                <p class="font-semibold text-slate-900">{{ selectedPackage.label }}</p>
              </div>
            </div>

            <div class="mt-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <p class="text-2xl font-bold text-primary-600">{{ selectedPackage.sessions_per_week }}</p>
                <p class="text-xs text-slate-500">Sessions/Week</p>
              </div>
              <div>
                <p class="text-2xl font-bold text-primary-600">{{ selectedPackage.session_duration_min }}</p>
                <p class="text-xs text-slate-500">Minutes Each</p>
              </div>
              <div>
                <p class="text-2xl font-bold text-primary-600">{{ selectedPackage.weeks_per_cycle }}</p>
                <p class="text-xs text-slate-500">Weeks Cycle</p>
              </div>
            </div>
          </div>

          <!-- Total Sessions -->
          <div class="rounded-lg bg-primary-50 p-4 text-center">
            <p class="text-sm text-primary-700">Total Sessions in This Cycle</p>
            <p class="text-3xl font-bold text-primary-600">
              {{ getTotalSessions(selectedPackage) }}
            </p>
          </div>

          <!-- Postpone Info -->
          <div class="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <UIcon name="i-heroicons-information-circle" class="h-5 w-5 text-amber-600" />
            <p class="text-sm text-amber-800">
              You will have <strong>2 postpone credits</strong> to reschedule sessions if needed.
            </p>
          </div>
        </div>

        <!-- Actions -->
        <template #footer>
          <div class="flex justify-between">
            <UButton
              color="neutral"
              variant="outline"
              :disabled="isCreating"
              @click="goBack"
            >
              <UIcon name="i-heroicons-arrow-left" class="mr-2 h-4 w-4" />
              Back
            </UButton>
            <UButton
              color="primary"
              :loading="isCreating"
              :disabled="isCreating"
              @click="confirmSubscription"
            >
              Confirm & Continue
              <UIcon name="i-heroicons-check" class="ml-2 h-4 w-4" />
            </UButton>
          </div>
        </template>
      </UCard>
    </div>
  </div>
</template>

