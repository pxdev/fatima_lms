<script setup>
// ===============================
// Auth Handling
// ===============================
const user = useDirectusUser()
const {logout} = useDirectusAuth();

const baseItems = [
  {
    label: 'Account',
    icon: 'hugeicons:user-02',
    to: 'account'
  },
  {
    label: 'Billing',
    icon: 'hugeicons:credit-card'

  },
  {
    label: 'Settings',
    icon: 'hugeicons:settings-01'
  },
  {
    label: 'Logout',
    icon: 'hugeicons:logout-01',
    color: 'danger',
    onClick: async () => {
      await logout();
      navigateTo('/');
    }
  }
]


</script>

<template>
  <div class="">

    <u-dropdown-menu
        v-if="user" size="sm"
        arrow
        :items="baseItems"
        :ui="{
      content: 'w-48'
    }"
    >
      <u-user
          :name="user?.first_name "
          :description="user?.email"
          :avatar="{
       icon: 'hugeicons:user'
    }"
      />
    </u-dropdown-menu>

    <u-button
        v-else
        color="primary"
        size="xl"
        class="rounded-full py-3 px-6"
        to="/auth/login"
    >
      {{ 'Students Login' }}
    </u-button>

  </div>


</template>

<style scoped>

</style>
