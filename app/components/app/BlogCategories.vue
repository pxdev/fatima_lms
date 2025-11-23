<script setup>
const {getItems} = useDirectusItems();

const {data: categories} = await useAsyncData("articles_categories", () => getItems({
      collection: 'articles_categories',
    }),
)
</script>

<template>
  <aside>


    <u-card class="sticky top-24 mb-6">

      <ul>
        <li v-for="category in categories" :key="category.id" class="mb-2">
          <nuxt-link
              active-class="text-primary-500" class="flex items-center gap-2 p-1"
              :to="`/blog/category/${category.id}-${category.slug}`">
            <icon name="hugeicons:folder-02" class="w-5 h-5"></icon>
            {{ category.title }}
          </nuxt-link>
        </li>
      </ul>
    </u-card>
  </aside>
</template>

<style scoped>

</style>