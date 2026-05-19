<script setup lang="ts">
import { Menubar } from 'primevue'
// import { debugLog } from '@util'
// #region  分頁標籤 樣式控制的功能: 嵌於 <Menubar> 元件的 slot ------------------------------
// 當前頁面的標籤，實際上應該由 router 決定
// 依賴於 router 中的 name ⭐️⭐️⭐️

const route = useRoute()
// tab 樣式依賴於 route 的 name 屬性，以及該分頁連結所屬的 routeName
function applyTabStyle(matchName: string, routeName: () => string) {
  return computed(() => {
    if (matchName === routeName()) { return ['text-[var(--primary-text-color)', 'underline-animation'] }
    return ['text-[--third-color] hover:text-[--primary-text-color]']
  })
}

const tabs = [
  {
    label: 'Home',
    path: '/',
    matchName: 'Home',
  },
  {
    label: 'Products',
    path: '/products-display-body/product-list/all',
    matchName: 'product-list',
  },
]

const menubarDt = {
  root: {
    itemFocusBackground: 'intail',
  },
}
const menubarPt = {
  item: 'flex justify-center', // 好像是下畫線的功能讓項目歪掉，把他調回置中
}
const menubarProps = { model: tabs, dt: menubarDt, pt: menubarPt }
// #endregion ------------------------------
</script>

<template>
  <div>
    <Menubar v-bind="menubarProps" class="px-0 py-2 border-0">
      <template #start>
        <span class="py-3 h-7.5 font-[700] text-[20px]">Carol's Shop</span>
      </template>
      <template #item="{ item: tab }">
        <RouterLink :to="tab.path">
          <span class="flex justify-center items-center px-3 py-2" :class="applyTabStyle(tab.matchName, () => route.name as string).value"> {{ tab.label }}</span>
        </RouterLink>
      </template>
      <template #end>
        <MenubarEnd />
      </template>
    </Menubar>
  </div>
</template>

<style lang="scss" scoped>
/* 提供給 applyTabStyle() 方法使用的 css */
@keyframes _underline-animation {
  0% {
    transform: scaleX(0);
  }

  100% {
    transform: scaleX(1);
  }
}

.underline-animation {
  /* 目前只能透過將元素改為 inline-block 特性，避免底線過長（無法直接讓底線直接與內部文字長度相符） */
  @apply inline-block relative;
}

.underline-animation::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: var(--primary-text-color);
  transform: scaleX(0);
  transform-origin: center;
  animation: _underline-animation 0.3s forwards;
}
</style>
