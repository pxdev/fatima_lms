<script setup>
definePageMeta({middleware: ["auth"]})

const {getItems} = useDirectusItems();

const items = [
  {
    label: 'Home',
    to: '/'
  },
  {
    label: 'My Learning',
    to: '/account/learning'
  }
]


const {data: subscriptions} = await useAsyncData("subscriptions", () => getItems({
  collection: 'subscriptions',
  params: {
    fields: ['*', 'course.*', 'plan.*']
  }
}))

const columns = [
  {
    accessorKey: 'title',
    header: 'Course',
  },
  {
    accessorKey: 'date',
    header: 'Date',
  },
  {
    accessorKey: 'duration',
    header: 'Duration',
  }
];
</script>

<template>
  <section>
    <div class="pages py-10 border-b border-gray-200 bg-white mb-6">
      <u-container>
        <u-breadcrumb class="mb-4" :items="items"/>
        <base-heading is="h1">My Learning</base-heading>
      </u-container>
    </div>

    <u-container>
      <div class="flex gap-6">

        <user-navigation/>


        <div class="flex-1 space-y-6">

          <u-card>
            <u-table :data="subscriptions" :columns="columns">
              <template #title-cell="{ row }">
                <p>{{ row.original.course.label }}</p>
              </template>
              <template #date-cell="{ row }">
                {{ row.original.start }} - {{ row.original.end }}
              </template>
              <template #duration-cell="{ row }">
                {{ row.original.plan.session_duration }} / min
              </template>
            </u-table>
          </u-card>
          <debug>{{ subscriptions }}</debug>

        </div>

      </div>
    </u-container>

  </section>
</template>

<style scoped>

</style>
