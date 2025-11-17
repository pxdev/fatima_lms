<script setup>
const pricing = [
  {
    "id": 1,
    "name": "Lite",
    "price": "20",
    "period": "month",
    "description": "Essential healthcare services for individuals",
    "features": ["1 Weekly lessons", "4 Lessons / Month ", "45 min one to one Session"],
    "isPopular": false,
    "link": "/booking/basic"
  },
  {
    "id": 2,
    "name": "Regular",
    "price": "40",
    "period": "month",
    "description": "Comprehensive healthcare with additional benefits",
    "features": ["2 Weekly lessons", "8 Lessons / Month ", "45 min one to one Session"],
    "isPopular": true,
    "link": "/booking/premium"
  },
  {
    "id": 3,
    "name": "Premium",
    "price": "70",
    "period": "month",
    "description": "Complete healthcare coverage for the whole family",
    "features": ["4 Weekly lessons", "16 Lessons / Month ", "45 min one to one Session", "Recordings Available"],
    "isPopular": false,
    "link": "/booking/family"
  }
]

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

const { $directus, $readItems } = useNuxtApp()

const { data } = await useAsyncData('post', async () => {
  try {
    return await $directus.request(
        $readItems('courses')
    )
  } catch (error) {
    console.error(error)
  }
})


</script>

<template>
  <main class="h-full">

    <debug>{{data}}</debug>

     <main-banner />
    <pricing-table :data="pricing" />
    <portfolio :data="certificates" />
   </main>
</template>

<style scoped></style>
