<script setup lang="ts">
import { Listbox } from 'primevue'
import { getCouponTemplatesApi } from '@services'

const router = useRouter()
const route = useRoute()

// 目前可使用的優惠券數量（依 usability_enable + 有效期間判斷，見 CouponTabPanel.vue 的 getStatus）
const availableCouponCount = ref(0)

onMounted(async () => {
  const coupons = await getCouponTemplatesApi()
  const now = new Date()
  availableCouponCount.value = coupons.filter(c =>
    c.usability_enable && now >= new Date(c.valid_start_at) && now <= new Date(c.valid_end_at),
  ).length
})

// #region: <Listbox> 左側分頁導航欄 ------------------------------
const options = computed(() => [
  { label: '個人資料', icon: ['fas', 'address-card'], name: 'ProfileTabPanel' },
  { label: `我的優惠券 (${availableCouponCount.value})`, icon: ['fas', 'ticket'], name: 'CouponTabPanel' },
  { label: '我的訂單', icon: ['fas', 'file-lines'], name: 'OrderlistTabPanel' },
])

// 依賴: route.name, router.push, selectedOptiond本身
const selectedOption = computed({
  // 從當前路由名稱反推選中的選項，確保從外部路由過來時狀態也能同步

  get() {
    return options.value.find(opt => opt.name === route.name) ?? null
  },
  set(newValue) {
    // newValue 為 null 代表點擊了已選中的選項（Listbox 的取消選取行為）
    // 直接忽略，保持當前路由不變
    if (!newValue) { return }
    router.push({ name: newValue.name })
  },
})
const listboxDt = {
  root: {
    borderColor: 'opacity',
    shadow: 0,
  },

  // rgb(243 244 246 / var(--tw-bg-opacity, 1))
  option: {
    focusBackground: 'opacity',
    // selectedBackground: 'rgba(var(--third-color-rgb), 0.5)',
    // selectedFocusBackground: 'rgba(var(--third-color-rgb), 0.5)',
    selectedBackground: 'var(--secondary-color)',
    selectedFocusBackground: 'var(--secondary-color)',
    selectedColor: 'white',
    selectedFocusColor: 'white',
  },
}
// #endregion ------------------------------
</script>

<template>
  <div class="flex md:p-4">
    <Listbox v-model="selectedOption" :dt="listboxDt" :options optionLabel="label" :metaKeySelection="true" class="max-lg:hidden  w-40" />
    <div class="w-full">
      <RouterView data-role="Panel" class="w-full min-h-[550px] md:px-4" />
    </div>
  </div>
</template>

<style scoped lang="scss"></style>