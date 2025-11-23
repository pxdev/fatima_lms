<script setup>
import {useDateFormat} from "@vueuse/core";
import PagesHeader from "~/components/app/PagesHeader.vue";


const {getItems} = useDirectusItems();
const route = useRoute();
const slug = route.params.slug;

const fetchArticle = async () => {
  const items = await getItems({
    collection: 'articles',
    params: {
      limit: 1,
      filter: {
        slug: {
          _eq: slug
        }
      }
    }
  });

  return items?.[0] ?? null;
};

const {data: article} = await useAsyncData(`article-${slug}`, fetchArticle);


const crumbs = computed(() => ([
  {label: 'Home', to: '/'},
  {label: 'Blog', to: '/blog'},
  {label: article.value?.title ?? 'Loading article'}
]));

</script>

<template>
  <section>

    <pages-header :title="article.title" :crumbs="crumbs"/>

    <u-container>
      <u-page>
        <template #default>
          <div>
            <p class="text-xs flex items-center gap-1 mb-4 opacity-70">
              <icon class="w-4 h-4" name="hugeicons:calendar-03"/>
              Published on {{ useDateFormat(article.date_created, 'DD MMMM YYYY') }}
            </p>
            <div class="" v-html="article.content"></div>
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
