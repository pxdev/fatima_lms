<script setup>
import {z} from "zod"
const { login, loginWithProvider } = useDirectusAuth();


 const schema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

const state = reactive({
  email: '',
  password: ''
});

const errorMessage = ref('');
const isLoading = ref(false);

const handleLogin = async (event) => {
  errorMessage.value = '';
  isLoading.value = true;
  const {email, password} = event.data;
  try {
    await login({ email: email, password: password })
    navigateTo('/account', { replace: true });
  } catch (err) {
    errorMessage.value = err?.data?.message || err?.message || 'Login failed. Please try again.';
  } finally {
    isLoading.value = false;
  }
}


// watch($isAuthenticated, (isLogged) => {
//   if (isLogged) {
//     navigateTo('/account', {replace: true})
//   }
// }, {immediate: true})


</script>

<template>


  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">

    <u-card class="w-full max-w-md">
      <template #header>
        <div class="space-y-1">
          <h1 class="text-2xl font-semibold">Welcome back</h1>
          <p class="text-sm">Sign in to continue to your account.</p>
        </div>
      </template>


      <div class="pb-8 pt-4">
        <u-button
            class="w-full" icon="material-icon-theme:google" color="neutral" block size="xl" variant="outline" @click="loginWithProvider('google')">Login With Google
        </u-button>
      </div>

      <u-separator label="OR" class="mb-6"/>

      <u-form :state="state" :schema="schema" class="space-y-5" @submit.prevent="handleLogin">
        <u-alert
            v-if="errorMessage"
            color="error"
            icon="i-heroicons-exclamation-triangle"
            :title="errorMessage"
        />

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
              type="password"
              size="xl"
              autocomplete="current-password"
              placeholder="********"
          />
        </u-form-field>

        <u-button size="xl" type="submit" color="primary" block :loading="isLoading" :disabled="isLoading">
          Login
        </u-button>
      </u-form>

      <template #footer>
        <p class="text-center text-sm ">
          Don't have an account?
          <nuxt-link to="/auth/register" class="font-medium text-primary hover:underline">
            Register
          </nuxt-link>
        </p>
      </template>
    </u-card>
  </div>
</template>
