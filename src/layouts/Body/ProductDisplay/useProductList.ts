// composables/useProductList.js
import type { RouteParams } from 'vue-router'

import { useToast } from 'primevue/usetoast'

import { categoryApi, likeApi, productsWithLikeApi, searchApi } from '@services'

import { useAuthStore } from '@stores/useAuthStore'

import type { Product } from '@services/type'

// const { dataInject } = useJsonViewStore()
// toast 便利貼
//  toast.add({
//     severity: 'success',   // success | info | warn | error
//     summary: '操作成功',
//     detail: '資料已成功儲存',
//     life: 3000             // 顯示毫秒數
//   });

// toast.removeAll();

export function useProductList (getProductList: () => string) {
  const toast = useToast()
  const authStore = useAuthStore()

  const products = ref({}) as Ref<Product[]>
  const loading = ref(true) // 初始為 true，確保第一次載入時顯示 Skeleton
  const total = ref(0)
  const offset = ref(0)

  watch([() => getProductList(), offset], async ([newProductList, newOffset]) => {
    window.scrollTo({ top: 0, behavior: 'instant' })

    const categorys = ['all', 'top', 'bottom', 'shoes', 'accessory', 'life']
    const limit = 12
    const userId = authStore.user?.id ?? null

    // 已登入：統一走 RPC，回傳資料含 is_liked 狀態
    // 例外：like 列表改走 likeApi（兩次請求），原因：
    //   - RPC 回傳全部商品再前端 filter，分頁計算會錯誤
    //   - likeApi 直接批次查詢已收藏的商品，分頁天然正確
    //   - 回傳後手動設 is_liked: true，取消收藏時只更新遠端狀態和愛心圖示，商品不從列表消失
    if (userId) {
      const isLikeList = newProductList === 'like'

      // like 列表：走 likeApi，手動補 is_liked: true
      if (isLikeList) {
        const [respError, resp] = await to(likeApi(userId, limit, newOffset))
        if (respError) {
          toast.add({ severity: 'error', summary: 'HTTP 錯誤', detail: respError.message })
          loading.value = false
          return
        }
        // 批次查回的商品全部都是已收藏的，手動設 is_liked: true
        products.value = (resp.data as Product[]).map(p => ({ ...p, is_liked: true }))
        const contentRange = resp.headers['content-range']
        total.value = Number(contentRange?.split('/')[1] ?? 0)
        loading.value = false
        return
      }

      // 一般列表：走 RPC，含 is_liked 狀態
      const isCategory = categorys.includes(newProductList)
      // all 傳 null 表示不篩選類別，其他類別才傳實際值
      const categoryParam = (isCategory && newProductList !== 'all') ? newProductList : null
      const searchParam = !isCategory ? newProductList : null

      const [respError, resp] = await to(productsWithLikeApi(
        userId,
        categoryParam,
        searchParam,
        limit,
        newOffset,
      ))

      if (respError) {
        toast.add({ severity: 'error', summary: 'HTTP 錯誤', detail: respError.message })
        loading.value = false
        return
      }

      products.value = resp.data as any
      const contentRange = resp.headers['content-range']
      total.value = Number(contentRange?.split('/')[1] ?? 0)
      loading.value = false
      return
    }

    // 未登入：走原本的 API，不含 is_liked
    const strategies = [
      {
        name: 'like商品 api',
        condFn: (productList: string) => productList === 'like',
        handleFn: () => likeApi(authStore.user?.id ?? '', limit, newOffset),
      },
      {
        name: '類別商品 api',
        condFn: (productList: string) => categorys.includes(productList),
        handleFn: (productList: string) => categoryApi(productList, limit, newOffset),
      },
      {
        name: '搜尋商品 api',
        condFn: () => true,
        handleFn: (productList: string) => searchApi(productList, limit, newOffset),
      },
    ]

    loading.value = true

    const strategy = strategies.find(({ condFn }) => condFn(newProductList))
    const [respError, resp] = await to(strategy!.handleFn(newProductList))

    if (respError) {
      toast.add({
        severity: 'error',
        summary: `HTTP 錯誤`,
        detail: `message: ${respError.message}`,
      })
      loading.value = false
      return
    }

    products.value = resp.data as any
    const contentRange = resp.headers['content-range']
    total.value = Number(contentRange.split('/')[1])

    loading.value = false
  }, { immediate: true })
  return { products, loading, total, offset }
}