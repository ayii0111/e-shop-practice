<script setup lang="ts">
import { useToast } from 'primevue/usetoast'
import { supabaseApi } from '@services/api'

const toast = useToast()
//  toast.add({
//     severity: 'success',   // success | info | warn | error
//     summary: '操作成功',
//     detail: '資料已成功儲存',
//     life: 3000             // 顯示毫秒數
//   });

// toast.removeAll();
const category = ref()

const [errorGetProductList, getProductList] = await to(supabaseApi.get(`/products?category=eq.${encodeURIComponent(category.value)}`))
if (errorGetProductList) {
  toast.add({
    severity: 'error', // success | info | warn | error
    summary: '失敗api: /products?category=eq.',
    // detail: '資料已成功儲存',
    life: 3000, // 顯示毫秒數
  })
  return
}

// 1. 引入吐司元件設計
// 2. 吐司元件回報單純成敗結果
// 3. 設計開發用的響應內容檢視的 json 元件
// 4. 正式把數據串到畫面上

// response.value = result.data
// 失敗時，吐司訊息顯示失敗
// 失敗主要訊息，輸出在控制台
// 失敗響應，亦要輸出在一個 json 元件結構，以讓開發者快速檢視，這個設計必須要很好移除
// 響應成功，數據放到 ref 物件中
const products = ref()

const productDetailPath = {
  path: '/products/01',
}
// TODO:  標注 like
// like 需先下載用戶 Cart 資料
// 再與當前商品比對商品 id 後，再在商品列表項目添加 like 欄位
</script>

<template>
  <div class="flex flex-col items-center gap-x-[22px] gap-y-[14px] sm:grid sm:grid-cols-2 lg:grid-cols-3 auto-rows-min">
    <div v-for="item in products" :key="item.id" class="border border-[--secondary-color] rounded max-sm:w-[291px] sm:max-w-[291px] min-h-[200px]">
      <div src="" alt="" class="relative border-b h-[200px]">
        <div class="top-2 right-2 z-0 absolute size-[20px]">
          <a v-if="item.isLike" href="" class="flex justify-center items-center w-full h-full">
            <i class="pi pi-heart-fill icon"></i>
          </a>
          <a v-else href="" class="flex justify-center items-center w-full h-full">
            <i class="pi pi-heart icon"></i>
          </a>
        </div>
      </div>
      <div class="px-5 py-2 border-b">
        <h5 class="font-medium text-xl">
          {{ item.name }}
        </h5>
        <div class="flex justify-between items-center">
          <span class="font-normal text-[--gray-icon] text-sm line-through">${{ item.originalPrice }}</span>
          <span class="font-medium text-[--danger-color] text-xl">NT ${{ item.salePrice }}</span>
        </div>
      </div>
      <div class="grid grid-cols-2 text-base text-center">
        <RouterLink :to="productDetailPath" class="hover:bg-[--secondary-color] py-2 border-r">
          查看商品
        </RouterLink>
        <!-- <a href="" class="hover:bg-[--secondary-color] py-2 border-r">查看商品</a> -->
        <a href="" class="hover:bg-[--secondary-color] py-2">加到購物車</a>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.icon {
  @apply size-[16px] text-[16px] text-[var(--danger-color)] leading-[16px];
  @apply flex justify-center items-center;
}
</style>
