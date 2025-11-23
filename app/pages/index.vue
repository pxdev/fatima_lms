<script setup>
const {getItems} = useDirectusItems();

const {data: plans} = await useAsyncData("plans", () => getItems({
  collection: 'plans',
}))

const {data: certificates} = await useAsyncData("portfolio", () => getItems({
  collection: 'portfolio',
}))

const {data: courses} = await useAsyncData("courses", () => getItems({
  collection: 'courses',
}))


const {data: subscription_sessions} = await useAsyncData("subscription_sessions", () => getItems({
  collection: 'subscription_sessions',
}))


</script>

<template>
  <main class="h-full">

    <main-banner/>
    <pricing-table :data="plans" :courses="courses"/>
    <portfolio :data="certificates"/>
  </main>
</template>

<style scoped></style>
