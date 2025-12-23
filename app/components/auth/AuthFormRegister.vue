<script setup lang="ts">
import { z } from 'zod'

const { createUser, login } = useDirectusAuth()
const user = useDirectusUser()

// ===============================
// Validation Schema
// ===============================
const schema = z.object({
  display_name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirm: z.string().min(8, 'Please confirm your password')
}).refine((data) => data.password === data.password_confirm, {
  message: 'Passwords do not match',
  path: ['password_confirm']
})

type RegisterForm = z.infer<typeof schema>

// ===============================
// Reactive State
// ===============================
const state = reactive<RegisterForm>({
  display_name: '',
  email: '',
  password: '',
  password_confirm: ''
})

const errorMessage = ref('')
const successMessage = ref('')

// ===============================
// Throttled Form Submission
// ===============================
const { execute: throttledRegister, isLoading } = useThrottledAction(
  async () => {
    await doRegister()
  },
  { throttleMs: 2000 } // Longer throttle for registration
)

async function doRegister() {
  errorMessage.value = ''
  successMessage.value = ''

  const { display_name, email, password } = state
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Riyadh'

  try {
    // Step 1: Create user in Directus (NO $fetch - use nuxt-directus composable)
    // Note: createUser only accepts email/password, profile data stored separately
    await createUser({ email, password })

    // Step 2: Auto-login after registration to get user session
    await login({ email, password })

    // Step 3: Get user ID from the authenticated session
    // Wait a tick for the user ref to update
    await nextTick()
    
    const directus_user_id = user.value?.id

    if (!directus_user_id) {
      throw new Error('Failed to get user ID after login')
    }

    // Step 4: Create profile via server route (MANDATORY)
    const profileResponse = await $fetch('/api/auth/create-profile', {
      method: 'POST',
      body: {
        directus_user_id,
        display_name,
        timezone,
        role: 'student'
      }
    })

    if (!profileResponse?.profile_id) {
      console.warn('Profile creation response missing profile_id')
    }

    successMessage.value = 'Account created successfully! Redirecting...'
    
    // Redirect to student onboarding
    await navigateTo('/student/onboarding/course', { replace: true })
  } catch (err: any) {
    // Handle specific error cases
    if (err?.data?.message?.includes('unique') || err?.message?.includes('already exists')) {
      errorMessage.value = 'An account with this email already exists.'
    } else {
      errorMessage.value = err?.data?.message || err?.message || 'Registration failed. Please try again.'
    }
  }
}

function handleRegister() {
  throttledRegister()
}
</script>

<template>
  <AuthCard
    title="Create your account"
    subtitle="Start your learning journey today"
  >
    <div class="space-y-6">
      <!-- Register Form -->
      <UForm
        :state="state"
        :schema="schema"
        class="space-y-4"
        @submit="handleRegister"
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

        <UFormField label="Full name" name="display_name" required>
          <UInput
            v-model="state.display_name"
            type="text"
            size="lg"
            autocomplete="name"
            placeholder="John Doe"
            :disabled="isLoading"
            class="w-full"
          />
        </UFormField>

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

        <UFormField label="Confirm password" name="password_confirm" required>
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

        <!-- Terms notice -->
        <p class="text-xs text-slate-500">
          By creating an account, you agree to our
          <NuxtLink to="/terms" class="text-primary-600 hover:underline">Terms of Service</NuxtLink>
          and
          <NuxtLink to="/privacy" class="text-primary-600 hover:underline">Privacy Policy</NuxtLink>.
        </p>

        <UButton
          type="submit"
          block
          size="lg"
          color="primary"
          :loading="isLoading"
          :disabled="isLoading"
          class="mt-6 font-semibold"
        >
          Create account
        </UButton>
      </UForm>
    </div>

    <template #footer>
      <p class="text-center text-sm text-slate-600">
        Already have an account?
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

