<script setup>
definePageMeta({middleware: ["auth"]})

const items = [
  {
    label: 'Home',
    to: '/account'
  },
  {
    label: 'Student Profile',
  }
]

const user = useDirectusUser();
const currentUserId = computed(() => user.value?.id);

const { getItems, createItems, updateItem } = useDirectusItems();

// ===============================
// Check if student profile exists
// ===============================
const studentProfile = ref(null);
const isFirstTime = ref(false);
const isLoading = ref(true);

onMounted(async () => {
  try {
    const students = await getItems({
      collection: 'students',
      params: {
        filter: {
          user_id: {
            _eq: currentUserId.value
          }
        }
      }
    });

    if (students && students.length > 0) {
      studentProfile.value = students[0];
      isFirstTime.value = false;
    } else {
      isFirstTime.value = true;
    }
  } catch (err) {
    console.error('Error fetching student profile:', err);
  } finally {
    isLoading.value = false;
  }
});

// ===============================
// Dropdown Options
// ===============================
const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Suspended', value: 'suspended' }
];

const timezoneOptions = [
  { label: 'UTC', value: 'UTC' },
  { label: 'America/New_York (EST)', value: 'America/New_York' },
  { label: 'America/Chicago (CST)', value: 'America/Chicago' },
  { label: 'America/Los_Angeles (PST)', value: 'America/Los_Angeles' },
  { label: 'Europe/London (GMT)', value: 'Europe/London' },
  { label: 'Europe/Paris (CET)', value: 'Europe/Paris' },
  { label: 'Asia/Dubai (GST)', value: 'Asia/Dubai' },
  { label: 'Asia/Riyadh (AST)', value: 'Asia/Riyadh' },
  { label: 'Asia/Cairo (EET)', value: 'Asia/Cairo' },
  { label: 'Asia/Tokyo (JST)', value: 'Asia/Tokyo' }
];

const genderOptions = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
];

const arabicLevelOptions = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Elementary', value: 'elementary' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
  { label: 'Native', value: 'native' }
];

// ===============================
// Reactive State
// ===============================
const state = reactive({
  status: studentProfile.value?.status || 'active',
  sort: studentProfile.value?.sort || '',
  timezone: studentProfile.value?.timezone || 'UTC',
  gender: studentProfile.value?.gender || '',
  age: studentProfile.value?.age || '',
  country: studentProfile.value?.country || '',
  refered_by: studentProfile.value?.refered_by || '',
  bio: studentProfile.value?.bio || '',
  notes: studentProfile.value?.notes || '',
  phone: studentProfile.value?.phone || '',
  arabic_level: studentProfile.value?.arabic_level || '',
});

// Watch studentProfile changes and update state
watch(studentProfile, (newProfile) => {
  if (newProfile) {
    state.status = newProfile.status || 'active';
    state.sort = newProfile.sort || '';
    state.timezone = newProfile.timezone || 'UTC';
    state.gender = newProfile.gender || '';
    state.age = newProfile.age || '';
    state.country = newProfile.country || '';
    state.refered_by = newProfile.refered_by || '';
    state.bio = newProfile.bio || '';
    state.notes = newProfile.notes || '';
    state.phone = newProfile.phone || '';
    state.arabic_level = newProfile.arabic_level || '';
  }
});

const errorMessage = ref('');
const successMessage = ref('');
const isSaving = ref(false);

// ===============================
// Form Submission
// ===============================
const handleSubmit = async (event) => {
  errorMessage.value = '';
  successMessage.value = '';
  isSaving.value = true;

  const formData = event?.data ?? state;

  try {
    if (isFirstTime.value) {
      // Create new student profile
      const newStudent = await createItems({
        collection: 'students',
        items: [{
          user_id: currentUserId.value,
          // status: formData.status,
          // sort: formData.sort,
          // timezone: formData.timezone,
          // gender: formData.gender,
          // age: formData.age,
          // country: formData.country,
          // refered_by: formData.refered_by,
          // bio: formData.bio,
          // notes: formData.notes,
          // phone: formData.phone,
          // arabic_level: formData.arabic_level,
        }]
      });

      studentProfile.value = newStudent[0];
      isFirstTime.value = false;
      successMessage.value = 'Student profile created successfully!';
    } else {
      // Update existing student profile
      await updateItem({
        collection: 'students',
        id: studentProfile.value.id,
        item: {
          status: formData.status,
          sort: formData.sort,
          timezone: formData.timezone,
          gender: formData.gender,
          age: formData.age,
          country: formData.country,
          refered_by: formData.refered_by,
          bio: formData.bio,
          notes: formData.notes,
          phone: formData.phone,
          arabic_level: formData.arabic_level,
        }
      });

      successMessage.value = 'Student profile updated successfully!';
    }

    // Clear success message after 3 seconds
    setTimeout(() => {
      successMessage.value = '';
    }, 3000);
  } catch (err) {
    errorMessage.value = err?.data?.message || err?.message || 'Failed to save profile. Please try again.';
  } finally {
    isSaving.value = false;
  }
}
</script>

<template>
  <section>

    <div class="pages py-10 border-b border-gray-200 bg-white mb-6">
      <u-container>
        <u-breadcrumb class="mb-4" :items="items"/>
        <base-heading is="h1">{{ isFirstTime ? 'Complete Your Student Profile' : 'Student Profile' }}</base-heading>
      </u-container>
    </div>

    <u-container>
      <div class="grid lg:grid-cols-12 gap-6">
        <user-navigation/>

        <div class="flex-1 lg:col-span-9 space-y-6">
          
          <!-- Loading State -->
          <u-card v-if="isLoading">
            <div class="flex items-center justify-center py-12">
              <u-icon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary-500"/>
            </div>
          </u-card>

          <!-- Student Profile Form -->
          <u-card v-else>
            <template #header>
              <div class="space-y-1">
                <h2 class="text-xl font-semibold">
                  {{ isFirstTime ? 'Create Student Profile' : 'Edit Student Profile' }}
                </h2>
                <p class="text-sm text-gray-500">
                  {{ isFirstTime ? 'Please complete your student profile to continue.' : 'Update your student information.' }}
                </p>
              </div>
            </template>

            <u-form
              :state="state"
              class="space-y-5"
              @submit.prevent="handleSubmit"
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

              <!-- Personal Information Section -->
              <div class="space-y-4">
                <h3 class="text-lg font-semibold text-gray-900">Personal Information</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <u-form-field label="Gender" name="gender">
                    <u-select
                      v-model="state.gender"
                      :items="genderOptions"
                      class="w-full"
                      size="xl"
                      placeholder="Select gender"
                    />
                  </u-form-field>

                  <u-form-field label="Age" name="age">
                    <u-input
                      v-model="state.age"
                      class="w-full"
                      size="xl"
                      type="number"
                      placeholder="Enter your age"
                    />
                  </u-form-field>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <u-form-field label="Country" name="country">
                    <u-input
                      v-model="state.country"
                      class="w-full"
                      size="xl"
                      type="text"
                      placeholder="Enter your country"
                    />
                  </u-form-field>

                  <u-form-field label="Phone" name="phone">
                    <u-input
                      v-model="state.phone"
                      class="w-full"
                      size="xl"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                    />
                  </u-form-field>
                </div>

                <u-form-field label="Timezone" name="timezone">
                  <u-select
                    v-model="state.timezone"
                    :items="timezoneOptions"
                    class="w-full"
                    size="xl"
                    placeholder="Select timezone"
                  />
                </u-form-field>
              </div>

              <!-- Learning Information Section -->
              <div class="space-y-4">
                <h3 class="text-lg font-semibold text-gray-900">Learning Information</h3>
                
                <u-form-field label="Arabic Level" name="arabic_level">
                  <u-select
                    v-model="state.arabic_level"
                    :items="arabicLevelOptions"
                    class="w-full"
                    size="xl"
                    placeholder="Select your Arabic level"
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
              </div>

              <!-- Additional Information Section -->
              <div class="space-y-4">
                <h3 class="text-lg font-semibold text-gray-900">Additional Information</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <u-form-field label="Status" name="status">
                    <u-select
                      v-model="state.status"
                      :items="statusOptions"
                      class="w-full"
                      size="xl"
                      placeholder="Select status"
                    />
                  </u-form-field>

                  <u-form-field label="Sort Order" name="sort">
                    <u-input
                      v-model="state.sort"
                      class="w-full"
                      size="xl"
                      type="number"
                      placeholder="Enter sort order"
                    />
                  </u-form-field>
                </div>

                <u-form-field label="Referred By" name="refered_by">
                  <u-input
                    v-model="state.refered_by"
                    class="w-full"
                    size="xl"
                    type="text"
                    placeholder="Who referred you?"
                  />
                </u-form-field>

                <u-form-field label="Notes" name="notes">
                  <u-textarea
                    v-model="state.notes"
                    class="w-full"
                    size="xl"
                    :rows="4"
                    placeholder="Additional notes..."
                  />
                </u-form-field>
              </div>

              <div class="flex justify-end pt-4">
                <u-button
                  size="xl"
                  type="submit"
                  color="primary"
                  :loading="isSaving"
                  :disabled="isSaving"
                >
                  {{ isFirstTime ? 'Create Profile' : 'Update Profile' }}
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
