<script setup>
import { z } from 'zod'

definePageMeta({middleware: ["auth"]})

const items = [
  {
    label: 'Home',
    to: '/account'
  },
  {
    label: 'My Profile',
  }
]

const user = useDirectusUser();
const currentUserId = computed(() => user.value?.id);

const { getUserById, updateUser } = useDirectusUsers();
const { fetchUser, setUser } = useDirectusAuth();
const account = await getUserById({ id: currentUserId.value });
 // ===============================
// Validation Schema
// ===============================
const schema = z.object({
  first_name: z.string().trim().min(1, 'First name is required'),
  last_name: z.string().trim().optional(),
  email: z.string().trim().email('Enter a valid email address'),
  phone: z.string().trim().optional(),
  bio: z.string().trim().optional(),
});

// ===============================
// Reactive State
// ===============================
const state = reactive({
  first_name: account?.first_name || '',
  last_name: account?.last_name || '',
  email: account?.email || '',
  phone: account?.phone || '',
  bio: account?.bio || '',
});

const errorMessage = ref('');
const successMessage = ref('');
const isLoading = ref(false);

// ===============================
// Form Submission
// ===============================
const handleUpdate = async (event) => {
  errorMessage.value = '';
  successMessage.value = '';
  isLoading.value = true;

  const formData = event?.data ?? state;

  try {
    await updateUser({
      id: currentUserId.value,
      user: {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        bio: formData.bio,
      }
    });

    successMessage.value = 'Profile updated successfully!';

    // Refresh user data
    const updatedUser = await fetchUser();
    if (updatedUser.value) {
      setUser(updatedUser.value);
    }

    // Clear success message after 3 seconds
    setTimeout(() => {
      successMessage.value = '';
    }, 3000);
  } catch (err) {
    errorMessage.value = err?.data?.message || err?.message || 'Failed to update profile. Please try again.';
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <section>

    <debug>{{user}}</debug>

    <div class="pages py-10 border-b border-gray-200 bg-white mb-6">
      <u-container>
        <u-breadcrumb class="mb-4" :items="items"/>
        <base-heading is="h1">My Profile</base-heading>
      </u-container>
    </div>

    <u-container>
      <div class="grid lg:grid-cols-12 gap-6">
        <user-navigation/>

        <div class="flex-1 lg:col-span-9 space-y-6">
          <u-card>
            <template #header>
              <div class="space-y-1">
                <h2 class="text-xl font-semibold">Profile Information</h2>
                <p class="text-sm text-gray-500">Update your personal information and contact details.</p>
              </div>
            </template>

            <u-form
              :state="state"
              :schema="schema"
              class="space-y-5"
              @submit.prevent="handleUpdate"
            >
              <u-alert
                v-if="errorMessage"
                color="error"
                icon="i-heroicons-exclamation-triangle"
                :title="errorMessage"
                class="mb-4"
              />

              <u-alert
                v-if="successMessage"
                color="success"
                icon="i-heroicons-check-circle"
                :title="successMessage"
                class="mb-4"
              />

              <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <u-form-field label="First Name" name="first_name" required>
                  <u-input
                    v-model="state.first_name"
                    class="w-full"
                    size="xl"
                    type="text"
                    autocomplete="given-name"
                    placeholder="John"
                  />
                </u-form-field>

                <u-form-field label="Last Name" name="last_name">
                  <u-input
                    v-model="state.last_name"
                    class="w-full"
                    size="xl"
                    type="text"
                    autocomplete="family-name"
                    placeholder="Doe"
                  />
                </u-form-field>
              </div>

              <u-form-field label="Email" name="email" required>
                <u-input
                  v-model="state.email"
                  class="w-full"
                  size="xl"
                  type="email"
                  autocomplete="email"
                  placeholder="you@example.com"
                />
              </u-form-field>

              <u-form-field label="Phone" name="phone">
                <u-input
                  v-model="state.phone"
                  class="w-full"
                  size="xl"
                  type="tel"
                  autocomplete="tel"
                  placeholder="+1 (555) 123-4567"
                />
              </u-form-field>

              <u-form-field label="Bio" name="bio">
                <u-textarea
                  v-model="state.bio"
                  class="w-full"
                  size="xl"
                  :rows="4"
                  placeholder="Tell us about yourself..."
                />
              </u-form-field>

              <div class="flex justify-end pt-4">
                <u-button
                  size="xl"
                  type="submit"
                  color="primary"
                  :loading="isLoading"
                  :disabled="isLoading"
                >
                  Update Profile
                </u-button>
              </div>
            </u-form>
          </u-card>
        </div>
      </div>
    </u-container>
  </section>
</template>

<style scoped>

</style>
