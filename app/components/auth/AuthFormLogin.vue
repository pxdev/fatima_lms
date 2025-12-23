<script setup lang="ts">
import { z } from 'zod'

const { login, loginWithProvider } = useDirectusAuth()

// ===============================
// Validation Schema
// ===============================
const schema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

type LoginForm = z.infer<typeof schema>

// ===============================
// Reactive State
// ===============================
const state = reactive<LoginForm>({
  email: '',
  password: ''
})

const errorMessage = ref('')
const successMessage = ref('')

// ===============================
// Throttled Form Submission
// ===============================
const { execute: throttledLogin, isLoading } = useThrottledAction(
  async () => {
    await doLogin()
  },
  { throttleMs: 1000 }
)

const { execute: throttledGoogleLogin, isLoading: isGoogleLoading } = useThrottledAction(
  async () => {
    await doGoogleLogin()
  },
  { throttleMs: 1000 }
)

async function doLogin() {
  errorMessage.value = ''
  successMessage.value = ''

  const { email, password } = state

  try {
    await login({ email, password })
    successMessage.value = 'Login successful! Redirecting...'
    await navigateTo('/student/dashboard', { replace: true })
  } catch (err: any) {
    errorMessage.value = err?.data?.message || err?.message || 'Login failed. Please check your credentials.'
  }
}

function handleLogin() {
  throttledLogin()
}

// ===============================
// OAuth Login
// ===============================
async function doGoogleLogin() {
  errorMessage.value = ''
  
  try {
    await loginWithProvider('google')
  } catch (err: any) {
    errorMessage.value = err?.data?.message || err?.message || 'Google login failed. Please try again.'
  }
}

function handleGoogleLogin() {
  throttledGoogleLogin()
}
</script>

<template>
  <AuthCard
    title="Welcome back"
    subtitle="Sign in to continue learning"
  >
    <div class="space-y-6">
      <!-- OAuth Providers -->
      <div class="space-y-3">
        <UButton
          block
          size="lg"
          color="neutral"
          variant="outline"
          icon="i-lucide-chrome"
          :loading="isGoogleLoading"
          :disabled="isLoading || isGoogleLoading"
          class="font-medium"
          @click="handleGoogleLogin"
        >
          Continue with Google
        </UButton>
      </div>

      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-slate-200" />
        </div>
        <div class="relative flex justify-center text-xs uppercase">
          <span class="bg-white px-3 text-slate-400">or continue with email</span>
        </div>
      </div>

      <!-- Login Form -->
      <UForm
        :state="state"
        :schema="schema"
        class="space-y-4"
        @submit="handleLogin"
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

        <!-- Success Alert -->
        <UAlert
          v-if="successMessage"
          color="success"
          variant="soft"
          icon="i-heroicons-check-circle"
          :title="successMessage"
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

        <UFormField label="Password" name="password" required>
          <template #hint>
            <NuxtLink
              to="/auth/forgot-password"
              class="text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              Forgot password?
            </NuxtLink>
          </template>
          <UInput
            v-model="state.password"
            type="password"
            size="lg"
            autocomplete="current-password"
            placeholder="••••••••"
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
          :disabled="isLoading || isGoogleLoading"
          class="mt-6 font-semibold"
        >
          Sign in
        </UButton>
      </UForm>
    </div>

    <template #footer>
      <p class="text-center text-sm text-slate-600">
        Don't have an account?
        <NuxtLink
          to="/auth/register"
          class="font-semibold text-primary-600 hover:text-primary-700"
        >
          Create one
        </NuxtLink>
      </p>
    </template>
  </AuthCard>
</template>

