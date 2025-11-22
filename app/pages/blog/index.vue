<script setup>
const {getItems} = useDirectusItems();

const items = [
  {label: 'Home', to: '/'},
  {label: 'Blog'}
];

const {data: articles, pending} = await useAsyncData("articles", () => getItems({
  collection: 'articles',
  params: {
    fields: ['id', 'title', 'description', 'slug', 'image', 'date_created', 'status']
  }
}));

const formatDate = (value) => {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('en', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(value));
  } catch (e) {
    return value;
  }
};

const posts = computed(() => {
  if (!articles.value) return [];
  return articles.value.map((article) => ({
    ...article,
    date: formatDate(article.date_created),
    excerpt: article.description?.slice(0, 200) ?? '',
    cover: article.image ?? '/images/banners/testimonial-bg-01.jpg'
  }));
});
</script>

<template>
  <main>
    <div class="pages py-10 border-b border-gray-200 bg-white mb-6">
      <u-container>
        <u-breadcrumb class="mb-4" :items="items"/>
        <base-heading is="h1" class="max-w-2xl">
          Discover the latest insights, guides, and resources from the Fatima LMS community.
        </base-heading>
      </u-container>
    </div>

    <u-container class="py-10">
      <div v-if="pending" class="grid gap-6 md:grid-cols-2">
        <u-card v-for="idx in 4" :key="`post-skeleton-${idx}`" class="space-y-4">
          <u-skeleton class="h-48 w-full rounded-2xl"/>
          <u-skeleton class="h-6 w-3/4"/>
          <u-skeleton class="h-4 w-full"/>
          <u-skeleton class="h-4 w-2/3"/>
          <u-skeleton class="h-10 w-32"/>
        </u-card>
      </div>

      <div v-else-if="posts.length" class="grid gap-6 md:grid-cols-2">
        <u-card
            v-for="post in posts"
            :key="post.id"
            class="flex flex-col overflow-hidden"
        >
          <div class="relative">
            <nuxt-img
                :src="post.cover"
                :alt="post.title"
                class="w-full h-48 object-cover rounded-2xl border border-gray-100"
            />
            <u-badge
                size="sm"
                variant="solid"
                color="primary"
                class="absolute top-4 left-4 capitalize"
            >
              {{ post.status ?? 'draft' }}
            </u-badge>
          </div>

          <div class="flex-1 flex flex-col gap-4 pt-6">
            <div class="text-sm text-gray-500">{{ post.date }}</div>
            <h2 class="text-xl font-semibold leading-tight">
              {{ post.title }}
            </h2>
            <p class="text-gray-600">
              {{ post.excerpt }}{{ post.description?.length > 200 ? '…' : '' }}
            </p>
            <div class="mt-auto">
              <u-button color="primary" variant="soft" :to="`/blog/${post.id}`">
                Read article
              </u-button>
            </div>
          </div>
        </u-card>
      </div>
      <div v-else class="text-center py-20 text-gray-500">
        No articles available yet. Check back soon for updates.
      </div>
    </u-container>
  </main>
</template>

<style scoped>

</style>
