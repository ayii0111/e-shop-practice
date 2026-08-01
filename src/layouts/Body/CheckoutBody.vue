<script setup lang="ts">
import { Button, Divider, InputText, Textarea } from 'primevue'
import { useCartStore } from '@stores/useCartStore'
import { useAuthStore } from '@stores/useAuthStore'
import { createOrderApi, fetchCouponApi, supabaseApi, updateCartApi } from '@services'
import type { Coupon, OrderItem } from '@services'

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
    restoreCouponsFromStorage()
  }
})

// ═══════════════════════════════════════════════════════
// #region: 配送資訊
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

/** profile 對應欄位名稱 */
const shippingToProfileField: Record<keyof ShippingAddress, string> = {
  fullName: 'full_name',
  phone: 'phone',
  city: 'city',
  postalCode: 'postal_code',
  address: 'address',
}

/** 載入當下，profile 裡原本是空的欄位（送出訂單時，這些欄位若被填上就回寫 profile） */
const originallyEmptyProfileFields = ref<(keyof ShippingAddress)[]>([])

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
    originallyEmptyProfileFields.value = (Object.keys(shippingToProfileField) as (keyof ShippingAddress)[])
      .filter(key => !shipping.value[key])
  }
  catch { /* 靜默失敗，讓用戶手動填 */ }
}

/** 將配送資訊中，補上原本 profile 為空欄位的值回寫到 user_profiles */
async function fillEmptyProfileFieldsFromShipping() {
  if (!authStore.accessToken) { return }
  const patchBody = originallyEmptyProfileFields.value
    .filter(key => shipping.value[key])
    .reduce((body, key) => {
      body[shippingToProfileField[key]] = shipping.value[key]
      return body
    }, {} as Record<string, string>)

  if (Object.keys(patchBody).length === 0) { return }

  const userId = parseUserIdFromToken(authStore.accessToken)
  await to(supabaseApi.patch('/user_profiles', patchBody, { params: { user_id: `eq.${userId}` } }))
}

function parseUserIdFromToken(token: string): string {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64)).sub ?? ''
  }
  catch { return '' }
}

/** 缺漏的送貨欄位（依填寫狀態動態列出） */
const missingShippingFields = computed(() => {
  const fieldLabels: Record<keyof ShippingAddress, string> = {
    fullName: '收件人姓名',
    phone: '聯絡電話',
    city: '城市',
    postalCode: '',
    address: '詳細地址',
  }
  return (Object.keys(fieldLabels) as (keyof ShippingAddress)[])
    .filter(key => fieldLabels[key] && !shipping.value[key])
    .map(key => fieldLabels[key])
})

/** 地址是否完整 */
const isShippingComplete = computed(() => missingShippingFields.value.length === 0)
// #endregion

// ═══════════════════════════════════════════════════════
// #region: 付款方式
// ═══════════════════════════════════════════════════════
const paymentOptions = [
  { label: '信用卡', value: 'credit_card', icon: ['fas', 'credit-card'], disabled: true },
  { label: 'LINE Pay', value: 'line_pay', icon: ['fab', 'line'], disabled: true },
  { label: '超商取貨付款', value: 'cvs_cod', icon: ['fas', 'store'], disabled: false },
  { label: '貨到付款', value: 'cod', icon: ['fas', 'truck'], disabled: false },
]
const selectedPayment = ref<string>('cvs_cod')
// #endregion

// ═══════════════════════════════════════════════════════
// #region: 優惠券
// 可疊加套用多組優惠碼，真實查 coupon_templates 驗證（已移除舊版前端硬編碼 mock）
// 已套用清單暫存在 localStorage，離開結帳頁（例如回商品頁加購）再回來不用重打
// ═══════════════════════════════════════════════════════
const couponCodeInput = ref('')
const couponError = ref('')
const appliedCoupons = ref<Coupon[]>([])

function couponStorageKey(): string | null {
  if (!authStore.accessToken) { return null }
  const userId = parseUserIdFromToken(authStore.accessToken)
  return userId ? `checkout_applied_coupons:${userId}` : null
}

function persistCoupons() {
  const key = couponStorageKey()
  if (!key) { return }
  localStorage.setItem(key, JSON.stringify(appliedCoupons.value.map(c => c.coupon_code)))
}

/** 頁面載入時，把暫存的優惠碼重新向後端驗證一次（避免優惠券狀態已變但沿用舊結果） */
async function restoreCouponsFromStorage() {
  const key = couponStorageKey()
  if (!key) { return }
  let codes: string[] = []
  try {
    codes = JSON.parse(localStorage.getItem(key) ?? '[]')
  }
  catch { return }

  for (const code of codes) {
    const coupon = await fetchCouponApi(code)
    if (coupon) { appliedCoupons.value.push(coupon) }
  }
  persistCoupons() // 把驗證失敗（已失效）的優惠碼從暫存清掉
}

async function applyCoupon() {
  const code = couponCodeInput.value.trim().toUpperCase()
  couponError.value = ''
  if (!code) {
    couponError.value = '請輸入優惠券代碼'
    return
  }
  if (appliedCoupons.value.some(c => c.coupon_code === code)) {
    couponError.value = '這組優惠券已經套用過了'
    return
  }

  const coupon = await fetchCouponApi(code)
  if (!coupon) {
    couponError.value = '優惠券代碼無效或已過期'
    return
  }

  appliedCoupons.value.push(coupon)
  couponCodeInput.value = ''
  persistCoupons()
}

function removeCoupon(code: string) {
  appliedCoupons.value = appliedCoupons.value.filter(c => c.coupon_code !== code)
  persistCoupons()
}
// #endregion

// ═══════════════════════════════════════════════════════
// #region: 金額計算
// 設計原則：每個計算步驟獨立為一個 computed，方便增刪
// 多張優惠券疊加套用順序（依業務規則固定）：threshold_discount（滿額固定折）→ percentage_discount（打折）→ free_shipping（運費歸零）
// ═══════════════════════════════════════════════════════

/** 步驟 1：勾選商品小計 */
const subtotal = computed(() =>
  cartStore.checkedItems.reduce((sum, item) => sum + item.salePrice * item.quantity, 0),
)

/** 已套用的滿額固定折扣券（門檻用「原始小計」判斷，未達門檻的不生效） */
const appliedThresholdCoupons = computed(() =>
  appliedCoupons.value.filter(c =>
    c.discount_type === 'threshold_discount'
    && (c.threshold_amount == null || subtotal.value >= c.threshold_amount),
  ),
)

/** 步驟 2：滿額固定折扣總額 */
const thresholdDiscountAmount = computed(() =>
  appliedThresholdCoupons.value.reduce((sum, c) => sum + (c.discount_value ?? 0), 0),
)

/** 扣完滿額固定折扣後的金額（不會小於 0） */
const amountAfterThreshold = computed(() =>
  Math.max(0, subtotal.value - thresholdDiscountAmount.value),
)

/** 已套用的百分比折扣券（在滿額折扣之後的基數上套用） */
const appliedPercentageCoupons = computed(() =>
  appliedCoupons.value.filter(c => c.discount_type === 'percentage_discount'),
)

/** 步驟 3：百分比折扣後的金額（多張疊乘） */
const amountAfterPercentage = computed(() =>
  appliedPercentageCoupons.value.reduce(
    (amount, c) => amount * (1 - (c.discount_value ?? 0) / 100),
    amountAfterThreshold.value,
  ),
)

/** 百分比折扣實際折掉的金額（顯示明細用） */
const percentageDiscountAmount = computed(() =>
  amountAfterThreshold.value - amountAfterPercentage.value,
)

/** 優惠券折扣總額（不含運費，運費由免運券直接歸零處理） */
const discountAmount = computed(() =>
  thresholdDiscountAmount.value + percentageDiscountAmount.value,
)

/** 是否套用了免運費券 */
const hasFreeShippingCoupon = computed(() =>
  appliedCoupons.value.some(c => c.discount_type === 'free_shipping'),
)

/**
 * 實際有生效、真的折抵到金額或運費的優惠券（用來記錄進訂單的 applied_coupon_codes）
 * 跟 appliedCoupons 不同：appliedCoupons 是「使用者輸入過的全部優惠碼」，
 * 未達門檻的滿額券雖然還顯示在畫面上（標「未達門檻」），但不該被記錄成「這筆訂單真的用到這張券」
 */
const effectiveCouponCodes = computed(() => [
  ...appliedThresholdCoupons.value,
  ...appliedPercentageCoupons.value,
  ...appliedCoupons.value.filter(c => c.discount_type === 'free_shipping'),
].map(c => c.coupon_code))

/** 步驟 4：運費（滿 1000 免運，否則 80 元；有免運券則直接歸零，優先權最高） */
const shippingFee = computed(() => {
  if (hasFreeShippingCoupon.value) { return 0 }
  // 超商取貨付款固定 60 元
  if (selectedPayment.value === 'cvs_cod') { return 60 }
  return subtotal.value >= 1000 ? 0 : 80
})

/** 步驟 5：最終金額 = 折扣後金額 + 運費 */
const finalAmount = computed(() =>
  Math.max(0, amountAfterPercentage.value + shippingFee.value),
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

    const order = await createOrderApi({
      items,
      shippingFee: shippingFee.value,
      discount: discountAmount.value,
      shippingAddress: `${shipping.value.city}${shipping.value.address}`,
      paymentMethod: paymentLabel,
      appliedCouponCodes: effectiveCouponCodes.value,
    })

    if (!order) { return }

    // 把配送資訊中，補上的原本 profile 空欄位回寫到用戶個資
    await fillEmptyProfileFieldsFromShipping()

    // 成功後清空已勾選的購物車項目、優惠碼暫存並跳轉訂單頁
    cartStore.checkedItems.forEach(item => cartStore.removeItem(item.id))
    // 同步覆寫雲端 cart_list，避免下次登入/重整時已下單的商品又跑回購物車
    const userId = parseUserIdFromToken(authStore.accessToken)
    await updateCartApi(userId, cartStore.items)
    const key = couponStorageKey()
    if (key) { localStorage.removeItem(key) }
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
                <img :src="item.image" :alt="item.name" class="rounded w-full h-full object-cover" />
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

        <!-- 配送資訊 -->
        <section data-section="配送資訊">
          <h2 class="flex items-center gap-2 mb-4 font-semibold text-lg">
            <font-awesome-icon :icon="['fas', 'location-dot']" class="text-primary" />
            配送資訊
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
            請填寫：{{ missingShippingFields.join('、') }}
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
            <button v-for="option in paymentOptions" :key="option.value" :disabled="option.disabled" class="flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all" :class="option.disabled
              ? 'border-gray-100 text-gray-300 cursor-not-allowed'
              : selectedPayment === option.value
                ? 'border-primary bg-primary/5 text-primary cursor-pointer'
                : 'border-gray-200 hover:border-gray-300 text-gray-600 cursor-pointer'" @click="!option.disabled && (selectedPayment = option.value)">
              <font-awesome-icon :icon="option.icon" class="text-2xl" />
              <span class="font-medium text-sm text-center">{{ option.label }}</span>
              <span v-if="option.disabled" class="text-gray-400 text-xs">暫不開放</span>
            </button>
          </div>
        </section>

        <Divider />

        <!-- 優惠券：可疊加套用多組，每輸入一組就重新計算一次 -->
        <section data-section="優惠券">
          <h2 class="flex items-center gap-2 mb-4 font-semibold text-lg">
            <font-awesome-icon :icon="['fas', 'ticket']" class="text-primary" />
            優惠券
          </h2>
          <div class="flex gap-2">
            <InputText v-model="couponCodeInput" placeholder="輸入優惠券代碼，可連續輸入多組" class="flex-1" @keyup.enter="applyCoupon" />
            <Button label="套用" outlined @click="applyCoupon" />
          </div>
          <p v-if="couponError" class="mt-2 text-red-500 text-sm">
            <font-awesome-icon :icon="['fas', 'circle-exclamation']" class="mr-1" />
            {{ couponError }}
          </p>

          <div v-if="appliedCoupons.length" class="space-y-2 mt-3">
            <div v-for="coupon in appliedCoupons" :key="coupon.coupon_code" class="flex justify-between items-center bg-green-50 px-4 py-2 border border-green-200 rounded-lg">
              <div class="flex items-center gap-2 text-green-700">
                <font-awesome-icon :icon="['fas', 'circle-check']" />
                <span class="font-medium">{{ coupon.coupon_code }}</span>
                <span class="text-sm">{{ coupon.coupon_name }}</span>
                <span v-if="coupon.discount_type === 'threshold_discount' && !appliedThresholdCoupons.includes(coupon)" class="text-orange-500 text-xs">
                  （未達門檻 NT${{ coupon.threshold_amount }}，暫未生效）
                </span>
              </div>
              <button class="text-gray-400 hover:text-gray-600 transition-colors" @click="removeCoupon(coupon.coupon_code)">
                <font-awesome-icon :icon="['fas', 'xmark']" />
              </button>
            </div>
          </div>
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
              <span :class="shippingFee === 0 ? 'text-red-600 font-medium' : ''">
                {{ shippingFee === 0 ? '免運費' : formatCurrency(shippingFee) }}
              </span>
            </div>
            <p v-if="shippingFee === 0 && selectedPayment !== 'cvs_cod'" class="-mt-1 text-green-600 text-xs">
              滿 NT$1,000 免運費
            </p>

            <!-- 優惠券折扣明細（依實際套用的每一張券分開列出） -->
            <div v-for="coupon in appliedThresholdCoupons" :key="coupon.coupon_code" class="flex justify-between text-red-600">
              <span>{{ coupon.coupon_name }}</span>
              <span>- {{ formatCurrency(coupon.discount_value ?? 0) }}</span>
            </div>
            <div v-if="appliedPercentageCoupons.length" class="flex justify-between text-red-600">
              <span>{{ appliedPercentageCoupons.map(c => c.coupon_name).join('、') }}</span>
              <span>- {{ formatCurrency(percentageDiscountAmount) }}</span>
            </div>
            <div v-if="hasFreeShippingCoupon" class="flex justify-between text-red-600">
              <span>免運費券</span>
              <span>已套用</span>
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
