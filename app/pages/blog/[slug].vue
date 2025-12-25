<script setup>
const { getItems } = useDirectusItems()
const { getThumbnail } = useDirectusFiles()
const route = useRoute()
const slug = route.params.slug

const { data: article } = await useAsyncData(
  `article-${slug}`,
  async () => {
    const items = await getItems({
      collection: 'articles',
      params: {
        limit: 1,
        filter: { slug: { _eq: slug } },
        fields: ['*', 'category.title', 'user_created.first_name', 'user_created.last_name']
      }
    })
    return items?.[0] ?? null
  }
)

if (!article.value) {
  throw createError({
    statusCode: 404,
    message: 'Article not found'
  })
}

const crumbs = computed(() => [
  { label: 'Home', to: '/' },
  { label: 'Blog', to: '/blog' },
  { label: article.value?.title ?? 'Loading...' }
])

// Date formatting now handled by DateTimeDisplay component

const authorName = computed(() => {
  const user = article.value?.user_created
  if (!user) return 'Anonymous'
  return `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Anonymous'
})

const cleanHtml = (html) => {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '')
}
</script>

<template>
  <div class="bg-gray-50 dark:bg-gray-950">
    <pages-header :title="article?.title" :crumbs="crumbs" />

    <u-container class="py-12">
      <div class="grid lg:grid-cols-3 gap-8">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Article Header -->
          <u-card class="overflow-hidden">
            <!-- Featured Image -->
            <div v-if="article.image" class="relative aspect-video rounded-lg overflow-hidden -mx-4 -mt-4 mb-6">
              <div class="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 opacity-20" />
              <img
                :src="getThumbnail(article.image, { width: 1200, height: 675, fit: 'cover' })"
                :alt="article.title"
                class="w-full h-full object-cover"
              />
            </div>

            <!-- Article Meta -->
            <div class="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-600 dark:text-gray-400">
              <div class="flex items-center gap-2">
                <u-icon name="i-heroicons-user-circle" class="w-5 h-5" />
                <span>{{ authorName }}</span>
              </div>

              <div class="flex items-center gap-2">
                <u-icon name="i-heroicons-calendar" class="w-5 h-5" />
                <time>
                  <DateTimeDisplay 
                    :date="article?.date_created" 
                    type="date" 
                    :format-options="{ year: 'numeric', month: 'long', day: 'numeric' }" 
                  />
                </time>
              </div>

              <u-badge v-if="article.category" color="primary" variant="soft">
                {{ article.category.title }}
              </u-badge>
            </div>

            <!-- Article Content -->
            <div class="prose dark:prose-invert max-w-none" v-html="article.content" />
          </u-card>

          <!-- Related Info -->
          <u-card>
            <template #header>
              <h3 class="text-xl font-bold">About This Article</h3>
            </template>

            <div class="grid md:grid-cols-2 gap-4">
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                  <u-icon name="i-heroicons-book-open" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h4 class="font-semibold text-gray-900 dark:text-white">In-depth Content</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Detailed insights and analysis</p>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                  <u-icon name="i-heroicons-light-bulb" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h4 class="font-semibold text-gray-900 dark:text-white">Expert Insights</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Written by industry experts</p>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                  <u-icon name="i-heroicons-clock" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h4 class="font-semibold text-gray-900 dark:text-white">Latest Updates</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Stay informed with current trends</p>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                  <u-icon name="i-heroicons-share" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h4 class="font-semibold text-gray-900 dark:text-white">Share Knowledge</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Help others learn and grow</p>
                </div>
              </div>
            </div>
          </u-card>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Article Info -->
          <u-card>
            <div class="space-y-6">
              <div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Article Details
                </h3>
                <p class="text-gray-600 dark:text-gray-400 text-sm">
                  {{ cleanHtml(article.description)?.slice(0, 100) || cleanHtml(article.content)?.slice(0, 100) }}...
                </p>
              </div>

              <u-divider />

              <div class="space-y-4">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-600 dark:text-gray-400">Published</span>
                  <span class="font-semibold text-gray-900 dark:text-white">
                    <DateTimeDisplay 
                      :date="article?.date_created" 
                      type="date" 
                      :format-options="{ year: 'numeric', month: 'long', day: 'numeric' }" 
                    />
                  </span>
                </div>

                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-600 dark:text-gray-400">Author</span>
                  <span class="font-semibold text-gray-900 dark:text-white">{{ authorName }}</span>
                </div>

                <div v-if="article.category" class="flex items-center justify-between text-sm">
                  <span class="text-gray-600 dark:text-gray-400">Category</span>
                  <u-badge color="primary" variant="soft">{{ article.category.title }}</u-badge>
                </div>
              </div>

              <u-divider />

              <div class="space-y-3">
                <u-button
                  block
                  size="lg"
                  color="primary"
                  :to="`/blog/category/${article.category?.id}-${article.category?.slug}`"
                  v-if="article.category"
                  leading-icon="i-heroicons-folder"
                >
                  More in {{ article.category.title }}
                </u-button>

                <u-button
                  block
                  size="lg"
                  color="gray"
                  variant="outline"
                  to="/blog"
                  leading-icon="i-heroicons-arrow-left"
                >
                  Back to Blog
                </u-button>
              </div>
            </div>
          </u-card>

          <!-- Categories -->
          <blog-categories />

          <!-- Share -->
          <u-card>
            <template #header>
              <h3 class="font-bold">Share This Article</h3>
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
