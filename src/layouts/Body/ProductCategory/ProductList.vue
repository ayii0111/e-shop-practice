<script setup lang="ts">
import { useToast } from 'primevue/usetoast'
import { Image } from 'primevue'
import { useJsonViewStore } from '@stores/useJsonViewStore'
import { supabaseApi } from '@services/api'
import type { Product } from '@services/type'

const { dataInject } = useJsonViewStore()
const toast = useToast()
// toast 便利貼
//  toast.add({
//     severity: 'success',   // success | info | warn | error
//     summary: '操作成功',
//     detail: '資料已成功儲存',
//     life: 3000             // 顯示毫秒數
//   });

// toast.removeAll();

const route = useRoute()
// const category = ref(route.params.category) as Ref<string>
const products = ref({}) as Ref<Product[]>
const productDetailPath = {
  path: '/products/01',
}

// 吐司元件回報單純成敗結果
// JSONView 則顯示錯誤資訊協助除錯
watch(() => route.params.category as string, async (newCategory) => {
  console.log('newCategory', newCategory)
  const [errorProductList, productList] = await to(supabaseApi.get(`/products?category=eq.${encodeURIComponent(newCategory)}`))
  console.log('errorProductListv', errorProductList)
  console.log('productList', productList)
  if (errorProductList) {
    toast.add({
      severity: 'error', // success | info | warn | error
      summary: '失敗api: /products?category=eq.',
      // detail: '資料已成功儲存',
      life: 3000, // 顯示毫秒數
    })
    dataInject(errorProductList)
    return
  }
  products.value = productList.data as any
}, { immediate: true })
const imagePt = {
  image: { class: 'w-full h-full object-cover' },

}
</script>

<template>
  <div class="flex flex-col items-center gap-x-[22px] gap-y-[14px] sm:grid sm:grid-cols-2 lg:grid-cols-3 auto-rows-min">
    <div v-for="item in products" :key="item.product_id" class="border border-[--secondary-color] rounded max-sm:w-[291px] sm:max-w-[291px] min-h-[200px]">
      <div src="" alt="" class="relative border-b h-[200px]">
        <Image :pt="imagePt" :src="item.img_urls[0]" alt="Image" width="250" />
        <!-- <img href="item.imgUrls[0]"> -->
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
