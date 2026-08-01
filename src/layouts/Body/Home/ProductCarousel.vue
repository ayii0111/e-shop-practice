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

import { categoryApi } from '@services'
import type { RawProduct } from '@services/type'
import { debugLog } from '@util'

const modules = ref([Navigation, Pagination, Grid, Autoplay])

const categoryLabelMap: Record<string, string> = {
  top: '上半身',
  bottom: '下半身',
  shoes: '鞋',
  accessory: '飾品',
  life: '配件',
}

const products = ref<{ productId: string, name: string, category: string, imageUrl: string }[]>([])

onMounted(async () => {
  const [error, resp] = await to(categoryApi('all', 12, 0)) as [Error, any]
  if (error) {
    debugLog('首頁商品輪播取得商品失敗', () => error)
    return
  }
  products.value = (resp?.data as RawProduct[] ?? []).map(product => ({
    productId: product.product_id,
    name: product.name,
    category: categoryLabelMap[product.category] ?? product.category,
    imageUrl: product.img_urls?.[0] ?? '',
  }))
})

const router = useRouter()
function goToProduct(productId: string) {
  router.push({ name: 'ProductDetailBody', params: { id: productId } })
}

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
      <SwiperSlide v-for="{ productId, name, category, imageUrl } in products" :key="productId">
        <div class="slide cursor-pointer" :style="{ backgroundImage: `url(${imageUrl})` }" @click="goToProduct(productId)">
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
  background-color: #fff;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
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
  text-shadow: 1px 1px 1px var(--third-color);
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
  background-color: rgba(var(--dark-button-rgb), 0.5);
  opacity: 0;
  transition: all 0.3s ease;
  color: #fff;
  font-size: 1.5rem;
  letter-spacing: 0.2rem;
}
</style>
