<script setup lang="ts">
// Swiper、SwiperSlide 元件
import { Swiper, SwiperSlide } from 'swiper/vue'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'

// 模組
import { Autoplay, Grid, Navigation, Pagination } from 'swiper/modules'

// 基本樣式與模組的樣式
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/autoplay'
import 'swiper/css/grid'

import carol1 from '@/assets/CategoryCarousel_Images/carol_1547383616723.jpg'
import carol2 from '@/assets/CategoryCarousel_Images/carol_1547383646743.jpg'
import carol3 from '@/assets/CategoryCarousel_Images/carol_1547383672400.jpg'
import carol4 from '@/assets/CategoryCarousel_Images/carol_1547383712130.jpg'
import carol5 from '@/assets/CategoryCarousel_Images/carol_1547383726339.jpg'
import carol6 from '@/assets/CategoryCarousel_Images/carol_1547383737063.jpg'
import carol7 from '@/assets/CategoryCarousel_Images/carol_1547383749908.jpg'
import carol8 from '@/assets/CategoryCarousel_Images/carol_1547383760395.jpg'
import carol9 from '@/assets/CategoryCarousel_Images/carol_1547383770961.jpg'
import carol10 from '@/assets/CategoryCarousel_Images/carol_1547383796345.jpg'
import carol11 from '@/assets/CategoryCarousel_Images/carol_1547383785733.jpg'
import carol12 from '@/assets/CategoryCarousel_Images/carol_1547383824144.jpg'

const modules = ref([Navigation, Pagination, Grid, Autoplay])

const products = reactive([
  { name: '商品名稱', category: '類別', imageUrl: carol1 },
  { name: '商品名稱2', category: '類別2', imageUrl: carol2 },
  { name: '商品名稱3', category: '類別3', imageUrl: carol3 },
  { name: '商品名稱4', category: '類別4', imageUrl: carol4 },
  { name: '商品名稱5', category: '類別5', imageUrl: carol5 },
  { name: '商品名稱6', category: '類別6', imageUrl: carol6 },
  { name: '商品名稱7', category: '類別7', imageUrl: carol7 },
  { name: '商品名稱8', category: '類別8', imageUrl: carol8 },
  { name: '商品名稱9', category: '類別9', imageUrl: carol9 },
  { name: '商品名稱10', category: '類別10', imageUrl: carol10 },
  { name: '商品名稱11', category: '類別11', imageUrl: carol11 },
  { name: '商品名稱12', category: '類別12', imageUrl: carol12 },
])

const breakpoints = useBreakpoints(breakpointsTailwind)

const mdAndLarger = breakpoints.greaterOrEqual('md')
const lgAndLarger = breakpoints.greaterOrEqual('lg')
const slidesPerView = computed(() => {
  if (lgAndLarger.value) { return 3 }
  if (mdAndLarger.value) { return 2 }
  return 1
})
</script>

<template>
  <div>
    <Swiper :slides-per-view="slidesPerView" :space-between="17" :modules="modules" :grid="{
      rows: 2,
      fill: 'row',
    }" :autoplay="{
      delay: 2000,
      disableOnInteraction: true,
    }">
      <SwiperSlide v-for="{ name, category, imageUrl } in products" :key="name">
        <div class="slide" :style="{ backgroundImage: `url(${imageUrl})` }">
          <span class="tittle">
            {{ category }}
          </span>
          <div class="overlay">
            {{ name }}
          </div>
        </div>
      </SwiperSlide>
    </Swiper>
  </div>
</template>

<style scoped lang="scss">
.slide {
  background: #fff;
  height: 248px;
  position: relative;
  overflow: hidden;
  border-radius: 4px;
  border: var(--third-color) solid 1px;
}

span {
  display: inline-block;
  padding: 4px;
  background-color: var(--third-color);
  color: #fff;
  text-shadow: 1px 1px 1px #ccc;
  line-height: 1.5;
}

.overlay {
  &:hover {
    opacity: 1;
  }

  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(52, 58, 64, 0.5);
  opacity: 0;
  transition: all 0.3s ease;
  color: #fff;
  font-size: 1.5rem;
  letter-spacing: 0.2rem;
}
</style>
