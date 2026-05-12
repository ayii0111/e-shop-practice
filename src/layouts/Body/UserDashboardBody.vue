<script setup lang="ts">
import { Listbox } from 'primevue'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'

const userOptions = ref([
  { label: '個人資料', icon: ['fas', 'address-card'], name: 'ProfileTabPanel' },
  { label: '我的優惠券 (2)', icon: ['fas', 'ticket'], name: 'CouponTabPanel' },
  { label: '我的訂單', icon: ['fas', 'file-lines'], name: 'OrderlistTabPanel' },
])

const router = useRouter()
const route = useRoute()

// 從當前路由名稱反推選中的選項，確保從外部路由過來時狀態也能同步
const selectedOption = computed({
  get() {
    return userOptions.value.find(opt => opt.name === route.name) ?? null
  },
  set(newValue) {
    // newValue 為 null 代表點擊了已選中的選項（Listbox 的取消選取行為）
    // 直接忽略，保持當前路由不變
    if (!newValue) { return }
    router.push({ name: newValue.name })
  },
})

const dtListbox = {
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

// #region  左側欄在小裝置時隱藏:  ------------------------------
const breakpoints = useBreakpoints(breakpointsTailwind)
const isDesktop = breakpoints.greaterOrEqual('md')
// #endregion ------------------------------
</script>

<template>
  <div class="flex md:p-4">
    <!-- <div class="border-2 rounded-md"> -->
    <div v-if="isDesktop">
      <Listbox v-model="selectedOption" :dt="dtListbox" :options="userOptions" optionLabel="label" :metaKeySelection="true" class="min-w-40" />
    </div>
    <div class="w-full">
      <RouterView data-role="Panel" class="w-full min-h-[550px] md:px-4" />
    </div>
  </div>
</template>

<style scoped lang="scss"></style>