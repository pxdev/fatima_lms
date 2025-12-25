<script setup lang="ts">
import { z } from 'zod'

definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

const route = useRoute()
const sessionId = computed(() => route.params.id as string)

useSeoMeta({
  title: 'Rate Session',
  description: 'Rate your learning session'
})

const { profile, fetchProfile } = useProfile()
const { currentSession, fetchSession, formatSessionTime } = useSessions()
const { createRating, hasRated, isLoading, error } = useRatings()

const alreadyRated = ref(false)
const success = ref(false)

const schema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional()
})

type RatingForm = z.infer<typeof schema>

const state = reactive<RatingForm>({
  rating: 5,
  comment: ''
})

// Throttled submit
const { execute: throttledSubmit, isLoading: isSaving } = useThrottledAction(
  async () => {
    await doSubmit()
  },
  { throttleMs: 2000 }
)

onMounted(async () => {
  await Promise.all([
    fetchProfile(),
    fetchSession(sessionId.value)
  ])

  if (profile.value?.id) {
    alreadyRated.value = await hasRated(sessionId.value, profile.value.id)
  }
})

async function doSubmit() {
  if (!profile.value?.id || !currentSession.value) return

  try {
    await createRating({
      session: sessionId.value,
      rater: profile.value.id,
      rater_role: profile.value.role as 'student' | 'teacher',
      rating: state.rating,
      comment: state.comment || null
    })

    success.value = true
    
    setTimeout(() => {
      navigateTo('/student/dashboard')
    }, 2000)
  } catch (err) {
    // Error handled by composable
  }
}

function handleSubmit() {
  throttledSubmit()
}
</script>

<template>
  <div class="min-h-screen py-12">
    <div class="mx-auto max-w-xl px-4">
      <!-- Breadcrumbs -->
      <UBreadcrumb 
        :items="[
          { label: 'Home', icon: 'i-heroicons-home', to: '/student/dashboard' },
          { label: 'My Sessions', to: '/student/sessions' },
          { label: 'Rate Session' }
        ]" 
        class="mb-6"
      />

      <!-- Loading -->
      <UCard v-if="isLoading" class="space-y-4">
        <USkeleton class="h-8 w-1/2" />
        <USkeleton class="h-32 w-full" />
      </UCard>

      <!-- Already Rated -->
      <UCard v-else-if="alreadyRated" class="text-center py-12">
        <UIcon name="i-heroicons-check-circle" class="mx-auto h-16 w-16 text-primary-500" />
        <h3 class="mt-4 text-lg font-semibold text-slate-900">Already Rated</h3>
        <p class="mt-2 text-slate-600">You have already rated this session.</p>
        <UButton
          color="primary"
          class="mt-6"
          to="/student/dashboard"
        >
          Go to Dashboard
        </UButton>
      </UCard>

      <!-- Success -->
      <UCard v-else-if="success" class="text-center py-12">
        <UIcon name="i-heroicons-star" class="mx-auto h-16 w-16 text-amber-500" />
        <h3 class="mt-4 text-lg font-semibold text-slate-900">Thank You!</h3>
        <p class="mt-2 text-slate-600">Your feedback has been submitted.</p>
      </UCard>

      <!-- Rating Form -->
      <UCard v-else>
        <template #header>
          <h1 class="text-xl font-bold text-slate-900">Rate Your Session</h1>
          <p v-if="currentSession" class="mt-1 text-sm text-slate-600">
            {{ formatSessionTime(currentSession) }}
          </p>
        </template>

        <UForm :schema="schema" :state="state" class="space-y-6" @submit="handleSubmit">
          <!-- Error -->
          <UAlert
            v-if="error"
            color="error"
            variant="soft"
            icon="i-heroicons-exclamation-triangle"
            :title="error"
          />

          <!-- Star Rating -->
          <UFormField label="How was your session?" name="rating" required>
            <div class="flex justify-center gap-2 py-4">
              <button
                v-for="star in 5"
                :key="star"
                type="button"
                class="transition-transform hover:scale-110 focus:outline-none"
                @click="state.rating = star"
              >
                <UIcon
                  :name="star <= state.rating ? 'i-heroicons-star-solid' : 'i-heroicons-star'"
                  :class="[
                    'h-10 w-10',
                    star <= state.rating ? 'text-amber-400' : 'text-slate-300'
                  ]"
                />
              </button>
            </div>
            <p class="text-center text-sm text-slate-600">
              {{ ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][state.rating] }}
            </p>
          </UFormField>

          <!-- Comment -->
          <UFormField label="Additional Comments (Optional)" name="comment">
            <UTextarea
              v-model="state.comment"
              placeholder="Share your thoughts about this session..."
              :rows="4"
              class="w-full"
            />
          </UFormField>

          <!-- Submit -->
          <div class="flex justify-end gap-3">
            <UButton
              color="neutral"
              variant="outline"
              to="/student/dashboard"
              :disabled="isSaving"
            >
              Skip
            </UButton>
            <UButton
              type="submit"
              color="primary"
              :loading="isSaving"
            >
              Submit Rating
            </UButton>
          </div>
        </UForm>
      </UCard>
    </div>
  </div>
</template>

