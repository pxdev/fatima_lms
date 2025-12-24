<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

useSeoMeta({
  title: 'Subscribe',
  description: 'Start your learning journey'
})

const { profile, fetchProfile } = useProfile()
const { courses, isLoading: coursesLoading, fetchCourses, getCourseById } = useCourses()
const { packages, isLoading: packagesLoading, fetchPackages, getPackageById, getTotalSessions, formatPrice, getPricePerSession } = usePackages()
const { createSubscription } = useSubscriptions()

// Wizard state
const currentStep = ref(1)
const selectedCourseId = ref<string | null>(null)
const selectedPackageId = ref<string | null>(null)
const isCreating = ref(false)
const error = ref<string | null>(null)

// Computed selections
const selectedCourse = computed(() => selectedCourseId.value ? getCourseById(selectedCourseId.value) : null)
const selectedPackage = computed(() => selectedPackageId.value ? getPackageById(selectedPackageId.value) : null)

// Loading state
const isLoading = computed(() => coursesLoading.value || packagesLoading.value)

// Steps configuration
const steps = [
  { number: 1, label: 'Course', icon: 'i-heroicons-academic-cap' },
  { number: 2, label: 'Package', icon: 'i-heroicons-cube' },
  { number: 3, label: 'Confirm', icon: 'i-heroicons-check-circle' }
]

// Can proceed to next step
const canProceed = computed(() => {
  if (currentStep.value === 1) return !!selectedCourseId.value
  if (currentStep.value === 2) return !!selectedPackageId.value
  return true
})

onMounted(async () => {
  await Promise.all([
    fetchProfile(),
    fetchCourses(),
    fetchPackages()
  ])
})

function selectCourse(courseId: string) {
  selectedCourseId.value = courseId
}

function selectPackage(packageId: string) {
  selectedPackageId.value = packageId
}

function nextStep() {
  if (canProceed.value && currentStep.value < 3) {
    currentStep.value++
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

function goToStep(step: number) {
  // Can only go back or to completed steps
  if (step < currentStep.value) {
    currentStep.value = step
  } else if (step === 2 && selectedCourseId.value) {
    currentStep.value = step
  } else if (step === 3 && selectedCourseId.value && selectedPackageId.value) {
    currentStep.value = step
  }
}

// Throttled confirm action
const { execute: throttledConfirm, isLoading: isConfirming } = useThrottledAction(
  async () => {
    await doConfirm()
  },
  { throttleMs: 2000 }
)

async function doConfirm() {
  if (!profile.value?.id || !selectedPackage.value || !selectedCourseId.value) {
    return
  }

  error.value = null

  try {
    const pkg = selectedPackage.value
    const totalSessions = getTotalSessions(pkg)

    const subscription = await createSubscription({
      student: profile.value.id,
      course: selectedCourseId.value,
      package: selectedPackageId.value!,
      weeks_total: pkg.weeks_per_cycle,
      sessions_total: totalSessions,
      sessions_remaining: totalSessions,
      postpone_total: 2,
      postpone_remaining: 2
    })

    if (subscription) {
      navigateTo(`/student/subscriptions/${subscription.id}`)
    }
  } catch (err: any) {
    error.value = err?.message || 'Failed to create subscription'
  }
}

function handleConfirm() {
  throttledConfirm()
}

// Get course icon with fallback
function getCourseIcon(course: any): string {
  return course.icon || 'i-heroicons-book-open'
}

// Get course color classes
function getCourseColorClasses(course: any, isSelected: boolean): string {
  const color = course.color || 'primary'
  if (isSelected) {
    return `ring-2 ring-${color}-500 bg-${color}-50/50`
  }
  return 'hover:bg-slate-50'
}
</script>

<template>
  <div class="min-h-screen">
    <div class="mx-auto max-w-6xl px-4 py-8">
      <!-- Breadcrumbs -->
      <UBreadcrumb 
        :items="[
          { label: 'Home', icon: 'i-heroicons-home', to: '/student/dashboard' },
          { label: 'Subscriptions', to: '/student/subscriptions' },
          { label: 'New Subscription' }
        ]" 
        class="mb-6"
      />

      <!-- Header -->
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold text-slate-900">Start Your Learning Journey</h1>
        <p class="mt-2 text-slate-600">Choose your course and package to get started</p>
      </div>

      <!-- Progress Steps -->
      <div class="mb-10">
        <div class="flex items-center justify-center">
          <template v-for="(step, index) in steps" :key="step.number">
            <!-- Step -->
            <button
              class="flex items-center gap-2 transition-all"
              :class="[
                currentStep >= step.number ? 'text-primary-600' : 'text-slate-400',
                step.number < currentStep ? 'cursor-pointer hover:text-primary-700' : ''
              ]"
              @click="goToStep(step.number)"
            >
              <div
                class="flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all"
                :class="[
                  currentStep > step.number ? 'border-primary-500 bg-primary-500 text-white' :
                  currentStep === step.number ? 'border-primary-500 bg-primary-50 text-primary-600' :
                  'border-slate-300 bg-white text-slate-400'
                ]"
              >
                <UIcon v-if="currentStep > step.number" name="i-heroicons-check" class="h-5 w-5" />
                <UIcon v-else :name="step.icon" class="h-5 w-5" />
              </div>
              <span class="hidden font-medium sm:block">{{ step.label }}</span>
            </button>
            
            <!-- Connector -->
            <div
              v-if="index < steps.length - 1"
              class="mx-4 h-0.5 w-16 transition-all sm:w-24"
              :class="currentStep > step.number ? 'bg-primary-500' : 'bg-slate-200'"
            />
          </template>
        </div>
      </div>

      <!-- Main Content -->
      <div class="grid gap-8 lg:grid-cols-3">
        <!-- Steps Content (2 columns) -->
        <div class="lg:col-span-2">
          <!-- Loading State -->
          <div v-if="isLoading" class="space-y-4">
            <USkeleton v-for="i in 3" :key="i" class="h-32 w-full rounded-xl" />
          </div>

          <!-- Step 1: Course Selection -->
          <div v-else-if="currentStep === 1" class="space-y-4">
            <h2 class="text-xl font-semibold text-slate-900">Select Your Course</h2>
            <p class="text-slate-600">Choose the subject you want to learn</p>

            <div class="mt-6 space-y-3">
              <div
                v-for="course in courses"
                :key="course.id"
                class="relative flex cursor-pointer items-start gap-4 rounded-xl border-2 bg-white p-4 transition-all hover:bg-slate-50"
                :class="[
                  selectedCourseId === course.id
                    ? 'border-primary-500 bg-primary-50/50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                ]"
                @click="selectCourse(course.id)"
              >
                <!-- Selection Indicator -->
                <div
                  class="mt-1 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all"
                  :class="[
                    selectedCourseId === course.id
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-slate-300'
                  ]"
                >
                  <UIcon
                    v-if="selectedCourseId === course.id"
                    name="i-heroicons-check"
                    class="h-4 w-4 text-white"
                  />
                </div>

                <!-- Course Icon -->
                <div
                  class="flex h-12 w-12 items-center justify-center rounded-xl"
                  :class="selectedCourseId === course.id ? 'bg-primary-100' : 'bg-slate-100'"
                >
                  <UIcon
                    :name="getCourseIcon(course)"
                    class="h-6 w-6"
                    :class="selectedCourseId === course.id ? 'text-primary-600' : 'text-slate-500'"
                  />
                </div>

                <!-- Course Info -->
                <div class="flex-1 space-y-2">
                  <div class="flex flex-wrap items-center gap-2">
                    <h3 class="text-lg font-semibold text-slate-900">{{ course.label }}</h3>
                    <UBadge v-if="course.level" color="neutral" variant="soft" size="xs">
                      {{ course.level }}
                    </UBadge>
                    <UBadge v-if="course.is_popular" color="amber" variant="solid" size="xs">
                      Popular
                    </UBadge>
                  </div>

                  <p v-if="course.description" class="text-sm text-slate-600 line-clamp-2">
                    {{ course.description }}
                  </p>

                  <div v-if="course.features?.length" class="flex flex-wrap gap-3 text-sm text-slate-600">
                    <span
                      v-for="feature in course.features.slice(0, 3)"
                      :key="feature"
                      class="inline-flex items-center gap-1"
                    >
                      <UIcon name="i-heroicons-check" class="h-4 w-4 text-green-500" />
                      {{ feature }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 2: Package Selection -->
          <div v-else-if="currentStep === 2" class="space-y-4">
            <h2 class="text-xl font-semibold text-slate-900">Choose Your Package</h2>
            <p class="text-slate-600">Select how often you want to learn</p>

            <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div
                v-for="pkg in packages"
                :key="pkg.id"
                class="relative cursor-pointer rounded-xl border-2 p-6 transition-all hover:shadow-md"
                :class="[
                  selectedPackageId === pkg.id 
                    ? 'border-primary-500 bg-primary-50/50 shadow-md' 
                    : 'border-slate-200 hover:border-slate-300',
                  pkg.is_recommended ? 'ring-2 ring-primary-200' : ''
                ]"
                @click="selectPackage(pkg.id)"
              >
                <!-- Badges -->
                <div class="absolute -top-3 left-4 flex gap-2">
                  <span v-if="pkg.is_recommended" class="rounded-full bg-primary-500 px-3 py-1 text-xs font-semibold text-white">
                    Recommended
                  </span>
                  <span v-else-if="pkg.is_popular" class="rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white">
                    Popular
                  </span>
                  <span v-if="pkg.discount_percent" class="rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white">
                    Save {{ pkg.discount_percent }}%
                  </span>
                </div>

                <!-- Selection Indicator -->
                <div class="absolute right-4 top-4">
                  <div
                    class="flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all"
                    :class="[
                      selectedPackageId === pkg.id
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-slate-300'
                    ]"
                  >
                    <UIcon
                      v-if="selectedPackageId === pkg.id"
                      name="i-heroicons-check"
                      class="h-4 w-4 text-white"
                    />
                  </div>
                </div>

                <!-- Package Name -->
                <h3 class="text-xl font-bold text-slate-900">{{ pkg.label }}</h3>
                <p v-if="pkg.description" class="mt-1 text-sm text-slate-500">{{ pkg.description }}</p>

                <!-- Price -->
                <div class="mt-4">
                  <span class="text-3xl font-bold text-slate-900">{{ formatPrice(pkg) }}</span>
                  <span class="text-slate-500">/cycle</span>
                </div>
                <p class="text-sm text-slate-500">{{ getPricePerSession(pkg) }} per session</p>

                <!-- Details -->
                <div class="mt-6 space-y-3">
                  <div class="flex items-center gap-3 text-slate-600">
                    <UIcon name="i-heroicons-calendar" class="h-5 w-5 text-primary-500" />
                    <span>{{ pkg.sessions_per_week }} sessions/week</span>
                  </div>
                  <div class="flex items-center gap-3 text-slate-600">
                    <UIcon name="i-heroicons-clock" class="h-5 w-5 text-primary-500" />
                    <span>{{ pkg.session_duration_min }} min each</span>
                  </div>
                  <div class="flex items-center gap-3 text-slate-600">
                    <UIcon name="i-heroicons-arrow-path" class="h-5 w-5 text-primary-500" />
                    <span>{{ pkg.weeks_per_cycle }} weeks</span>
                  </div>
                  <div class="flex items-center gap-3 font-medium text-primary-600">
                    <UIcon name="i-heroicons-sparkles" class="h-5 w-5" />
                    <span>{{ getTotalSessions(pkg) }} total sessions</span>
                  </div>
                </div>

                <!-- Features -->
                <ul v-if="pkg.features?.length" class="mt-4 space-y-2 border-t pt-4">
                  <li v-for="feature in pkg.features" :key="feature" class="flex items-center gap-2 text-sm text-slate-600">
                    <UIcon name="i-heroicons-check-circle" class="h-4 w-4 text-green-500" />
                    {{ feature }}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Step 3: Confirmation -->
          <div v-else-if="currentStep === 3" class="space-y-6">
            <h2 class="text-xl font-semibold text-slate-900">Confirm Your Subscription</h2>
            <p class="text-slate-600">Review your selection before proceeding</p>

            <!-- Error Alert -->
            <UAlert
              v-if="error"
              color="error"
              variant="soft"
              icon="i-heroicons-exclamation-triangle"
              :title="error"
              class="mb-4"
            />

            <UCard>
              <!-- Course Summary -->
              <div class="flex items-center gap-4 rounded-lg bg-slate-50 p-4">
                <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100">
                  <UIcon :name="getCourseIcon(selectedCourse)" class="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <p class="text-sm text-slate-500">Course</p>
                  <p class="font-semibold text-slate-900">{{ selectedCourse?.label }}</p>
                </div>
              </div>

              <!-- Package Summary -->
              <div class="mt-4 rounded-lg bg-slate-50 p-4">
                <div class="flex items-center gap-4">
                  <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100">
                    <UIcon name="i-heroicons-cube" class="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <p class="text-sm text-slate-500">Package</p>
                    <p class="font-semibold text-slate-900">{{ selectedPackage?.label }}</p>
                  </div>
                </div>

                <div class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div class="text-center">
                    <p class="text-2xl font-bold text-primary-600">{{ selectedPackage?.sessions_per_week }}</p>
                    <p class="text-xs text-slate-500">Sessions/Week</p>
                  </div>
                  <div class="text-center">
                    <p class="text-2xl font-bold text-primary-600">{{ selectedPackage?.session_duration_min }}</p>
                    <p class="text-xs text-slate-500">Minutes Each</p>
                  </div>
                  <div class="text-center">
                    <p class="text-2xl font-bold text-primary-600">{{ selectedPackage?.weeks_per_cycle }}</p>
                    <p class="text-xs text-slate-500">Weeks</p>
                  </div>
                  <div class="text-center">
                    <p class="text-2xl font-bold text-primary-600">{{ selectedPackage ? getTotalSessions(selectedPackage) : 0 }}</p>
                    <p class="text-xs text-slate-500">Total Sessions</p>
                  </div>
                </div>
              </div>

              <!-- Pricing -->
              <div class="mt-4 rounded-lg bg-primary-50 p-4">
                <div class="flex items-center justify-between">
                  <span class="font-medium text-slate-700">Total Price</span>
                  <span class="text-2xl font-bold text-primary-600">
                    {{ selectedPackage ? formatPrice(selectedPackage) : '-' }}
                  </span>
                </div>
              </div>

              <!-- Info -->
              <div class="mt-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <UIcon name="i-heroicons-information-circle" class="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                <div class="text-sm text-amber-800">
                  <p class="font-medium">What's included:</p>
                  <ul class="mt-1 list-inside list-disc space-y-1">
                    <li>2 postpone credits for rescheduling</li>
                    <li>Personal teacher assignment</li>
                    <li>Zoom video sessions</li>
                    <li>Progress tracking</li>
                  </ul>
                </div>
              </div>
            </UCard>
          </div>

          <!-- Navigation Buttons -->
          <div class="mt-8 flex items-center justify-between">
            <UButton
              v-if="currentStep > 1"
              color="neutral"
              variant="outline"
              size="xl"
              @click="prevStep"
            >
              <UIcon name="i-heroicons-arrow-left" class="mr-2 h-5 w-5" />
              Back
            </UButton>
            <div v-else />

            <UButton
              v-if="currentStep < 3"
              color="primary"
              variant="solid"
              size="xl"
              :disabled="!canProceed"
              @click="nextStep"
            >
              Continue
              <UIcon name="i-heroicons-arrow-right" class="ml-2 h-5 w-5" />
            </UButton>
            <UButton
              v-else
              color="success"
              variant="solid"
              size="xl"
              :loading="isConfirming"
              :disabled="isConfirming"
              @click="handleConfirm"
            >
              <UIcon name="i-heroicons-check" class="mr-2 h-5 w-5" />
              Confirm & Subscribe
            </UButton>
          </div>
        </div>

        <!-- Order Summary Sidebar -->
        <div class="lg:col-span-1">
          <div class="sticky top-8">
            <UCard>
              <template #header>
                <h3 class="font-semibold text-slate-900">Order Summary</h3>
              </template>

              <div class="space-y-4">
                <!-- Selected Course -->
                <div class="flex items-center justify-between">
                  <span class="text-slate-600">Course</span>
                  <span class="font-medium text-slate-900">
                    {{ selectedCourse?.label || 'Not selected' }}
                  </span>
                </div>

                <!-- Selected Package -->
                <div class="flex items-center justify-between">
                  <span class="text-slate-600">Package</span>
                  <span class="font-medium text-slate-900">
                    {{ selectedPackage?.label || 'Not selected' }}
                  </span>
                </div>

                <USeparator />

                <!-- Sessions Info -->
                <template v-if="selectedPackage">
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-slate-500">Sessions/week</span>
                    <span class="text-slate-700">{{ selectedPackage.sessions_per_week }}</span>
                  </div>
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-slate-500">Duration</span>
                    <span class="text-slate-700">{{ selectedPackage.session_duration_min }} min</span>
                  </div>
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-slate-500">Cycle length</span>
                    <span class="text-slate-700">{{ selectedPackage.weeks_per_cycle }} weeks</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="font-medium text-slate-700">Total sessions</span>
                    <span class="font-semibold text-primary-600">{{ getTotalSessions(selectedPackage) }}</span>
                  </div>

                  <USeparator />

                  <!-- Price -->
                  <div class="flex items-center justify-between">
                    <span class="text-lg font-semibold text-slate-900">Total</span>
                    <span class="text-2xl font-bold text-primary-600">{{ formatPrice(selectedPackage) }}</span>
                  </div>
                  <p class="text-right text-sm text-slate-500">
                    {{ getPricePerSession(selectedPackage) }} per session
                  </p>
                </template>

                <template v-else>
                  <div class="py-4 text-center text-slate-500">
                    <UIcon name="i-heroicons-shopping-cart" class="mx-auto h-8 w-8 text-slate-300" />
                    <p class="mt-2 text-sm">Select a package to see pricing</p>
                  </div>
                </template>
              </div>

              <!-- CTA Button -->
              <template #footer v-if="selectedCourse && selectedPackage && currentStep < 3">
                <UButton
                  block
                  color="success"
                  variant="solid"
                  size="xl"
                  @click="currentStep = 3"
                >
                  <UIcon name="i-heroicons-arrow-right" class="mr-2 h-5 w-5" />
                  Proceed to Checkout
                </UButton>
              </template>
            </UCard>

            <!-- Trust Badges -->
            <div class="mt-4 flex items-center justify-center gap-4 text-sm text-slate-500">
              <div class="flex items-center gap-1">
                <UIcon name="i-heroicons-shield-check" class="h-4 w-4 text-green-500" />
                <span>Secure</span>
              </div>
              <div class="flex items-center gap-1">
                <UIcon name="i-heroicons-arrow-path" class="h-4 w-4 text-blue-500" />
                <span>Flexible</span>
              </div>
              <div class="flex items-center gap-1">
                <UIcon name="i-heroicons-star" class="h-4 w-4 text-amber-500" />
                <span>Quality</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

