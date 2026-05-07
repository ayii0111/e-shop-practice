<script setup lang="ts">
import Carousel from './Home/Carousel.vue'
// import CategoryBar from './Home/CategoryBar.vue'
import { CategoryBar, NewAndHotProduction, ProductCarousel, SpecialDeal, Subscription } from './Home'
</script>

<template>
  <div>
    <Carousel class="mb-6" />
    <CategoryBar class="mb-6" />
    <SpecialDeal class="mb-6" />
    <ProductCarousel class="mb-6" />
    <NewAndHotProduction class="mb-6" />
    <Subscription />
  </div>
</template>

<style scoped lang="scss"></style>
