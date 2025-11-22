<script setup>
definePageMeta({middleware: ["auth"]})
const { getThumbnail: img } = useDirectusFiles();

const {getItemById} = useDirectusItems();
const route = useRoute();
const id = route.params.id;

const {data: subscription, pending} = await useAsyncData("subscription", () => getItemById({
  collection: 'subscriptions',
  id,
  params: {
    fields: ['*', 'course.label', 'course.image', 'plan.*']
  }
}));

const formatDate = (value) => {
  if (!value) return '—';

  try {
    return new Intl.DateTimeFormat('en', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(new Date(value));
  } catch (e) {
    return value;
  }
};

const formatPrice = (value) => {
  if (value === undefined || value === null || value === '') return '—';
  const amount = Number(value);
  if (Number.isNaN(amount)) return value;
  return `$${amount.toLocaleString()}`;
};

const statusColors = {
  running: 'success',
  pending: 'warning',
  error: 'error',
  expired: 'neutral'
};

const breadcrumbItems = computed(() => {
  const title = subscription.value?.course?.label ?? 'My Learning';
  return [
    {label: 'Home', to: '/'},
    {label: 'My Learning', to: '/account/learning'},
    {label: title}
  ];
});

const stats = computed(() => {
  const record = subscription.value;
  if (!record) return [];

  return [
    {label: 'Status', value: record.status ? record.status.replace(/_/g, ' ') : '—'},
    {label: 'Plan', value: record.plan?.label ?? '—'},
    {label: 'Billing Cycle', value: record.plan?.period ?? '—'},
    {label: 'Price', value: formatPrice(record.plan?.price)},
    {label: 'Start Date', value: formatDate(record.start)},
    {label: 'End Date', value: formatDate(record.end)},
  ];
});

const planFeatures = computed(() => subscription.value?.plan?.features ?? []);

const planStats = computed(() => {
  const plan = subscription.value?.plan;
  if (!plan) return [];

  return [
    {label: 'Sessions', value: plan.total_sessions ? `${plan.total_sessions} total` : '—'},
    {label: 'Session Duration', value: plan.session_duration ? `${plan.session_duration} min` : '—'},
    {label: 'Currency', value: plan.currency ?? '—'},
    {label: 'Discount', value: plan.discount ? `${plan.discount}%` : 'None'},
  ];
});

const sessions = computed(() => subscription.value?.sessions ?? []);
const hasMeetingLink = computed(() => Boolean(subscription.value?.meating_url));

const statusColor = computed(() => {
  const status = subscription.value?.status;
  return statusColors[status] ?? 'neutral';
});

const heroImage = computed(() => subscription.value?.course?.image ?? '/images/muslim_quran.png');
</script>

<template>
  <section>
    <div class="pages py-10 border-b border-gray-200 bg-white mb-6">
      <u-container>
        <u-breadcrumb class="mb-4" :items="breadcrumbItems"/>
        <base-heading is="h1">
          {{ subscription?.course?.label ?? 'Loading course' }}
        </base-heading>
      </u-container>
    </div>

    <u-container>
      <div class="grid lg:grid-cols-12 gap-6">
        <user-navigation/>

        <div class="flex-1 lg:col-span-9 space-y-6">
          <u-card class="overflow-hidden">
            <div class="flex flex-col lg:flex-row gap-6">
              <div class="w-full lg:w-64">
                <nuxt-img
                    :src="img(heroImage)"
                    :alt="subscription?.course?.label ?? 'Course cover'"
                    class="w-full h-48 lg:h-full object-cover rounded-xl border border-gray-100"
                />
              </div>
              <div class="flex-1 space-y-4">
                <div class="flex flex-wrap gap-3 items-center">
                  <u-badge variant="subtle" color="primary">
                    {{ subscription?.plan?.label ?? 'Active Plan' }}
                  </u-badge>
                  <u-badge
                      variant="subtle"
                      :color="statusColor"
                      class="capitalize"
                  >
                    {{ subscription?.status ?? 'pending' }}
                  </u-badge>
                </div>
                <div>
                  <h2 class="text-2xl font-semibold">
                    {{ subscription?.course?.label ?? 'Course title' }}
                  </h2>
                  <p class="text-gray-600 mt-2" v-if="subscription?.plan?.description" v-html="subscription.plan.description"/>
                  <p v-else class="text-gray-600">
                    Track your lessons, plan benefits, and important subscription details in one place.
                  </p>
                </div>
                <div class="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span>Started: <strong>{{ formatDate(subscription?.start) }}</strong></span>
                  <span>Ends: <strong>{{ formatDate(subscription?.end) }}</strong></span>
                </div>
              </div>
            </div>
          </u-card>

          <u-card>
            <template #header>
              <div class="flex items-center gap-2">
                <icon name="hugeicons:details" class="w-5 h-5 text-primary-500"/>
                <p class="font-semibold">Subscription details</p>
              </div>
            </template>

            <div v-if="pending">
              <u-skeleton class="h-6 w-full mb-3" v-for="idx in 3" :key="`stat-skeleton-${idx}`"/>
            </div>
            <div v-else-if="stats.length" class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                  v-for="(stat, idx) in stats"
                  :key="idx"
                  class="p-4 rounded-xl border border-gray-100 bg-gray-50"
              >
                <p class="text-xs uppercase tracking-wide text-gray-500">{{ stat.label }}</p>
                <p class="text-lg font-semibold mt-1">{{ stat.value }}</p>
              </div>
            </div>
            <div v-else class="text-sm text-gray-500">
              Subscription information will show up here once it is available.
            </div>
          </u-card>

          <u-card>
            <template #header>
              <div class="flex items-center gap-2">
                <icon name="solar:list-check-bold-duotone" class="w-5 h-5 text-primary-500"/>
                <p class="font-semibold">Plan benefits</p>
              </div>
            </template>

            <div v-if="planFeatures.length">
              <div class="grid gap-3 md:grid-cols-2 mb-4">
                <div
                    v-for="(stat, idx) in planStats"
                    :key="`plan-stat-${idx}`"
                    class="rounded-xl border border-gray-100 p-3 text-sm"
                >
                  <p class="text-gray-500 text-xs uppercase">{{ stat.label }}</p>
                  <p class="font-semibold mt-1">{{ stat.value }}</p>
                </div>
              </div>
              <ul class="space-y-3">
                <li
                    v-for="(feature, idx) in planFeatures"
                    :key="idx"
                    class="flex items-start gap-3"
                >
                  <icon name="heroicons:check-circle" class="w-5 h-5 text-primary-500 mt-0.5"/>
                  <span class="text-gray-700">{{ feature }}</span>
                </li>
              </ul>
            </div>
            <div v-else class="text-sm text-gray-500">
              This plan does not list any features yet.
            </div>
          </u-card>

          <u-card>
            <template #header>
              <div class="flex items-center justify-between flex-wrap gap-3">
                <div class="flex items-center gap-2">
                  <icon name="solar:calendar-bold-duotone" class="w-5 h-5 text-primary-500"/>
                  <p class="font-semibold">Sessions</p>
                </div>
                <u-button
                    v-if="hasMeetingLink"
                    color="primary"
                    size="sm"
                    variant="outline"
                    target="_blank"
                    :to="subscription?.meating_url"
                >
                  Join meeting
                </u-button>
              </div>
            </template>

            <div v-if="sessions.length">
              <u-table :data="sessions" :columns="[{header: 'Session', accessorKey: 'label'}, {header: 'Status', accessorKey: 'status'}]">
                <template #session-cell="{ row }">
                  {{ row.original.label ?? `Session ${row.index + 1}` }}
                </template>
                <template #status-cell="{ row }">
                  <u-badge size="sm" variant="soft" class="capitalize">
                    {{ row.original.status ?? 'scheduled' }}
                  </u-badge>
                </template>
              </u-table>
            </div>
            <div v-else class="text-sm text-gray-500">
              Sessions will appear here once they are scheduled.
            </div>
          </u-card>
        </div>
      </div>
    </u-container>
  </section>
</template>

<style scoped>

</style>
