<script setup lang="ts">
import { Image, Paginator, Skeleton } from 'primevue'
import { useProductList } from '../ProductDisplay'
import { addToCartApi, toggleLikeApi } from '@services'
import { useAuthStore } from '@stores/useAuthStore'
import { useCartStore } from '@stores/useCartStore'
import { useWarpToast } from '@util'

// 吐司元件回報單純成敗結果
// JSONView 則顯示錯誤資訊協助除錯
// 由路由啟動該元件，call api 取得商品數據
// 輸入類別，去取得特定類別商品列表
// 輸入搜尋關鍵字，去取得商品名稱匹配
// 輸入 like 路由，去取得用戶like列表，並批次取得商品數據
const route = useRoute()
// 不可以直接用此種方式，雖然 route 是 reactive 其 params 也具有響應性
// 這樣不行  const { products, loading, total, offset } = useProductList(route.params)
// 這樣可以 const { products, loading, total, offset } = useProductList(route)
// watch 要監聽 reactive 物件時，不能先把屬性直接取出！！！驗證一下 ⚠️⚠️⚠️
const { products, loading, total, offset } = useProductList(() => route.params.productList as string)

const authStore = useAuthStore()
const cartStore = useCartStore()

async function handleAddToCart(productId: string, productName: string) {
  if (!authStore.user?.id) {
    useWarpToast('請先登入', '登入後才能加入購物車', 'warn')
    return
  }
  await addToCartApi(authStore.user.id, productId, 1)
  // 同步本地 store，讓 badge 即時更新
  // init 有防重複機制，這裡用 setItems 觸發重拉
  const { cartApi } = await import('@services')
  const items = await cartApi(authStore.user.id)
  cartStore.setItems(items)
  useWarpToast('已加入購物車', productName, 'success')
}

const imagePt = {
  image: { class: 'w-full h-full object-cover' },
}

async function handleToggleLike(productId: string, isCurrentlyLiked: boolean) {
  if (!authStore.user?.id) { return }

  const [error] = await to(toggleLikeApi(authStore.user.id, productId, isCurrentlyLiked))
  if (error) {
    useWarpToast('收藏操作失敗', error.message)
    return
  }

  // 樂觀更新：直接修改本地狀態，不需重新 fetch
  const target = products.value.find(p => p.product_id === productId)
  if (target) { target.is_liked = !isCurrentlyLiked }
}
</script>

<template>
  <div>
    <div class="flex flex-col items-center gap-x-[22px] gap-y-[14px] sm:grid sm:grid-cols-2 lg:grid-cols-3 auto-rows-min">
      <template v-if="loading" data-section="loading 骨架屏">
        <div v-for="n in 12" :key="n" class="border border-[--secondary-color] rounded max-sm:w-[291px] sm:max-w-[291px]">
          <Skeleton data-section="圖片骨架" height="200px" class="rounded-none" />

          <div data-section="內容骨架" class="space-y-2 px-5 py-2 border-b">
            <Skeleton height="1.5rem" width="70%" />
            <div class="flex justify-between">
              <Skeleton height="1rem" width="30%" />
              <Skeleton height="1rem" width="30%" />
            </div>
          </div>
          <div data-section="按鈕骨架 " class="grid grid-cols-2">
            <Skeleton height="2.5rem" class="rounded-none" />
            <Skeleton height="2.5rem" class="rounded-none" />
          </div>
        </div>
      </template>
      <template v-else data-section="實際商品列表 ">
        <div v-for="item in products" :key="item.product_id" class="border border-[--secondary-color] rounded max-sm:w-[291px] sm:max-w-[291px] min-h-[200px]">
          <div src="" alt="" class="relative border-b h-[200px]">
            <Image :pt="imagePt" :src="item.img_urls[0]" alt="Image" width="250" />

            <div class="top-2 right-2 z-0 absolute size-[20px]">
              <button v-if="item.is_liked" class="flex justify-center items-center w-full h-full" @click="handleToggleLike(item.product_id, true)">
                <i class="pi pi-heart-fill icon"></i>
              </button>
              <button v-else class="flex justify-center items-center w-full h-full" @click="handleToggleLike(item.product_id, false)">
                <i class="pi pi-heart icon"></i>
              </button>
            </div>
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
            <RouterLink :to="`/products/${item.product_id}`" class="hover:bg-[--secondary-color] py-2 border-r">
              查看商品
            </RouterLink>
            <a href="" class="hover:bg-[--secondary-color] py-2" @click.prevent="handleAddToCart(item.product_id, item.name)">加到購物車</a>
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
