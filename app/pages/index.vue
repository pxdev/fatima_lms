<script setup>


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

const {$directus, $readItems} = useNuxtApp()

const {data: plans} = await useAsyncData('plans', async () => {
  try {
    return await $directus.request(
        $readItems('plans')
    )
  } catch (error) {
    console.error(error)
  }
})

const {data: courses} = await useAsyncData('courses', async () => {
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
    <main-banner/>
    <pricing-table :data="plans" :courses="courses"/>
    <portfolio :data="certificates"/>
  </main>
</template>

<style scoped></style>
