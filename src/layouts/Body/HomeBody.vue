<script setup lang="ts">
import Carousel from './Home/Carousel.vue'
import Categories from './Home/Categories.vue'
import SpecialDeal from './Home/SpecialDeal.vue'
import ProductCarousel from './Home/ProductCarousel.vue'
import NewAndHotProduction from './Home/NewAndHotProduction.vue'
import Subscription from './Home/Subscription.vue'
</script>

<template>
  <div>
    <Carousel class="mb-6" />
    <Categories class="mb-6" />
    <SpecialDeal class="mb-6" />
    <ProductCarousel class="mb-6" />
    <NewAndHotProduction class="mb-6" />
    <Subscription />
  </div>
</template>

<style scoped lang="scss"></style>
