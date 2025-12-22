<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

useSeoMeta({
  title: 'Student Dashboard',
  description: 'Your learning dashboard'
})

const { profile, fetchProfile, isLoading: profileLoading } = useProfile()
const { subscriptions, fetchMySubscriptions, getStatusColor, isLoading: subsLoading } = useSubscriptions()

const isLoading = computed(() => profileLoading.value || subsLoading.value)

onMounted(async () => {
  await fetchProfile()
  if (profile.value?.id) {
    await fetchMySubscriptions(profile.value.id)
  }
})

function getActiveSubscription() {
  return subscriptions.value.find(s => 
    ['active', 'teacher_assigned', 'payment_received'].includes(s.status)
  )
}

function getPendingSubscriptions() {
  return subscriptions.value.filter(s => 
    ['draft', 'pending_payment'].includes(s.status)
  )
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">
          Welcome back{{ profile?.display_name ? `, ${profile.display_name}` : '' }}!
        </h1>
        <p class="mt-1 text-slate-600">Manage your learning journey</p>
      </div>
      <UButton
        color="primary"
        to="/student/onboarding/course"
        class="hidden sm:flex"
      >
        <UIcon name="i-heroicons-plus" class="mr-2 h-4 w-4" />
        New Subscription
      </UButton>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="grid gap-6 md:grid-cols-2">
      <USkeleton v-for="i in 3" :key="i" class="h-48 rounded-xl" />
    </div>

    <!-- Content -->
    <div v-else>
      <!-- Empty State -->
      <UCard v-if="subscriptions.length === 0" class="text-center py-12">
        <UIcon name="i-heroicons-academic-cap" class="mx-auto h-16 w-16 text-slate-300" />
        <h3 class="mt-4 text-lg font-semibold text-slate-900">No Subscriptions Yet</h3>
        <p class="mt-2 text-slate-600">Start your learning journey by creating a new subscription.</p>
        <UButton
          color="primary"
          class="mt-6"
          to="/student/onboarding/course"
        >
          Get Started
        </UButton>
      </UCard>

      <!-- Subscriptions Grid -->
      <div v-else class="grid gap-6 md:grid-cols-2">
        <UCard
          v-for="sub in subscriptions"
          :key="sub.id"
          class="transition-all hover:shadow-lg"
        >
          <div class="flex items-start justify-between">
            <div>
              <UBadge
                :color="getStatusColor(sub.status)"
                variant="soft"
                size="sm"
              >
                {{ sub.status.replace(/_/g, ' ') }}
              </UBadge>
            </div>
            <UButton
              variant="ghost"
              color="neutral"
              size="sm"
              :to="`/student/subscriptions/${sub.id}`"
            >
              <UIcon name="i-heroicons-arrow-right" class="h-4 w-4" />
            </UButton>
          </div>

          <div class="mt-4 space-y-4">
            <!-- Progress -->
            <div>
              <div class="mb-2 flex justify-between text-sm">
                <span class="text-slate-600">Sessions Progress</span>
                <span class="font-medium text-slate-900">
                  {{ sub.sessions_total - sub.sessions_remaining }}/{{ sub.sessions_total }}
                </span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full bg-primary-500 transition-all"
                  :style="{
                    width: `${((sub.sessions_total - sub.sessions_remaining) / sub.sessions_total) * 100}%`
                  }"
                />
              </div>
            </div>

            <!-- Stats -->
            <div class="flex gap-4 text-sm">
              <div>
                <span class="text-slate-500">Sessions Left:</span>
                <span class="ml-1 font-semibold text-primary-600">{{ sub.sessions_remaining }}</span>
              </div>
              <div>
                <span class="text-slate-500">Postpones:</span>
                <span class="ml-1 font-semibold text-amber-600">{{ sub.postpone_remaining }}</span>
              </div>
            </div>
          </div>

          <template #footer>
            <UButton
              block
              :color="sub.status === 'draft' ? 'primary' : 'neutral'"
              :variant="sub.status === 'draft' ? 'solid' : 'outline'"
              :to="`/student/subscriptions/${sub.id}`"
            >
              {{ sub.status === 'draft' ? 'Complete Payment' : 'View Details' }}
            </UButton>
          </template>
        </UCard>
      </div>
    </div>
  </div>
</template>

