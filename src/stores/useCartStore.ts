// 購物車 Store
// 負責管理購物車商品列表、勾選狀態，並作為結帳頁的資料來源

import { defineStore } from 'pinia'

export interface CartItem {
  id: string
  name: string
  image: string
  category: string
  salePrice: number      // 售價
  originalPrice: number  // 原價（用於顯示劃線價）
  quantity: number
  inventoryStatus: string
}

export const useCartStore = defineStore('cart', () => {
  // ── State ──────────────────────────────────────────────
  const items = ref<CartItem[]>([])
  const checkedIds = ref<Set<string>>(new Set())

  // ── Getters ────────────────────────────────────────────

  /** 勾選中的商品 */
  const checkedItems = computed(() =>
    items.value.filter(item => checkedIds.value.has(item.id)),
  )

  /** 是否全選 */
  const isAllChecked = computed(() =>
    items.value.length > 0 && checkedIds.value.size === items.value.length,
  )

  /** 購物車商品總數（顯示在 header badge 用）
   *  依賴 items 陣列長度（件數），而非 quantity 加總
   *  讓 badge 反映「幾種商品」而非「總數量」，語意更直覺
   */
  const totalItemCount = computed(() => items.value.length)

  // ── Actions ────────────────────────────────────────────

  function setItems(newItems: CartItem[]) {
    items.value = newItems
    // 預設全部勾選
    checkedIds.value = new Set(newItems.map(i => i.id))
  }

  function toggleCheck(id: string) {
    if (checkedIds.value.has(id)) {
      checkedIds.value.delete(id)
    }
    else {
      checkedIds.value.add(id)
    }
  }

  function toggleAll() {
    if (isAllChecked.value) {
      checkedIds.value.clear()
    }
    else {
      checkedIds.value = new Set(items.value.map(i => i.id))
    }
  }

  function updateQuantity(id: string, quantity: number) {
    const item = items.value.find(i => i.id === id)
    if (item) { item.quantity = quantity }
  }

  function removeItem(id: string) {
    items.value = items.value.filter(i => i.id !== id)
    checkedIds.value.delete(id)
  }

  return {
    items,
    checkedIds,
    checkedItems,
    isAllChecked,
    totalItemCount,
    setItems,
    toggleCheck,
    toggleAll,
    updateQuantity,
    removeItem,
  }
})
