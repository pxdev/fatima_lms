<script setup lang="ts">
import { z } from 'zod'

definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

useSeoMeta({
  title: 'Edit Profile',
  description: 'Update your profile information'
})

// ===============================
// Composables
// ===============================
const { profile, isLoading, error, isTeacher, fetchProfile, updateProfile } = useProfile()

// ===============================
// Timezones list
// ===============================
const timezones = [
  { value: 'Asia/Riyadh', label: 'Asia/Riyadh (GMT+3)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GMT+4)' },
  { value: 'Asia/Kuwait', label: 'Asia/Kuwait (GMT+3)' },
  { value: 'Asia/Qatar', label: 'Asia/Qatar (GMT+3)' },
  { value: 'Asia/Bahrain', label: 'Asia/Bahrain (GMT+3)' },
  { value: 'Africa/Cairo', label: 'Africa/Cairo (GMT+2)' },
  { value: 'Europe/London', label: 'Europe/London (GMT+0)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (GMT+1)' },
  { value: 'America/New_York', label: 'America/New_York (GMT-5)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (GMT-8)' },
  { value: 'Asia/Karachi', label: 'Asia/Karachi (GMT+5)' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (GMT+5:30)' },
  { value: 'Asia/Jakarta', label: 'Asia/Jakarta (GMT+7)' },
  { value: 'Asia/Kuala_Lumpur', label: 'Asia/Kuala_Lumpur (GMT+8)' },
]

// ===============================
// Validation Schema
// ===============================
const schema = z.object({
  display_name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional().nullable(),
  timezone: z.string().min(1, 'Please select a timezone'),
  bio: z.string().optional().nullable(),
  languages: z.string().optional().nullable()
})

type ProfileForm = z.infer<typeof schema>

// ===============================
// Reactive State
// ===============================
const state = reactive<ProfileForm>({
  display_name: '',
  phone: '',
  timezone: 'Asia/Riyadh',
  bio: '',
  languages: ''
})

const successMessage = ref('')
const formError = ref('')

// ===============================
// Fetch profile on mount
// ===============================
onMounted(async () => {
  await fetchProfile()
  
  if (profile.value) {
    state.display_name = profile.value.display_name || ''
    state.phone = profile.value.phone || ''
    state.timezone = profile.value.timezone || 'Asia/Riyadh'
    state.bio = profile.value.bio || ''
    state.languages = profile.value.languages || ''
  }
})

// ===============================
// Throttled Form Submission
// ===============================
const { execute: throttledSubmit, isLoading: isSaving } = useThrottledAction(
  async () => {
    await doSubmit()
  },
  { throttleMs: 1000 }
)

async function doSubmit() {
  successMessage.value = ''
  formError.value = ''

  try {
    const { display_name, phone, timezone, bio, languages } = state

    const updated = await updateProfile({
      display_name,
      phone: phone || null,
      timezone,
      bio: bio || null,
      languages: languages?.trim() || null
    })

    if (updated) {
      successMessage.value = 'Profile updated successfully!'
      // Refetch profile to ensure all pages get the updated timezone
      await fetchProfile()
    }
  } catch (err: any) {
    console.error('Error saving profile:', err)
    formError.value = err?.message || 'Failed to save profile'
  }
}

function handleSubmit() {
  throttledSubmit()
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-slate-900">Edit Profile</h1>
      <p class="mt-1 text-sm text-slate-500">Update your personal information</p>
    </div>

    <!-- Loading State -->
    <UCard v-if="isLoading" class="space-y-4">
        <USkeleton class="h-10 w-full" />
        <USkeleton class="h-10 w-full" />
        <USkeleton class="h-10 w-full" />
        <USkeleton class="h-10 w-1/3" />
      </UCard>

      <!-- Error State -->
      <UAlert
        v-else-if="error && !profile"
        color="error"
        variant="soft"
        icon="i-heroicons-exclamation-triangle"
        :title="error"
        class="mb-6"
      />

      <!-- Profile Form -->
      <UCard v-else-if="profile">
        <UForm
          :state="state"
          :schema="schema"
          class="space-y-6"
          @submit="handleSubmit"
        >
          <!-- Success Message -->
          <UAlert
            v-if="successMessage"
            color="success"
            variant="soft"
            icon="i-heroicons-check-circle"
            :title="successMessage"
            :close-button="{ icon: 'i-heroicons-x-mark', color: 'success', variant: 'link' }"
            @close="successMessage = ''"
          />

          <!-- Error Message -->
          <UAlert
            v-if="error || formError"
            color="error"
            variant="soft"
            icon="i-heroicons-exclamation-triangle"
            :title="error || formError"
            :close-button="{ icon: 'i-heroicons-x-mark', color: 'error', variant: 'link' }"
            @close="formError = ''"
          />

          <!-- Display Name -->
          <UFormField label="Display Name" name="display_name" required>
            <UInput
              v-model="state.display_name"
              size="lg"
              placeholder="Your name"
              :disabled="isSaving"
              class="w-full"
            />
          </UFormField>

          <!-- Phone -->
          <UFormField label="Phone Number" name="phone">
            <UInput
              v-model="state.phone"
              size="lg"
              type="tel"
              placeholder="+966 5XX XXX XXXX"
              :disabled="isSaving"
              class="w-full"
            />
          </UFormField>

          <!-- Timezone -->
          <UFormField label="Timezone" name="timezone" required>
            <USelect
              v-model="state.timezone"
              :items="timezones"
              value-key="value"
              label-key="label"
              size="lg"
              placeholder="Select timezone"
              :disabled="isSaving"
              class="w-full"
            />
          </UFormField>

          <!-- Languages -->
          <UFormField label="Languages" name="languages">
            <template #hint>
              <span class="text-xs">Comma-separated (e.g., English, Arabic)</span>
            </template>
            <UInput
              v-model="state.languages"
              size="lg"
              placeholder="English, Arabic, French"
              :disabled="isSaving"
              class="w-full"
            />
          </UFormField>

          <!-- Bio (Teachers only) -->
          <UFormField v-if="isTeacher" label="Bio" name="bio">
            <template #hint>
              <span class="text-xs">Tell students about yourself</span>
            </template>
            <UTextarea
              v-model="state.bio"
              size="lg"
              placeholder="Write a short bio about yourself, your experience, and teaching style..."
              :rows="4"
              :disabled="isSaving"
              class="w-full"
            />
          </UFormField>

          <!-- Role Badge (Read-only) -->
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-slate-700">Role:</span>
            <UBadge
              :color="profile.role === 'admin' ? 'error' : profile.role === 'teacher' ? 'primary' : 'neutral'"
              variant="soft"
            >
              {{ profile.role }}
            </UBadge>
          </div>

          <!-- Submit Button -->
          <div class="flex justify-end gap-3 pt-4">
            <UButton
              color="neutral"
              variant="outline"
              to="/account"
              :disabled="isSaving"
            >
              Cancel
            </UButton>
            <UButton
              type="submit"
              color="primary"
              :loading="isSaving"
              :disabled="isSaving"
            >
              Save Changes
            </UButton>
          </div>
        </UForm>
      </UCard>
  </div>
</template>
