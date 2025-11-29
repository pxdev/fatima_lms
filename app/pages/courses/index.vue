<script setup>
const { getItems } = useDirectusItems()
const { getThumbnail } = useDirectusFiles()

const crumbs = [
  { label: 'Home', to: '/' },
  { label: 'Courses' }
]

const page = ref(1)
const search = ref('')

const { data: courses } = await useAsyncData(
  'courses',
  () => getItems({
    collection: 'courses',
    params: {
      fields: ['id', 'slug', 'label', 'description', 'image', 'date_created'],
      sort: ['-date_created'],
      limit: 9,
      page: page.value,
      meta: '*'
    }
  }),
  { watch: [page] }
)

const filteredCourses = computed(() => {
  if (!courses.value?.data) return []
  if (!search.value) return courses.value.data
  
  const query = search.value.toLowerCase()
  return courses.value.data.filter(course => 
    course.label?.toLowerCase().includes(query) ||
    course.description?.toLowerCase().includes(query)
  )
})

const cleanText = (html, maxLength = 120) => {
  if (!html) return ''
  const text = html.replace(/<[^>]*>/g, '')
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text
}

const gradients = [
  'from-blue-500 to-cyan-500',
  'from-purple-500 to-pink-500',
  'from-orange-500 to-red-500',
  'from-green-500 to-teal-500',
  'from-indigo-500 to-purple-500',
  'from-pink-500 to-rose-500',
]

const getGradient = (index) => gradients[index % gradients.length]
</script>

<template>
  <div class="bg-gray-50 dark:bg-gray-950">
    <pages-header title="Courses" :crumbs="crumbs" />

    <u-container class="py-16">
      <!-- Header -->
      <div class="mb-12 space-y-8">
        <div>
          <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Explore Courses
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Discover and enroll in courses to enhance your skills
          </p>
        </div>

        <!-- Search Bar -->
        <div class="max-w-xl">
          <u-input
            v-model="search"
            size="lg"
            icon="i-heroicons-magnifying-glass"
            placeholder="Search courses..."
          />
        </div>
      </div>

      <!-- Courses Grid -->
      <div v-if="filteredCourses.length">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <nuxt-link
            v-for="(course, index) in filteredCourses"
            :key="course.id"
            :to="`/courses/${course.slug}`"
            class="group block"
          >
            <u-card class="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <!-- Image -->
              <div class="relative overflow-hidden aspect-video rounded-t-lg -mx-4 -mt-4 mb-4">
                <div :class="['absolute inset-0 bg-gradient-to-br opacity-90', getGradient(index)]" />
                
                <img
                  v-if="course.image"
                  :src="getThumbnail(course.image, { width: 600, height: 400, fit: 'cover' })"
                  :alt="course.label"
                  class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <u-icon name="i-heroicons-academic-cap" class="w-16 h-16 text-white/50" />
                </div>

                <!-- Label Badge -->
                <u-badge
                  v-if="course.label"
                  color="white"
                  variant="solid"
                  class="absolute top-4 left-4"
                >
                  {{ course.label }}
                </u-badge>
              </div>

              <!-- Content -->
              <div class="space-y-4">
                <p class="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 min-h-[60px]">
                  {{ cleanText(course.description) }}
                </p>

                <div class="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                  <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                    <u-icon name="i-heroicons-calendar" class="w-4 h-4" />
                    <time>{{ new Date(course.date_created).toLocaleDateString() }}</time>
                  </div>

                  <div class="flex items-center gap-1.5 text-primary-600 dark:text-primary-400 text-sm font-semibold group-hover:gap-2 transition-all">
                    <span>View Course</span>
                    <u-icon name="i-heroicons-arrow-right" class="w-4 h-4" />
                  </div>
                </div>
              </div>
            </u-card>
          </nuxt-link>
        </div>

        <!-- Pagination -->
        <div v-if="courses?.meta?.total_count > 9" class="flex justify-center">
          <u-pagination
            v-model:page="page"
            :total="courses.meta.total_count"
            :items-per-page="9"
            show-first
            show-last
          />
        </div>
      </div>

      <!-- Empty State -->
      <u-card v-else class="text-center py-16">
        <div class="flex flex-col items-center gap-4">
          <div class="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <u-icon name="i-heroicons-academic-cap" class="w-10 h-10 text-gray-400" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              No courses found
            </h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm">
              {{ search ? 'Try a different search term' : 'Check back later for new courses' }}
            </p>
          </div>
          <u-button
            v-if="search"
            @click="search = ''"
            color="primary"
            variant="soft"
          >
            Clear search
          </u-button>
        </div>
      </u-card>
    </u-container>
  </div>
</template>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

