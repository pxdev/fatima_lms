<script setup lang="ts">
import { z } from 'zod'

const { requestPasswordReset } = useDirectusAuth()

// ===============================
// Validation Schema
// ===============================
const schema = z.object({
  email: z.string().trim().email('Enter a valid email address')
})

type ForgotForm = z.infer<typeof schema>

// ===============================
// Reactive State
// ===============================
const state = reactive<ForgotForm>({
  email: ''
})

const errorMessage = ref('')
const isSubmitted = ref(false)

// ===============================
// Throttled Form Submission
// ===============================
const { execute: throttledSubmit, isLoading } = useThrottledAction(
  async () => {
    await doForgotPassword()
  },
  { throttleMs: 2000 }
)

async function doForgotPassword() {
  errorMessage.value = ''

  const { email } = state

  try {
    // Request password reset via Directus (nuxt-directus composable)
    await requestPasswordReset({ email })

    isSubmitted.value = true
  } catch (err: any) {
    // Don't reveal if email exists or not for security
    // Still show success to prevent email enumeration
    isSubmitted.value = true
  }
}

function handleForgotPassword() {
  throttledSubmit()
}

// ===============================
// Reset form to try again
// ===============================
function tryAgain() {
  isSubmitted.value = false
  state.email = ''
  errorMessage.value = ''
}
</script>

<template>
  <AuthCard
    title="Forgot password?"
    subtitle="No worries, we'll send you reset instructions"
  >
    <div class="space-y-6">
      <!-- Success State -->
      <div v-if="isSubmitted" class="space-y-6">
        <div class="flex justify-center">
          <div class="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
            <UIcon name="i-heroicons-envelope" class="h-8 w-8 text-primary-600" />
          </div>
        </div>

        <div class="text-center">
          <h3 class="text-lg font-semibold text-slate-900">Check your email</h3>
          <p class="mt-2 text-sm text-slate-500">
            We sent a password reset link to
            <span class="font-medium text-slate-900">{{ state.email }}</span>
          </p>
        </div>

        <UAlert
          color="info"
          variant="soft"
          icon="i-heroicons-information-circle"
        >
          <template #title>
            Didn't receive the email? Check your spam folder, or
            <button
              type="button"
              class="font-semibold text-primary-600 hover:underline"
              @click="tryAgain"
            >
              try another email address
            </button>
          </template>
        </UAlert>

        <UButton
          block
          size="lg"
          color="neutral"
          variant="outline"
          to="/auth/login"
          class="font-medium"
        >
          <UIcon name="i-heroicons-arrow-left" class="mr-2 h-4 w-4" />
          Back to login
        </UButton>
      </div>

      <!-- Form State -->
      <UForm
        v-else
        :state="state"
        :schema="schema"
        class="space-y-4"
        @submit="handleForgotPassword"
      >
        <!-- Error Alert -->
        <UAlert
          v-if="errorMessage"
          color="error"
          variant="soft"
          icon="i-heroicons-exclamation-triangle"
          :title="errorMessage"
          :close-button="{ icon: 'i-heroicons-x-mark', color: 'error', variant: 'link' }"
          @close="errorMessage = ''"
        />

        <UFormField label="Email address" name="email" required>
          <UInput
            v-model="state.email"
            type="email"
            size="lg"
            autocomplete="email"
            placeholder="you@example.com"
            :disabled="isLoading"
            class="w-full"
          />
        </UFormField>

        <UButton
          type="submit"
          block
          size="lg"
          color="primary"
          :loading="isLoading"
          :disabled="isLoading"
          class="mt-6 font-semibold"
        >
          Send reset link
        </UButton>
      </UForm>
    </div>

    <template #footer>
      <p class="text-center text-sm text-slate-600">
        Remember your password?
        <NuxtLink
          to="/auth/login"
          class="font-semibold text-primary-600 hover:text-primary-700"
        >
          Sign in
        </NuxtLink>
      </p>
    </template>
  </AuthCard>
</template>

