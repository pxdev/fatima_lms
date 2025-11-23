<script setup>
import {useDateFormat} from "@vueuse/core";
import BlogCategories from "~/components/app/BlogCategories.vue";
import PagesHeader from "~/components/app/PagesHeader.vue";

const {getThumbnail: img} = useDirectusFiles();
const {getItems} = useDirectusItems();

const route = useRoute();
const categoryId = route.params.id;
const slug = route.params.slug;

const crumbs = [
  {label: 'Home', to: '/'},
  {label: 'Blog', to: '/blog'},
  {label: slug}
];

const page = ref(1);

const {data: articles} = await useAsyncData(`articles-${categoryId}`, () => getItems({
      collection: 'articles',
      params: {
        fields: ['*', 'user_created.first_name', 'category.*'],
        sort: ['-date_created'],
        limit: 10,
        page: page.value,
        meta: '*',
        filter: {
          category: {
            id: {
              _eq: categoryId
            }
          }
        }
      }
    }),
    {watch: [page]}
)


const truncate = (str, n) => {
  return (str.length > n) ? str.substr(0, n - 1) + '...' : str;
}


</script>

<template>

  <section>

    <pages-header title="Blog" :crumbs="crumbs"/>

    <u-container>
      <u-page>
        <template #default>
          <div v-if="articles" class="space-y-8 flex-1 mb-8">
            <u-blog-post
                v-for="post in articles?.data" :key="post.id"
                :title="post.title"
                :description="truncate(post.description, 100)"
                :image="img(post.image)"
                :badge="post.category.title"
                :date="useDateFormat(post.deate_created, 'DD MMMM YYYY')"
                :to="`/blog/${post.slug}`"
                orientation="horizontal"
                variant="ghost"
            />
            <div class="flex justify-center">
              <u-pagination v-model:page="page" size="sm" :items-per-page="10" :total="articles?.meta?.total_count"/>
            </div>
          </div>
        </template>
        <template #right>
          <blog-categories/>
        </template>
      </u-page>


    </u-container>

  </section>


</template>

<style scoped>

</style>
