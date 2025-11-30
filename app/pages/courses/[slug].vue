<script setup>
const { getItems } = useDirectusItems()
const { getThumbnail } = useDirectusFiles()
const route = useRoute()
const slug = route.params.slug

const { data: course, error } = await useAsyncData(
  `course-${slug}`,
  async () => {
    const items = await getItems({
      collection: 'courses',
      params: {
        limit: 1,
        filter: { slug: { _eq: slug } },
        fields: ['*']
      }
    })
    return items?.[0] ?? null
  }
)

// Handle course not found
if (!course.value && !error.value) {
  throw createError({
    statusCode: 404,
    message: 'Course not found'
  })
}

const crumbs = computed(() => [
  { label: 'Home', to: '/' },
  { label: 'Courses', to: '/courses' },
  { label: course.value?.label ?? 'Course' }
])

const cleanHtml = (html) => {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '')
}

const formattedDate = computed(() => {
  if (!course.value?.date_created) return ''
  return new Date(course.value.date_created).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})
</script>

<template>
  <div v-if="course" class="">
    <pages-header :title="course.label" :crumbs="crumbs" />

    <u-container class="py-12">
      <div class="grid lg:grid-cols-3 gap-8">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Course Image -->
          <u-card class="overflow-hidden">
            <div class="relative aspect-video rounded-lg overflow-hidden -mx-4 -mt-4 mb-6">
              <div class="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 opacity-90" />
              
              <img
                v-if="course.image"
                :src="getThumbnail(course.image, { width: 1200, height: 675, fit: 'cover' })"
                :alt="course.label"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <u-icon name="i-heroicons-academic-cap" class="w-32 h-32 text-white/50" />
              </div>

              <!-- Badge -->
              <u-badge
                v-if="course.label"
                color="white"
                variant="solid"
                size="lg"
                class="absolute top-4 left-4"
              >
                {{ course.label }}
              </u-badge>
            </div>

            <!-- Description -->
            <div class="space-y-4">
              <div>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  About This Course
                </h2>
                <div
                  v-if="course.description"
                  class="prose dark:prose-invert max-w-none"
                  v-html="course.description"
                />
                <p v-else class="text-gray-600 dark:text-gray-400">
                  No description available for this course.
                </p>
              </div>
            </div>
          </u-card>

          <!-- Additional Info -->
          <u-card>
            <template #header>
              <h3 class="text-xl font-bold">What You'll Learn</h3>
            </template>

            <div class="grid md:grid-cols-2 gap-4">
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                  <u-icon name="i-heroicons-check-circle" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h4 class="font-semibold text-gray-900 dark:text-white">Expert Instruction</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Learn from experienced instructors</p>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                  <u-icon name="i-heroicons-clock" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h4 class="font-semibold text-gray-900 dark:text-white">Flexible Learning</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Study at your own pace</p>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                  <u-icon name="i-heroicons-document-check" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h4 class="font-semibold text-gray-900 dark:text-white">Certificate</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Earn a certificate upon completion</p>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                  <u-icon name="i-heroicons-users" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h4 class="font-semibold text-gray-900 dark:text-white">Community</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Join a supportive learning community</p>
                </div>
              </div>
            </div>
          </u-card>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Enroll Card -->
          <u-card>
            <div class="space-y-6">
              <div>
                <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {{ course.label }}
                </h3>
                <p class="text-gray-600 dark:text-gray-400 text-sm">
                  {{ cleanHtml(course.description)?.slice(0, 100) }}...
                </p>
              </div>

              <u-divider />

              <div class="space-y-4">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-600 dark:text-gray-400">Published</span>
                  <span class="font-semibold text-gray-900 dark:text-white">{{ formattedDate }}</span>
                </div>

                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-600 dark:text-gray-400">Level</span>
                  <u-badge color="primary" variant="soft">All Levels</u-badge>
                </div>

                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-600 dark:text-gray-400">Language</span>
                  <span class="font-semibold text-gray-900 dark:text-white">English</span>
                </div>
              </div>

              <u-divider />

              <div class="space-y-3">
                <u-button
                  block
                  size="lg"
                  color="primary"
                  leading-icon="i-heroicons-play"
                >
                  Start Learning
                </u-button>

                <u-button
                  block
                  size="lg"
                  color="gray"
                  variant="outline"
                  leading-icon="i-heroicons-heart"
                >
                  Save for Later
                </u-button>
              </div>
            </div>
          </u-card>

          <!-- Course Features -->
          <u-card>
            <template #header>
              <h3 class="font-bold">This Course Includes</h3>
            </template>

            <div class="space-y-3 text-sm">
              <div class="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <u-icon name="i-heroicons-video-camera" class="w-5 h-5 text-gray-400" />
                <span>Video lessons</span>
              </div>

              <div class="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <u-icon name="i-heroicons-document-text" class="w-5 h-5 text-gray-400" />
                <span>Downloadable resources</span>
              </div>

              <div class="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <u-icon name="i-heroicons-device-phone-mobile" class="w-5 h-5 text-gray-400" />
                <span>Mobile access</span>
              </div>

              <div class="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <u-icon name="i-heroicons-academic-cap" class="w-5 h-5 text-gray-400" />
                <span>Certificate of completion</span>
              </div>

              <div class="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <u-icon name="i-heroicons-arrow-path" class="w-5 h-5 text-gray-400" />
                <span>Lifetime access</span>
              </div>
            </div>
          </u-card>

          <!-- Share -->
          <u-card>
            <template #header>
              <h3 class="font-bold">Share This Course</h3>
            </template>

            <div class="flex gap-2">
              <u-button
                icon="i-heroicons-link"
                color="gray"
                variant="soft"
                size="sm"
              />
              <u-button
                icon="i-simple-icons-facebook"
                color="gray"
                variant="soft"
                size="sm"
              />
              <u-button
                icon="i-simple-icons-twitter"
                color="gray"
                variant="soft"
                size="sm"
              />
              <u-button
                icon="i-simple-icons-linkedin"
                color="gray"
                variant="soft"
                size="sm"
              />
            </div>
          </u-card>
        </div>
      </div>
    </u-container>
  </div>
</template>

<style scoped>
.prose {
  max-width: none;
}
</style>

