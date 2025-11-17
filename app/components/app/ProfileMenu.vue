<script setup>
// ===============================
// Auth Handling
// ===============================
const {loggedIn, user, clear,  fetch} = useUserSession()


onMounted(async () => {
  await fetch()
})


watch(() => useRoute().fullPath, async () => {
  await fetch()
})

const roleLabel = computed(() => (user.value?.role === 'admin' ? 'Admin' : 'Student'))

const menuItems = computed(() => {
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
    }
  ]
  if (user.value?.role === 'admin') {
    baseItems.unshift(
      {
        label: 'Admin • Courses',
        icon: 'i-heroicons-academic-cap',
        to: '/admin/courses'
      },
      {
        label: 'Admin • Pages',
        icon: 'i-heroicons-document-text',
        to: '/admin/pages'
      }
    )
  }

  baseItems.push({
    label: 'Logout',
    icon: 'hugeicons:logout-04',
    onClick: async () => {
      await clear()
      await navigateTo('/')
    }
  })

  return baseItems
})



</script>

<template>
 <div class="">
  <u-dropdown-menu v-if="loggedIn" size="sm"
      arrow
      :items="menuItems"
      :ui="{
      content: 'w-48'
    }"
  >
    <u-user
      :name="user?.name"
        :description="roleLabel"
        :avatar="{
       icon: 'hugeicons:user'
    }"
    />
  </u-dropdown-menu>

  <u-button v-else
      color="primary"
      size="xl"
      class="rounded-full py-3 px-6"
      to="/auth/login"
  >
    {{'Students Login' }}
  </u-button>

</div>


</template>

<style scoped>

</style>
