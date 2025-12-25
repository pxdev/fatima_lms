<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

useSeoMeta({
  title: 'Select Course',
  description: 'Choose your learning path'
})

const { courses, isLoading, error, fetchCourses } = useCourses()
const selectedCourse = ref<string | null>(null)

onMounted(() => {
  fetchCourses()
})

function selectCourse(courseId: string) {
  selectedCourse.value = courseId
}

function continueToPackage() {
  if (selectedCourse.value) {
    navigateTo(`/student/onboarding/package?course=${selectedCourse.value}`)
  }
}
</script>

<template>
  <div class="min-h-screen py-12">
    <div class="mx-auto max-w-4xl px-4">
      <!-- Breadcrumbs -->
      <UBreadcrumb 
        :items="[
          { label: 'Home', icon: 'i-heroicons-home', to: '/student/dashboard' },
          { label: 'Subscriptions', to: '/student/subscriptions' },
          { label: 'New Subscription', to: '/student/subscribe' },
          { label: 'Select Course' }
        ]" 
        class="mb-6"
      />

      <!-- Header -->
      <div class="mb-10 text-center">
        <div class="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-sm font-medium text-primary-700">
          <span>Step 1 of 3</span>
        </div>
        <h1 class="text-3xl font-bold text-slate-900">Choose Your Course</h1>
        <p class="mt-2 text-slate-600">Select the course you want to learn</p>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="grid gap-4 sm:grid-cols-2">
        <USkeleton v-for="i in 4" :key="i" class="h-48 rounded-xl" />
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
        v-else-if="courses.length === 0"
        color="info"
        variant="soft"
        icon="i-heroicons-information-circle"
        title="No courses available"
        description="Please check back later for available courses."
      />

      <!-- Courses Grid -->
      <div v-else class="grid gap-4 sm:grid-cols-2">
        <UCard
          v-for="course in courses"
          :key="course.id"
          :class="[
            'cursor-pointer transition-all duration-200 hover:shadow-lg',
            selectedCourse === course.id 
              ? 'ring-2 ring-primary-500 shadow-lg' 
              : 'hover:ring-1 hover:ring-slate-200'
          ]"
          @click="selectCourse(course.id)"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-slate-900">{{ course.label }}</h3>
              <p v-if="course.description" class="mt-2 text-sm text-slate-600">
                {{ course.description }}
              </p>
              <div v-if="course.level" class="mt-3">
                <UBadge color="neutral" variant="soft" size="sm">
                  {{ course.level }}
                </UBadge>
              </div>
            </div>
            <div
              :class="[
                'flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors',
                selectedCourse === course.id
                  ? 'border-primary-500 bg-primary-500'
                  : 'border-slate-300'
              ]"
            >
              <UIcon
                v-if="selectedCourse === course.id"
                name="i-heroicons-check"
                class="h-4 w-4 text-white"
              />
            </div>
          </div>
        </UCard>
      </div>

      <!-- Continue Button -->
      <div class="mt-10 flex justify-center">
        <UButton
          size="xl"
          color="primary"
          :disabled="!selectedCourse"
          class="min-w-[200px]"
          @click="continueToPackage"
        >
          Continue
          <UIcon name="i-heroicons-arrow-right" class="ml-2 h-5 w-5" />
        </UButton>
      </div>
    </div>
  </div>
</template>

