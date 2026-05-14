// composables/useProductList.js
import { useRoute } from 'vue-router'
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

export function useProductList() {
  const toast = useToast()
  const authStore = useAuthStore()

  const route = useRoute()
  const products = ref({}) as Ref<Product[]>
  const loading = ref(false)
  const total = ref(0)
  const offset = ref(0)

  watch([() => route.params.productList as string, offset], async ([newProductList, newOffset]) => {
    window.scrollTo({ top: 0, behavior: 'instant' })

    const categorys = ['all', 'top', 'bottom', 'shoes', 'accessory', 'life']
    const limit = 12
    const userId = authStore.user?.id ?? null

    // 已登入：統一走 RPC，回傳資料含 is_liked 狀態
    if (userId) {
      const isLikeList = newProductList === 'like'
      const isCategory = categorys.includes(newProductList)
      // all 傳 null 表示不篩選類別，其他類別才傳實際值
      const categoryParam = (!isLikeList && isCategory && newProductList !== 'all')
        ? newProductList
        : null
      const searchParam = (!isLikeList && !isCategory) ? newProductList : null

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

      // like 列表需額外篩選：只顯示 is_liked = true 的商品
      products.value = isLikeList
        ? (resp.data as any[]).filter((p: any) => p.is_liked)
        : resp.data as any
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