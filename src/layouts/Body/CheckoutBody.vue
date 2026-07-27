<script setup lang="ts">
import { Button, Divider, InputText, Textarea } from 'primevue'
import { useCartStore } from '@stores/useCartStore'
import { useAuthStore } from '@stores/useAuthStore'
import { createOrderApi, supabaseApi } from '@services'
import type { OrderItem } from '@services'

const router = useRouter()
const cartStore = useCartStore()
const authStore = useAuthStore()

// ── 若沒有勾選商品，導回購物車 ───────────────────────────
onMounted(() => {
  if (cartStore.checkedItems.length === 0) {
    router.replace({ name: 'CartBody' })
  }
  else {
    loadShippingFromProfile()
  }
})

// ═══════════════════════════════════════════════════════
// #region: 送貨地址
// ═══════════════════════════════════════════════════════
interface ShippingAddress {
  fullName: string
  phone: string
  city: string
  postalCode: string
  address: string
}

const shipping = ref<ShippingAddress>({
  fullName: '',
  phone: '',
  city: '',
  postalCode: '',
  address: '',
})

/** 從用戶 profile 預填地址，若欄位為空則留白讓用戶填 */
async function loadShippingFromProfile() {
  if (!authStore.accessToken) { return }
  try {
    const userId = parseUserIdFromToken(authStore.accessToken)
    const [err, resp] = await to(
      supabaseApi.get('/user_profiles', { params: { user_id: `eq.${userId}` } }),
    ) as [Error, any]
    if (err || !resp?.data?.[0]) { return }
    const p = resp.data[0]
    shipping.value = {
      fullName: p.full_name ?? '',
      phone: p.phone ?? '',
      city: p.city ?? '',
      postalCode: p.postal_code ?? '',
      address: p.address ?? '',
    }
  }
  catch { /* 靜默失敗，讓用戶手動填 */ }
}

function parseUserIdFromToken(token: string): string {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64)).sub ?? ''
  }
  catch { return '' }
}

/** 地址是否完整 */
const isShippingComplete = computed(() =>
  !!shipping.value.fullName
  && !!shipping.value.phone
  && !!shipping.value.city
  && !!shipping.value.address,
)
// #endregion

// ═══════════════════════════════════════════════════════
// #region: 付款方式
// ═══════════════════════════════════════════════════════
const paymentOptions = [
  { label: '信用卡', value: 'credit_card', icon: ['fas', 'credit-card'] },
  { label: 'LINE Pay', value: 'line_pay', icon: ['fab', 'line'] },
  { label: '超商取貨付款', value: 'cvs_cod', icon: ['fas', 'store'] },
  { label: '貨到付款', value: 'cod', icon: ['fas', 'truck'] },
]
const selectedPayment = ref<string>('credit_card')
// #endregion

// ═══════════════════════════════════════════════════════
// #region: 優惠券
// ═══════════════════════════════════════════════════════
const couponCode = ref('')
const couponDiscount = ref(0)
const couponError = ref('')
const couponApplied = ref(false)

// mock 優惠券資料庫（之後可換成 API）
const MOCK_COUPONS: Record<string, number> = {
  WELCOME100: 100,
  VIP80OFF: 0, // 百分比折扣另外處理，這裡先 mock 為 0
  SAVE100: 100,
}

function applyCoupon() {
  const code = couponCode.value.trim().toUpperCase()
  couponError.value = ''
  if (!code) {
    couponError.value = '請輸入優惠券代碼'
    return
  }
  if (code in MOCK_COUPONS) {
    couponDiscount.value = MOCK_COUPONS[code]
    couponApplied.value = true
  }
  else {
    couponDiscount.value = 0
    couponApplied.value = false
    couponError.value = '優惠券代碼無效或已過期'
  }
}

function removeCoupon() {
  couponCode.value = ''
  couponDiscount.value = 0
  couponApplied.value = false
  couponError.value = ''
}
// #endregion

// ═══════════════════════════════════════════════════════
// #region: 金額計算
// 設計原則：每個計算步驟獨立為一個 computed，方便增刪
// ═══════════════════════════════════════════════════════

/** 步驟 1：勾選商品小計 */
const subtotal = computed(() =>
  cartStore.checkedItems.reduce((sum, item) => sum + item.salePrice * item.quantity, 0),
)

/** 步驟 2：運費（滿 1000 免運，否則 80 元） */
const shippingFee = computed(() => {
  // 超商取貨付款固定 60 元
  if (selectedPayment.value === 'cvs_cod') { return 60 }
  return subtotal.value >= 1000 ? 0 : 80
})

/** 步驟 3：優惠券折扣 */
const discountAmount = computed(() => couponDiscount.value)

/** 步驟 4：最終金額 = 小計 + 運費 - 折扣 */
const finalAmount = computed(() =>
  Math.max(0, subtotal.value + shippingFee.value - discountAmount.value),
)
// #endregion

// ═══════════════════════════════════════════════════════
// #region: 送出訂單
// ═══════════════════════════════════════════════════════
const isSubmitting = ref(false)

const canSubmit = computed(() =>
  isShippingComplete.value && !!selectedPayment.value && !isSubmitting.value,
)

async function submitOrder() {
  if (!canSubmit.value) { return }
  if (!authStore.accessToken) { return }
  isSubmitting.value = true
  try {
    const userId = parseUserIdFromToken(authStore.accessToken)
    const paymentLabel = paymentOptions.find(o => o.value === selectedPayment.value)?.label ?? selectedPayment.value

    const items: OrderItem[] = cartStore.checkedItems.map(item => ({
      id: item.id,
      productName: item.name,
      productImage: item.image,
      quantity: item.quantity,
      price: item.salePrice,
      originalPrice: item.originalPrice,
      subtotal: item.salePrice * item.quantity,
    }))

    const order = await createOrderApi(userId, {
      items,
      totalAmount: subtotal.value,
      shippingFee: shippingFee.value,
      discount: discountAmount.value,
      finalAmount: finalAmount.value,
      shippingAddress: `${shipping.value.city}${shipping.value.address}`,
      paymentMethod: paymentLabel,
    })

    if (!order) { return }

    // 成功後清空已勾選的購物車項目並跳轉訂單頁
    cartStore.checkedItems.forEach(item => cartStore.removeItem(item.id))
    router.push({ name: 'OrderlistTabPanel' })
  }
  finally {
    isSubmitting.value = false
  }
}
// #endregion

// ── 格式化金額 ───────────────────────────────────────────
function formatCurrency(amount: number) {
  return `NT$ ${amount.toLocaleString()}`
}
</script>

<template>
  <div class="mx-auto px-4 py-6 max-w-[1100px]">
    <h1 class="bg-gray-100 mb-6 px-4 py-3 font-bold text-2xl">
      結帳
    </h1>

    <div class="gap-6 grid grid-cols-1 lg:grid-cols-[1fr_380px]">
      <!-- ── 左欄：表單區 ─────────────────────────────── -->
      <div class="space-y-6">
        <!-- 訂購商品確認 -->
        <section data-section="訂購商品確認">
          <h2 class="flex items-center gap-2 mb-4 font-semibold text-lg">
            <font-awesome-icon :icon="['fas', 'box']" class="text-primary" />
            訂購商品（{{ cartStore.checkedItems.length }} 件）
          </h2>
          <div class="space-y-3">
            <div v-for="item in cartStore.checkedItems" :key="item.id" class="flex items-center gap-4 bg-gray-50 p-3 rounded-lg">
              <div class="flex justify-center items-center bg-gray-200 rounded w-14 h-14 shrink-0">
                <img :src="`https://primefaces.org/cdn/primevue/images/product/${item.image}`" :alt="item.name" class="rounded w-full h-full object-cover" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-medium truncate">
                  {{ item.name }}
                </div>
                <div class="text-gray-500 text-sm">
                  {{ item.category }}
                </div>
              </div>
              <div class="text-right shrink-0">
                <div class="font-semibold">
                  {{ formatCurrency(item.salePrice * item.quantity) }}
                </div>
                <div class="text-gray-500 text-sm">
                  x{{ item.quantity }}
                </div>
              </div>
            </div>
          </div>
        </section>

        <Divider />

        <!-- 送貨地址 -->
        <section data-section="送貨地址">
          <h2 class="flex items-center gap-2 mb-4 font-semibold text-lg">
            <font-awesome-icon :icon="['fas', 'location-dot']" class="text-primary" />
            送貨地址
          </h2>
          <div class="gap-4 grid grid-cols-1 sm:grid-cols-2">
            <div class="flex flex-col gap-1">
              <label class="font-medium text-gray-600 text-sm">收件人姓名 <span class="text-red-500">*</span></label>
              <InputText v-model="shipping.fullName" placeholder="請輸入收件人姓名" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="font-medium text-gray-600 text-sm">手機號碼 <span class="text-red-500">*</span></label>
              <InputText v-model="shipping.phone" placeholder="0912-345-678" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="font-medium text-gray-600 text-sm">城市 <span class="text-red-500">*</span></label>
              <InputText v-model="shipping.city" placeholder="例如：台北市" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="font-medium text-gray-600 text-sm">郵遞區號</label>
              <InputText v-model="shipping.postalCode" placeholder="例如：100" />
            </div>
            <div class="flex flex-col gap-1 sm:col-span-2">
              <label class="font-medium text-gray-600 text-sm">詳細地址 <span class="text-red-500">*</span></label>
              <Textarea v-model="shipping.address" rows="2" placeholder="請輸入詳細地址" />
            </div>
          </div>
          <p v-if="!isShippingComplete" class="mt-2 text-red-500 text-sm">
            <font-awesome-icon :icon="['fas', 'circle-exclamation']" class="mr-1" />
            請填寫完整的送貨地址
          </p>
        </section>

        <Divider />

        <!-- 付款方式 -->
        <section data-section="付款方式">
          <h2 class="flex items-center gap-2 mb-4 font-semibold text-lg">
            <font-awesome-icon :icon="['fas', 'credit-card']" class="text-primary" />
            付款方式
          </h2>
          <div class="gap-3 grid grid-cols-2 sm:grid-cols-4">
            <button v-for="option in paymentOptions" :key="option.value" class="flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all cursor-pointer" :class="selectedPayment === option.value
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-gray-200 hover:border-gray-300 text-gray-600'" @click="selectedPayment = option.value">
              <font-awesome-icon :icon="option.icon" class="text-2xl" />
              <span class="font-medium text-sm text-center">{{ option.label }}</span>
            </button>
          </div>
        </section>

        <Divider />

        <!-- 優惠券 -->
        <section data-section="優惠券">
          <h2 class="flex items-center gap-2 mb-4 font-semibold text-lg">
            <font-awesome-icon :icon="['fas', 'ticket']" class="text-primary" />
            優惠券
          </h2>
          <div v-if="!couponApplied" class="flex gap-2">
            <InputText v-model="couponCode" placeholder="輸入優惠券代碼" class="flex-1" @keyup.enter="applyCoupon" />
            <Button label="套用" outlined @click="applyCoupon" />
          </div>
          <div v-else class="flex justify-between items-center bg-green-50 px-4 py-3 border border-green-200 rounded-lg">
            <div class="flex items-center gap-2 text-green-700">
              <font-awesome-icon :icon="['fas', 'circle-check']" />
              <span class="font-medium">{{ couponCode.toUpperCase() }}</span>
              <span class="text-sm">折抵 {{ formatCurrency(couponDiscount) }}</span>
            </div>
            <button class="text-gray-400 hover:text-gray-600 transition-colors" @click="removeCoupon">
              <font-awesome-icon :icon="['fas', 'xmark']" />
            </button>
          </div>
          <p v-if="couponError" class="mt-2 text-red-500 text-sm">
            <font-awesome-icon :icon="['fas', 'circle-exclamation']" class="mr-1" />
            {{ couponError }}
          </p>
        </section>
      </div>

      <!-- ── 右欄：金額明細 + 送出 ──────────────────────── -->
      <div class="lg:top-4 lg:sticky self-start">
        <div class="space-y-4 p-6 border border-gray-200 rounded-xl">
          <h2 class="font-semibold text-lg">
            訂單明細
          </h2>

          <div class="space-y-3 text-sm">
            <!-- 商品小計 -->
            <div class="flex justify-between">
              <span class="text-gray-600">商品小計</span>
              <span>{{ formatCurrency(subtotal) }}</span>
            </div>

            <!-- 運費 -->
            <div class="flex justify-between">
              <span class="text-gray-600">運費</span>
              <span :class="shippingFee === 0 ? 'text-green-600 font-medium' : ''">
                {{ shippingFee === 0 ? '免運費' : formatCurrency(shippingFee) }}
              </span>
            </div>
            <p v-if="shippingFee === 0 && selectedPayment !== 'cvs_cod'" class="-mt-1 text-green-600 text-xs">
              滿 NT$1,000 免運費
            </p>
            <p v-if="selectedPayment === 'cvs_cod'" class="-mt-1 text-gray-400 text-xs">
              超商取貨付款固定運費 NT$60
            </p>

            <!-- 優惠券折扣 -->
            <div v-if="discountAmount > 0" class="flex justify-between text-green-600">
              <span>優惠券折扣</span>
              <span>- {{ formatCurrency(discountAmount) }}</span>
            </div>
          </div>

          <Divider />

          <!-- 總計 -->
          <div class="flex justify-between items-center font-bold text-lg">
            <span>訂單總額</span>
            <span class="text-primary text-xl">{{ formatCurrency(finalAmount) }}</span>
          </div>

          <!-- 送出按鈕 -->
          <Button label="確認送出訂單" class="mt-2 w-full" size="large" :loading="isSubmitting" :disabled="!canSubmit" @click="submitOrder" />

          <!-- <p v-if="!isShippingComplete" class="text-gray-400 text-xs text-center">
            請填寫完整地址後才能送出
          </p> -->
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
