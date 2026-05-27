<script setup lang="ts">
import { Button, Checkbox, DataView, Divider, InputNumber } from 'primevue'
import { useCartStore } from '@stores/useCartStore'
import { useAuthStore } from '@stores/useAuthStore'
import { cartApi, removeCartItemApi, updateCartApi } from '@services'

const router = useRouter()
const cartStore = useCartStore()
const authStore = useAuthStore()

// ── 載入購物車資料 ────────────────────────────────────────
const loading = ref(false)

function parseUserIdFromToken(token: string): string {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64)).sub ?? ''
  }
  catch { return '' }
}

const userId = computed(() =>
  authStore.accessToken ? parseUserIdFromToken(authStore.accessToken) : '',
)

onMounted(async () => {
  if (!userId.value) { return }
  loading.value = true
  const items = await cartApi(userId.value)
  cartStore.setItems(items)
  loading.value = false
})

// ── 離開頁面時自動儲存數量變更 ───────────────────────────
// 使用 onUnmounted 而非每次 updateQuantity 都發請求，避免頻繁 API 呼叫
onUnmounted(async () => {
  if (!userId.value) { return }
  await updateCartApi(userId.value, cartStore.items)
})

// ── x 按鈕：立即移除並同步後端 ──────────────────────────
async function handleRemoveItem(id: string) {
  cartStore.removeItem(id)
  if (!userId.value) { return }
  await removeCartItemApi(userId.value, id)
}

// ── UI 設定 ──────────────────────────────────────────────
const inputNumberDt = {
  root: { buttonWidth: '2rem' },
}
const inputNumberPt = {
  pcInputText: {
    root: 'py-1 px-2 !min-w-1 w-10 text-center flex-none',
  },
}
const removeBtnDt = {
  root: {
    primaryBackground: 'var(--danger-color)',
    primaryHoverBackground: 'var(--danger-color)',
  },
}

// ── 勾選狀態（橋接 Set 與 Checkbox 的 boolean） ──────────
function isChecked(id: string) {
  return cartStore.checkedIds.has(id)
}
function onCheckChange(id: string) {
  cartStore.toggleCheck(id)
}

// ── 去買單 ───────────────────────────────────────────────
function goCheckout() {
  if (cartStore.checkedItems.length === 0) { return }
  router.push({ name: 'CheckoutBody' })
  window.scrollTo({ top: 0, behavior: 'instant' })
}

// ── 勾選商品小計 ─────────────────────────────────────────
const checkedSubtotal = computed(() =>
  cartStore.checkedItems.reduce((sum, item) => sum + item.salePrice * item.quantity, 0),
)
</script>

<template>
  <div class="relative mx-auto pt-2 max-w-[1000px] min-h-[700px]">
    <!-- 載入中 -->
    <div v-if="loading" class="flex justify-center items-center min-h-[400px]">
      <span class="text-gray-400 text-3xl pi pi-spin pi-spinner" />
    </div>

    <!-- 空購物車 -->
    <div v-else-if="cartStore.items.length === 0" class="flex flex-col justify-center items-center gap-4 min-h-[400px] text-gray-400">
      <font-awesome-icon :icon="['fas', 'cart-shopping']" class="text-5xl" />
      <p>購物車是空的</p>
    </div>

    <DataView v-else :value="cartStore.items">
      <template #list="slotProps">
        <div class="flex flex-col">
          <div v-for="(item, index) in slotProps.items" :key="item.id">
            <div class="relative flex sm:flex-row flex-col sm:items-center sm:gap-4 sm:py-3 pt-4 pb-2" :class="{ 'border-t border-surface-200 dark:border-surface-700': index !== 0 }">
              <!-- 勾選框 -->
              <Checkbox class="sm:mx-4" :modelValue="isChecked(item.id)" binary @update:model-value="onCheckChange(item.id)" />

              <!-- 商品圖片 -->
              <div data-label="商品圖片" class="relative sm:my-0 mt-1 mb-4 w-full sm:w-72 h-48 sm:h-48 shrink-0">
                <img class="rounded w-full h-full object-cover" :src="item.image" :alt="item.name" />
                <div class="absolute bg-black/70 rounded-border" style="left: 4px; top: 4px">
                  <Tag :value="item.inventoryStatus" />
                </div>
              </div>

              <!-- 商品資訊 -->
              <div class="flex flex-1 justify-between sm:grid sm:grid-cols-[3fr_5fr]">
                <div class="flex flex-row md:flex-col justify-between items-start gap-2">
                  <div>
                    <div class="mt-0 font-medium text-lg">
                      {{ item.name }}
                    </div>
                    <span class="font-medium text-surface-500 dark:text-surface-400 text-sm">{{ item.category }}</span>
                  </div>
                </div>

                <div class="sm:grid sm:grid-cols-[2fr_3fr]">
                  <!-- 數量 -->
                  <div data-label="數量" class="flex flex-col items-center max-sm:mb-4 pt-1">
                    <InputNumber :modelValue="item.quantity" :dt="inputNumberDt" :pt="inputNumberPt" class="mb-2" inputId="horizontal-buttons" showButtons buttonLayout="horizontal" :step="1" :min="1" :max="99" @update:model-value="(val) => cartStore.updateQuantity(item.id, val ?? 1)">
                      <template #incrementbuttonicon>
                        <span class="pi pi-plus" />
                      </template>
                      <template #decrementbuttonicon>
                        <span class="pi pi-minus" />
                      </template>
                    </InputNumber>
                    <span class="text-gray-500 text-sm text-center">庫存: {{ item.inventoryStatus }}</span>
                  </div>

                  <!-- 價格 -->
                  <div data-label="價格" class="flex flex-col justify-center items-end sm:items-start sm:mr-8 sm:ml-8">
                    <span class="mr-3 sm:mr-0 mb-1 font-semibold text-lg">${{ item.salePrice }}</span>
                    <span class="mr-3 sm:mr-0 text-gray-400 text-sm line-through whitespace-nowrap">
                      原價: ${{ item.originalPrice }}
                    </span>
                  </div>
                </div>

                <!-- 刪除按鈕 -->
                <Button icon="pi pi-times" variant="text" size="small" rounded severity="secondary" aria-label="移除商品" class="top-2 md:top-1 right-0 absolute" @click="handleRemoveItem(item.id)" />
              </div>
            </div>
          </div>
        </div>
      </template>
    </DataView>

    <!-- 底部結帳列 -->
    <div class="bottom-0 sticky !bg-white">
      <Divider />
      <div class="flex justify-between items-center px-4 pb-2">
        <div class="flex items-center">
          <Checkbox v-model="cartStore.isAllChecked" inputId="select-all" class="ml-4" binary @update:model-value="cartStore.toggleAll" />
          <label class="ml-2 cursor-pointer" for="select-all">全選</label>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-gray-700">
            總金額:
            <span class="ml-1 font-bold text-primary text-lg">${{ checkedSubtotal.toLocaleString() }}</span>
          </span>
          <Button class="border-none" :dt="removeBtnDt" size="small" :disabled="cartStore.checkedItems.length === 0" @click="goCheckout">
            去買單 ({{ cartStore.checkedItems.length }})
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
