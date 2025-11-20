<script setup>
const {getItems} = useDirectusItems();

const certificates = [
  {
    "title": "Excellence in Healthcare Award",
    "source": "Stanford University",
    "year": "2022",
    "image": "/images/banners/testimonial-bg-01.jpg",
    "link": "/"
  },
  {
    "title": "Patient Care Excellence Award",
    "source": "Mayo Clinic",
    "year": "2012",
    "image": "/images/banners/testimonial-bg-01.jpg",
    "link": "/"
  }
]

const {data: plans} = await useAsyncData("plans", () => getItems({
  collection: 'plans',
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
