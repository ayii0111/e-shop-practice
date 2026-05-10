<script setup lang="ts">
import { Image, Paginator, Skeleton } from 'primevue'
import { useProductList } from '../ProductDisplay'

const productDetailPath = {
  path: '/products/01',
}

// 吐司元件回報單純成敗結果
// JSONView 則顯示錯誤資訊協助除錯
// 由路由啟動該元件，call api 取得商品數據
// 輸入類別，去取得特定類別商品列表
// 輸入搜尋關鍵字，去取得商品名稱匹配
// 輸入 like 路由，去取得用戶like列表，並批次取得商品數據
const { products, loading, total, offset } = useProductList()

const imagePt = {
  image: { class: 'w-full h-full object-cover' },
}
</script>

<template>
  <div>
    <div class="flex flex-col items-center gap-x-[22px] gap-y-[14px] sm:grid sm:grid-cols-2 lg:grid-cols-3 auto-rows-min">
      <!-- loading 骨架屏 -->
      <template v-if="loading">
        <div v-for="n in 6" :key="n" class="border border-[--secondary-color] rounded max-sm:w-[291px] sm:max-w-[291px]">
          <!-- 圖片骨架 -->
          <Skeleton height="200px" class="rounded-none" />
          <!-- 內容骨架 -->
          <div class="space-y-2 px-5 py-2 border-b">
            <Skeleton height="1.5rem" width="70%" />
            <div class="flex justify-between">
              <Skeleton height="1rem" width="30%" />
              <Skeleton height="1rem" width="30%" />
            </div>
          </div>
          <!-- 按鈕骨架 -->
          <div class="grid grid-cols-2">
            <Skeleton height="2.5rem" class="rounded-none" />
            <Skeleton height="2.5rem" class="rounded-none" />
          </div>
        </div>
      </template>

      <!-- 實際商品列表 -->
      <template v-else>
        <div v-for="item in products" :key="item.product_id" class="border border-[--secondary-color] rounded max-sm:w-[291px] sm:max-w-[291px] min-h-[200px]">
          <div src="" alt="" class="relative border-b h-[200px]">
            <Image :pt="imagePt" :src="item.img_urls[0]" alt="Image" width="250" />
            <!-- like 標記先不使用 -->
            <!-- <div class="top-2 right-2 z-0 absolute size-[20px]">
              <a v-if="item.isLike" href="" class="flex justify-center items-center w-full h-full">
                <i class="pi pi-heart-fill icon"></i>
              </a>
              <a v-else href="" class="flex justify-center items-center w-full h-full">
                <i class="pi pi-heart icon"></i>
              </a>
            </div> -->
          </div>
          <div class="px-5 py-2 border-b">
            <h5 class="font-medium text-xl">
              {{ item.name }}
            </h5>
            <div class="flex justify-between items-center">
              <span class="font-normal text-[--gray-icon] text-sm line-through">${{ item.original_price }}</span>
              <span class="font-medium text-[--danger-color] text-xl">NT ${{ item.sale_price }}</span>
            </div>
          </div>
          <div class="grid grid-cols-2 text-base text-center">
            <RouterLink :to="productDetailPath" class="hover:bg-[--secondary-color] py-2 border-r">
              查看商品
            </RouterLink>
            <a href="" class="hover:bg-[--secondary-color] py-2">加到購物車</a>
          </div>
        </div>
      </template>
    </div>
    <Paginator v-model:first="offset" class="mt-8" :rows="10" :totalRecords="total" :rowsPerPageOptions="[10, 20, 30]" />
  </div>
</template>

<style scoped lang="scss">
.icon {
  @apply size-[16px] text-[16px] text-[var(--danger-color)] leading-[16px];
  @apply flex justify-center items-center;
}
</style>
