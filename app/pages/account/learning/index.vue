<script setup>
import { useDateFormat } from '@vueuse/core'
 const { getThumbnail: img } = useDirectusFiles();
definePageMeta({middleware: ["auth"]})

const {getItems} = useDirectusItems();
const user = useDirectusUser();
const currentUserId = computed(() => user.value?.id);

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
    fields: ['*', 'course.label', 'course.image', 'plan.*'],
    sort: ['-status'],
    filter: {
      student: {
        _eq: currentUserId.value
      }
    },
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
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
    const color = {
        running: 'success',
      pending: 'warning',
      error: 'error',
        expired: 'neutral'
      }[row.getValue('status')]

      return h(UBadge, { class: 'capitalize', variant: 'subtle', color }, () =>
          row.getValue('status')
      )
    }
  },
  {
    accessorKey: 'actions',
    header: 'Actions',
  }
]

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
      <div class="grid lg:grid-cols-12 gap-6">

        <user-navigation/>

        <div class="flex-1 lg:col-span-9 space-y-6">

          <u-card>
            <u-table  :data="subscriptions" :columns="columns">
              <template #title-cell="{ row }">
                <div class="flex items-center gap-4">
                <img v-if="row.original.course?.image" :src="img(row.original.course.image)" CLASS="w-30" />
                <div class="">
                <p class="font-bold">{{ row.original.course?.label || 'N/A' }}</p>
                <u-popover v-if="row.original.plan" mode="hover">
                  <p>Plan: <span class="text-primary-500">{{row.original.plan.label}}</span></p>
                  <template #content>
                    <ul class="p-4 text-xs">
                      <li v-for="(feature, idx ) in row.original.plan.features" :key="idx">{{feature}}</li>
                    </ul>
                  </template>
                </u-popover>
                </div>
                </div>
              </template>
              <template #date-cell="{ row }">
                <p class="text-xs">Start: {{ useDateFormat(row.original.start, 'DD MMMM YYYY') }}</p>
                <p class="text-xs">End: {{ useDateFormat(row.original.end, 'DD MMMM YYYY') }}</p>
               </template>
              <template #actions-cell="{ row }">
                <u-button color="primary" size="sm" :to="`/account/learning/${row.original.id}`">View</u-button>
              </template>
            </u-table>

          </u-card>
        </div>

      </div>
    </u-container>

  </section>
</template>

<style scoped>

</style>
