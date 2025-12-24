<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

useSeoMeta({
  title: 'Select Package',
  description: 'Choose your learning package'
})

const route = useRoute()
const courseId = computed(() => route.query.course as string)

const { packages, isLoading, error, fetchPackages, getTotalSessions } = usePackages()
const { courses, fetchCourses, getCourseById } = useCourses()

const selectedPackage = ref<string | null>(null)
const selectedCourse = computed(() => getCourseById(courseId.value))

onMounted(async () => {
  if (!courseId.value) {
    navigateTo('/student/onboarding/course')
    return
  }
  
  await Promise.all([fetchPackages(), fetchCourses()])
})

function selectPackage(packageId: string) {
  selectedPackage.value = packageId
}

function goBack() {
  navigateTo('/student/onboarding/course')
}

function continueToConfirm() {
  if (selectedPackage.value && courseId.value) {
    navigateTo(`/student/onboarding/confirm?course=${courseId.value}&package=${selectedPackage.value}`)
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-primary-50/30 py-12">
    <div class="mx-auto max-w-4xl px-4">
      <!-- Breadcrumbs -->
      <UBreadcrumb 
        :items="[
          { label: 'Home', icon: 'i-heroicons-home', to: '/student/dashboard' },
          { label: 'Subscriptions', to: '/student/subscriptions' },
          { label: 'New Subscription', to: '/student/subscribe' },
          { label: 'Select Course', to: `/student/onboarding/course` },
          { label: 'Select Package' }
        ]" 
        class="mb-6"
      />

      <!-- Header -->
      <div class="mb-10 text-center">
        <div class="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-sm font-medium text-primary-700">
          <span>Step 2 of 3</span>
        </div>
        <h1 class="text-3xl font-bold text-slate-900">Choose Your Package</h1>
        <p class="mt-2 text-slate-600">
          Select how many sessions per week for 
          <span v-if="selectedCourse" class="font-semibold text-primary-600">{{ selectedCourse.label }}</span>
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <USkeleton v-for="i in 3" :key="i" class="h-64 rounded-xl" />
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

      <!-- Empty State -->
      <UAlert
        v-else-if="packages.length === 0"
        color="info"
        variant="soft"
        icon="i-heroicons-information-circle"
        title="No packages available"
        description="Please check back later for available packages."
      />

      <!-- Packages Grid -->
      <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <UCard
          v-for="pkg in packages"
          :key="pkg.id"
          :class="[
            'cursor-pointer transition-all duration-200 hover:shadow-lg',
            selectedPackage === pkg.id 
              ? 'ring-2 ring-primary-500 shadow-lg' 
              : 'hover:ring-1 hover:ring-slate-200'
          ]"
          @click="selectPackage(pkg.id)"
        >
          <div class="text-center">
            <!-- Selection indicator -->
            <div class="mb-4 flex justify-end">
              <div
                :class="[
                  'flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors',
                  selectedPackage === pkg.id
                    ? 'border-primary-500 bg-primary-500'
                    : 'border-slate-300'
                ]"
              >
                <UIcon
                  v-if="selectedPackage === pkg.id"
                  name="i-heroicons-check"
                  class="h-4 w-4 text-white"
                />
              </div>
            </div>

            <h3 class="text-xl font-bold text-slate-900">{{ pkg.label }}</h3>
            
            <div class="mt-4 space-y-3">
              <div class="flex items-center justify-center gap-2 text-slate-600">
                <UIcon name="i-heroicons-calendar" class="h-5 w-5" />
                <span>{{ pkg.sessions_per_week }} sessions/week</span>
              </div>
              
              <div class="flex items-center justify-center gap-2 text-slate-600">
                <UIcon name="i-heroicons-clock" class="h-5 w-5" />
                <span>{{ pkg.session_duration_min }} min each</span>
              </div>
              
              <div class="flex items-center justify-center gap-2 text-slate-600">
                <UIcon name="i-heroicons-arrow-path" class="h-5 w-5" />
                <span>{{ pkg.weeks_per_cycle }} weeks cycle</span>
              </div>
            </div>

            <div class="mt-4 rounded-lg bg-primary-50 p-3">
              <span class="text-sm font-medium text-primary-700">
                {{ getTotalSessions(pkg) }} total sessions
              </span>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Navigation Buttons -->
      <div class="mt-10 flex justify-center gap-4">
        <UButton
          size="xl"
          color="neutral"
          variant="outline"
          @click="goBack"
        >
          <UIcon name="i-heroicons-arrow-left" class="mr-2 h-5 w-5" />
          Back
        </UButton>
        <UButton
          size="xl"
          color="primary"
          :disabled="!selectedPackage"
          class="min-w-[200px]"
          @click="continueToConfirm"
        >
          Continue
          <UIcon name="i-heroicons-arrow-right" class="ml-2 h-5 w-5" />
        </UButton>
      </div>
    </div>
  </div>
</template>

