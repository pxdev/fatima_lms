<script setup>
const {getItems} = useDirectusItems();

const {data: plans} = await useAsyncData("plans", () => getItems({
  collection: 'plans',
}).catch(err => {
  console.warn('Failed to load plans:', err)
  return []
}))

const {data: certificates} = await useAsyncData("portfolio", () => getItems({
  collection: 'portfolio',
}).catch(err => {
  console.warn('Failed to load portfolio:', err)
  return []
}))

const {data: courses} = await useAsyncData("courses", () => getItems({
  collection: 'courses',
  params: {
    filter: {
      is_active: { _eq: true }
    },
    sort: ['sort']
  }
}).catch(err => {
  console.warn('Failed to load courses:', err)
  return []
}))


</script>

<template>
  <main class="h-full">
    <main-banner/>
    <free-trial-section/>
    <pricing-table :data="plans" :courses="courses"/>
    <portfolio :data="certificates"/>
  </main>
</template>

<style scoped></style>
