<script setup lang="ts">
import { z } from 'zod'

const { resetPassword } = useDirectusAuth()
const route = useRoute()

// ===============================
// Get token from URL
// ===============================
const token = computed(() => route.query.token as string || '')

// ===============================
// Validation Schema
// ===============================
const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirm: z.string().min(8, 'Please confirm your password')
}).refine((data) => data.password === data.password_confirm, {
  message: 'Passwords do not match',
  path: ['password_confirm']
})

type ResetForm = z.infer<typeof schema>

// ===============================
// Reactive State
// ===============================
const state = reactive<ResetForm>({
  password: '',
  password_confirm: ''
})

const errorMessage = ref('')
const isSubmitted = ref(false)
const isTokenInvalid = ref(false)

// ===============================
// Check token on mount
// ===============================
onMounted(() => {
  if (!token.value) {
    isTokenInvalid.value = true
  }
})

// ===============================
// Throttled Form Submission
// ===============================
const { execute: throttledReset, isLoading } = useThrottledAction(
  async () => {
    await doResetPassword()
  },
  { throttleMs: 2000 }
)

async function doResetPassword() {
  errorMessage.value = ''

  const { password } = state

  try {
    await resetPassword({
      token: token.value,
      password
    })

    isSubmitted.value = true
  } catch (err: any) {
    // Handle specific error cases
    if (err?.message?.includes('expired') || err?.message?.includes('invalid')) {
      errorMessage.value = 'This reset link has expired or is invalid. Please request a new one.'
      isTokenInvalid.value = true
    } else {
      errorMessage.value = err?.data?.message || err?.message || 'Failed to reset password. Please try again.'
    }
  }
}

function handleResetPassword() {
  throttledReset()
}
</script>

<template>
  <AuthCard
    title="Reset password"
    subtitle="Enter your new password below"
  >
    <div class="space-y-6">
      <!-- Invalid/Expired Token State -->
      <div v-if="isTokenInvalid && !isSubmitted" class="space-y-6">
        <div class="flex justify-center">
          <div class="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <UIcon name="i-heroicons-exclamation-triangle" class="h-8 w-8 text-amber-600" />
          </div>
        </div>

        <div class="text-center">
          <h3 class="text-lg font-semibold text-slate-900">Invalid or expired link</h3>
          <p class="mt-2 text-sm text-slate-500">
            This password reset link is no longer valid. Please request a new one.
          </p>
        </div>

        <UButton
          block
          size="lg"
          color="primary"
          to="/auth/forgot-password"
          class="font-semibold"
        >
          Request new link
        </UButton>
      </div>

      <!-- Success State -->
      <div v-else-if="isSubmitted" class="space-y-6">
        <div class="flex justify-center">
          <div class="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
            <UIcon name="i-heroicons-check-circle" class="h-8 w-8 text-primary-600" />
          </div>
        </div>

        <div class="text-center">
          <h3 class="text-lg font-semibold text-slate-900">Password reset successful!</h3>
          <p class="mt-2 text-sm text-slate-500">
            Your password has been changed. You can now sign in with your new password.
          </p>
        </div>

        <UButton
          block
          size="lg"
          color="primary"
          to="/auth/login"
          class="font-semibold"
        >
          Sign in
        </UButton>
      </div>

      <!-- Form State -->
      <UForm
        v-else
        :state="state"
        :schema="schema"
        class="space-y-4"
        @submit="handleResetPassword"
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

        <UFormField label="New password" name="password" required>
          <UInput
            v-model="state.password"
            type="password"
            size="lg"
            autocomplete="new-password"
            placeholder="••••••••"
            :disabled="isLoading"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Confirm new password" name="password_confirm" required>
          <UInput
            v-model="state.password_confirm"
            type="password"
            size="lg"
            autocomplete="new-password"
            placeholder="••••••••"
            :disabled="isLoading"
            class="w-full"
          />
        </UFormField>

        <!-- Password requirements hint -->
        <div class="rounded-lg bg-slate-50 p-3">
          <p class="text-xs font-medium text-slate-600">Password must:</p>
          <ul class="mt-1 space-y-1 text-xs text-slate-500">
            <li class="flex items-center gap-2">
              <UIcon
                :name="state.password.length >= 8 ? 'i-heroicons-check-circle' : 'i-heroicons-minus-circle'"
                :class="state.password.length >= 8 ? 'text-primary-500' : 'text-slate-300'"
                class="h-4 w-4"
              />
              Be at least 8 characters
            </li>
          </ul>
        </div>

        <UButton
          type="submit"
          block
          size="lg"
          color="primary"
          :loading="isLoading"
          :disabled="isLoading"
          class="mt-6 font-semibold"
        >
          Reset password
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

