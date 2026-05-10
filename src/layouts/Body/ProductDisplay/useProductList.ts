// composables/useProductList.js
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'

import { categoryApi, likeApi, searchApi } from '@services'

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

  const route = useRoute()
  const products = ref({}) as Ref<Product[]>
  const loading = ref(false)
  const total = ref(0)
  const offset = ref(0)

  watch([() => route.params.productList as string, offset], async ([newProductList, newOffset]) => {
    window.scrollTo({ top: 0, behavior: 'instant' })

    const categorys = ['all', 'top', 'bottom', 'shoes', 'accessory', 'life']
    const limit = 12

    const strategies = [
      {
        name: 'like商品 api',
        condFn: (productList: string) => productList === 'like',
        handleFn: (productList: string) => likeApi(productList, limit, newOffset),
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