<script setup lang="ts">
import { Button } from 'primevue'
import { RouterLink } from 'vue-router'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'

import news1 from '@/assets/NewAndHotProduction_Images/news-1.55745d13.jpg'
import news2 from '@/assets/NewAndHotProduction_Images/news-2.f7d3b8be.jpg'

const LRData = [
  {
    modelTitle: 'MODEL',
    modelName: 'I\'m Sophia',
    promoTitle: 'Hot Sale',
    promoSubtitle: 'Popular Products',
    promoButton: 'Go Shop',
    flexColReverse: ['flex-col'],
    imageUrl: news1,
    bgPosition: ['bg-bottom'],
    key: 1,
    path: '/productCategory/ProductList/all',
  },
  {
    modelTitle: 'MODEL',
    modelName: 'I\'m Sophia',
    promoTitle: 'Hot Sale',
    promoSubtitle: 'Popular Products',
    promoButton: 'Go Shop',
    flexColReverse: ['flex-col-reverse'],
    imageUrl: news2,
    bgPosition: ['bg-center'],
    key: 2,
    path: '/productCategory/ProductList/all',

  },
] as const
const LRBox = reactive(LRData)

const breakpoints = useBreakpoints(breakpointsTailwind)
const mdAndLarger = breakpoints.greaterOrEqual('md')

function decideFlexPosition(index: number) {
  return computed(() => {
    if (!mdAndLarger.value) { return 'flex-col' }
    if (index % 2 === 0) { return 'flex-col-reverse' }
    return 'flex-col'
  })
}
</script>

<template>
  <div class="md:gap-[30px] grid grid-cols-1 md:grid-cols-2 text-center">
    <div v-for="item in LRBox" :key="item.key" class="flex flex-auto" :class="`${decideFlexPosition(item.key).value}`">
      <!-- <div v-for="item in LRBox" :key="item.key" class="flex flex-col flex-auto"> -->
      <div class="bg-cover mb-6 py-[160px]" :class="item.bgPosition" :style="{ backgroundImage: `url(${item.imageUrl})` }">
        <h3 class="text-shadow h3">
          {{ item.modelTitle }}
        </h3>
        <h3 class="text-shadow h3">
          {{ item.modelName }}
        </h3>
      </div>
      <div class="bg-[var(--secondary-color)] mb-6 p-8">
        <div class="py-10 border-[2.5px] border-white">
          <h3 class="!text-[var(--primary-text-color)] h3">
            {{ item.promoTitle }}
          </h3>
          <p class="mb-4 text-[var(--primary-text-color)]">
            {{ item.promoSubtitle }}
          </p>
          <Button :as="RouterLink" :to="item.path" class="bg-[var(--dark-button)] px-3 py-[6px] border-[var(--dark-button)] rounded text-white">
            {{ item.promoButton }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@font-face {
  font-family: 'Yellowtail';
  /* 載入字型檔案（需指定字體檔案類型） */
  src: url('@/assets/Yellowtail-Regular.ttf') format('opentype');
  font-weight: normal;
  font-style: normal;
}

.h3 {
  @apply mb-4 font-[Yellowtail] text-[28px] text-white leading-[33.6px];
}

.text-shadow {
  text-shadow: 1px 1px 1px var(--dark-button);
}
</style>
