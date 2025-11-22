<script setup>
const {getItems} = useDirectusItems();
const route = useRoute();
const id = route.params.id;

const fetchArticle = async () => {
  const items = await getItems({
    collection: 'articles',
    params: {
      limit: 1,
      fields: ['id', 'title', 'description', 'content', 'image', 'date_created', 'status', 'slug'],
      filter: {
        _or: [
          {id: {_eq: id}},
          {slug: {_eq: id}}
        ]
      }
    }
  });

  return items?.[0] ?? null;
};

const {data: article, pending} = await useAsyncData(`article-${id}`, fetchArticle);

const formatDate = (value) => {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('en', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(new Date(value));
  } catch (error) {
    return value;
  }
};

const breadcrumbItems = computed(() => ([
  {label: 'Home', to: '/'},
  {label: 'Blog', to: '/blog'},
  {label: article.value?.title ?? 'Loading article'}
]));

const heroImage = computed(() => article.value?.image ?? '/images/banners/testimonial-bg-01.jpg');
const publishedDate = computed(() => formatDate(article.value?.date_created));
</script>

<template>
  <main>
    <div class="pages py-10 border-b border-gray-200 bg-white mb-6">
      <u-container>
        <u-breadcrumb class="mb-4" :items="breadcrumbItems"/>
        <base-heading is="h1">
          {{ article?.title ?? 'Loading article' }}
        </base-heading>
      </u-container>
    </div>

    <u-container class="py-10">
      <u-card v-if="pending" class="space-y-4">
        <u-skeleton class="h-8 w-1/2"/>
        <u-skeleton class="h-4 w-1/3"/>
        <u-skeleton class="h-72 w-full rounded-2xl"/>
        <u-skeleton class="h-4 w-full" v-for="idx in 4" :key="`article-line-${idx}`"/>
      </u-card>

      <template v-else-if="article">
        <u-card class="space-y-8">
          <div class="space-y-4">
            <div class="flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <u-badge color="primary" variant="subtle" class="capitalize">
                {{ article.status ?? 'draft' }}
              </u-badge>
              <span>{{ publishedDate }}</span>
            </div>
            <h1 class="text-3xl md:text-4xl font-semibold leading-tight">
              {{ article.title }}
            </h1>
            <p class="text-gray-600">
              {{ article.description }}
            </p>
          </div>

          <nuxt-img
              :src="heroImage"
              :alt="article.title"
              class="w-full h-72 md:h-96 object-cover rounded-2xl border border-gray-100"
          />

          <div class="article-content" v-html="article.content"/>
        </u-card>
      </template>

      <u-alert
          v-else
          color="error"
          variant="soft"
          title="Article not found"
          description="The article you are looking for might have been removed or is not available yet."
      />
    </u-container>
  </main>
</template>

<style scoped>

</style>
