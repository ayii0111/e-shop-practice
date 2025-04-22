<script setup lang="ts">
import { Button } from 'primevue'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'

const LRData = [
  {
    modelTitle: 'MODEL',
    modelName: 'I\'m Sophia',
    promoTitle: 'Hot Sale',
    promoSubtitle: 'Popular Products',
    promoButton: 'Go Shop',
    flexColReverse: ['flex-col'],
    imageUrl: '/src/assets/NewAndHotProduction_Images/news-1.55745d13.jpg',
    bgPosition: ['bg-bottom'],
    key: 1,
  },
  {
    modelTitle: 'MODEL',
    modelName: 'I\'m Sophia',
    promoTitle: 'Hot Sale',
    promoSubtitle: 'Popular Products',
    promoButton: 'Go Shop',
    flexColReverse: ['flex-col-reverse'],
    imageUrl: '/src/assets/NewAndHotProduction_Images/news-2.f7d3b8be.jpg',
    bgPosition: ['bg-center'],
    key: 2,
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
  <div class="grid grid-cols-1 md:grid-cols-2   md:gap-[30px] text-center">
    <div v-for="item in LRBox" :key="item.key" class="flex-auto flex" :class="`${decideFlexPosition(item.key).value}`">
      <!-- <div v-for="item in LRBox" :key="item.key" class="flex-auto flex flex-col"> -->
      <div class="py-[160px] mb-6 bg-cover " :class="item.bgPosition" :style="{ backgroundImage: `url(${item.imageUrl})` }">
        <h3 class="h3 text-shadow">
          {{ item.modelTitle }}
        </h3>
        <h3 class="h3 text-shadow">
          {{ item.modelName }}
        </h3>
      </div>
      <div class="p-8 mb-6 bg-[var(--secondary-color)]">
        <div class="py-10 border-[2.5px] border-white">
          <h3 class="h3 !text-[var(--primary-text-color)]">
            {{ item.promoTitle }}
          </h3>
          <p class="mb-4 text-[var(--primary-text-color)]">
            {{ item.promoSubtitle }}
          </p>
          <Button class="py-[6px] px-3 rounded text-white bg-[var(--dark-button)] border-[var(--dark-button)]">
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
  src: url('/src/assets/Yellowtail-Regular.ttf') format('opentype');
  font-weight: normal;
  font-style: normal;
}

.h3 {
  @apply mb-4 text-white text-[28px] leading-[33.6px] font-[Yellowtail];
}

.text-shadow {
  text-shadow: 1px 1px 1px #343a40;
}
</style>
