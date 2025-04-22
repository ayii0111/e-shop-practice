<script setup lang="ts">
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay, Navigation, Pagination } from 'swiper/modules'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'

import 'swiper/css'
import 'swiper/css/autoplay'
import 'swiper/css/pagination'
import 'swiper/css/navigation'

const modules = ref([Autoplay, Pagination, Navigation])

const items = reactive([
  {
    index: 1,
    h3: 'Carol Shop',
    p: 'Carol Shop 應有盡有，歡迎您來買',
    imgUrl: '/src/assets/Carousel_Images/banner-1.ce16cf9a.jpg',
    flexPosition: 'flex-row',
  },
  {
    index: 2,
    h3: '情人節特賣會',
    p: '精選情人節禮物，等你來挑',
    imgUrl: '/src/assets/Carousel_Images/banner-2.be2f4a54.jpg',
    flexPosition: 'flex-row-reverse',
  },
  {
    index: 3,
    h3: '2025，新年快樂',
    p: '新的一年，給自己最好的',
    imgUrl: '/src/assets/Carousel_Images/banner-3.db44dc5e.jpg',
    flexPosition: 'flex-row',
  },
])

const breakpoints = useBreakpoints(breakpointsTailwind)
const mdAndLarger = breakpoints.greaterOrEqual('md')

function decideFlexPosition(index: number) {
  return computed(() => {
    if (!mdAndLarger.value) { return 'flex-col' }
    if (index % 2 === 0) { return 'flex-row-reverse' }
    return 'flex-row'
  })
}
</script>

<template>
  <div>
    <Swiper class="h-[400px] md:h-[500px]" :modules="modules" :loop="true" :slides-per-view="1" :space-between="50" navigation :pagination="{ clickable: true }" :autoplay="{ delay: 2000, disableOnInteraction: true }">
      <SwiperSlide v-for="item in items" :key="item.index" class="">
        <div class="flex h-full bg-cover bg-[50%]" :class="`${decideFlexPosition(item.index).value}`" :style="{ backgroundImage: `url(${item.imgUrl})` }">
          <div class="  m-10 border-[var(--secondary-color)] border-[3px] flex-[1.5]"></div>
          <div class=" bg-[rgba(230,223,215,0.9)]  flex flex-col items-center justify-center text-[var(--primary-text-color)] flex-1">
            <h3 class="mb-4 font-[500] leading-[24px] text-[20px]">
              {{ item.h3 }}
            </h3>
            <p class="">
              {{ item.p }}
            </p>
          </div>
        </div>
      </SwiperSlide>
    </Swiper>
  </div>
</template>

<style scoped lang="scss">
// 修改 swiper 元件的主題色
:deep() {
  --swiper-theme-color: #fff;
}

// 輪詢器的高度由輪詢容器決定，會在小裝置時高度改小
.swiper-container {
  height: 500px;
}
</style>
