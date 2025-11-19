<script setup>
import { z } from 'zod'
const { createUser } = useDirectusAuth();
// ===============================
// Validation Schema
// ===============================
const schema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
 })

// ===============================
// Reactive State
// ===============================
const state = reactive({
  email: '',
  name: '',
  password: '',
 })

const errorMessage = ref('')
const isLoading = ref(false)


// ===============================
// Form Submission
// ===============================
const handleRegister = async (event) => {
  errorMessage.value = ''
  isLoading.value = true

  const formData = event?.data ?? state
  const { first_name, last_name , email, password } = formData

  try {
    await createUser( { email, password })

    await navigateTo('/auth/login', { replace: true })
  } catch (err) {
    errorMessage.value = err?.data?.message || err?.message || 'Registration failed. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
    <UCard class="w-full max-w-md shadow-lg">
      <!-- =============================== -->
      <!-- Header -->
      <!-- =============================== -->
      <template #header>
        <div class="space-y-1">
          <h1 class="text-2xl font-semibold">Create an account</h1>
          <p class="text-sm">Sign up to get started.</p>
        </div>
      </template>

      <!-- =============================== -->
      <!-- Form -->
      <!-- =============================== -->
      <u-form
          :state="state"
          :schema="schema"
          class="space-y-5"
          @submit.prevent="handleRegister"
      >
        <u-alert
            v-if="errorMessage"
            color="error"
            variant="soft"
            icon="i-heroicons-exclamation-triangle"
            :title="errorMessage"
        />

        <u-form-field label="Full name" name="name">
          <u-input
              v-model="state.name"
              class="w-full"
              size="xl"
              type="text"
              autocomplete="name"
              placeholder=""
          />
        </u-form-field>


        <u-form-field label="Email" name="email">
          <u-input
              v-model="state.email"
              class="w-full"
              size="xl"
              type="email"
              autocomplete="email"
              placeholder="you@example.com"
          />
        </u-form-field>

        <u-form-field label="Password" name="password">
          <u-input
              v-model="state.password"
              class="w-full"
              size="xl"
              type="password"
              autocomplete="new-password"
              placeholder="********"
          />
        </u-form-field>

        <u-button
            block
            color="primary"
            size="xl"
            type="submit"
            :loading="isLoading"
            :disabled="isLoading"
        >
          Create account
        </u-button>
      </u-form>

      <!-- =============================== -->
      <!-- Footer -->
      <!-- =============================== -->
      <template #footer>
        <p class="text-center text-sm text-gray-500">
          Already have an account?
          <nuxt-link
              to="/auth/login"
              class="font-medium text-primary hover:underline"
          >
            Login
          </nuxt-link>
        </p>
      </template>
    </UCard>
  </div>
</template>
