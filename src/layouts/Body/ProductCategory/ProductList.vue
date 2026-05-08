<script setup lang="ts">
import { useToast } from 'primevue/usetoast'
import { Image, Paginator, Skeleton } from 'primevue'
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
const products = ref({}) as Ref<Product[]>
const loading = ref(false)
let total = 0
const offset = ref(0)

const productDetailPath = {
  path: '/products/01',
}

// 吐司元件回報單純成敗結果
// JSONView 則顯示錯誤資訊協助除錯
watch([() => route.params.category as string, offset], async ([newCategory, newOffset]) => {
  window.scrollTo({ top: 0, behavior: 'smooth' })

  loading.value = true
  // let productPath = `/products?category=eq.${encodeURIComponent(newCategory)}&limit=12&offset=${newOffset}`
  let categoryPath = `category=eq.${encodeURIComponent(newCategory)}&`

  if (newCategory === 'all') { categoryPath = '' }

  const headers = { Prefer: 'count=exact' }
  const [respError, resp] = await to(supabaseApi.get(`/products?${categoryPath}limit=12&offset=${newOffset}`, { headers }))
  if (respError) {
    toast.add({
      severity: 'error', // success | info | warn | error
      summary: `HTTP 錯誤`,
      detail: `message: ${respError.message}
      context: /products?category=eq`,
      // life: 5000, // 顯示毫秒數
    })
    dataInject(respError)
    loading.value = false
    return
  }
  products.value = resp.data as any
  const contentRange = resp.headers['content-range']
  // 回應 header 格式：Content - Range: 0 - 11 / 47
  total = Number(contentRange.split('/')[1])

  loading.value = false
}, { immediate: true })

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
      </template>d
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
