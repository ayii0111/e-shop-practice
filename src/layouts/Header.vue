<script setup lang="ts">
import OverlayBadge from 'primevue/overlaybadge'
import { Menubar } from 'primevue'

import { menubarProps } from './Header/menubarProps'
import LikeList from './Header/LikeList.vue'
import { OAuthLogin } from './Header'

// #region  購物車 數量圖標: <OverlayBadge> 元件 props ------------------------------
const overlayBadgeDt = ref({
  root: {
    padding: '0px',
  },
})

const cartProductCount = ref(88)
// #endregion
// #region  分頁標籤 樣式控制: <Menubar> 元件的 slot ------------------------------
// 當前頁面的標籤，實際上應該由 router 決定
// 依賴於 router 中的 name ⭐️⭐️⭐️

const route = useRoute()
function applyTabStyle(tabName: string) {
  return computed(() => {
    if (tabName === route.name) { return ['text-[var(--primary-text-color)', 'underline-animation'] }
    return ['text-[--secondary-text-color] hover:text-[--primary-text-color]']
  })
}
const activeTabName = ref('Home')
function activateTab(tabName: string) {
  activeTabName.value = tabName
}
// #endregion

// #region  頭像 第三方登入功能: 利用 Clerk 服務 ------------------------------

// #endregion
</script>

<template>
  <div>
    <Menubar v-bind="menubarProps" class="px-0 py-2 border-0">
      <template #start>
        <span class="py-3 h-7.5 font-[700] text-[20px]">Carol's Shop</span>
      </template>
      <template #item="{ item: tab }">
        <RouterLink :to="tab.path" @click="activateTab(tab.label as string)">
          <span class="flex justify-center items-center px-3 py-2" :class="applyTabStyle(tab.routeName as string).value"> {{ tab.label }}</span>
        </RouterLink>
      </template>
      <template #end>
        <ul class="flex items-center icons">
          <li class="p-2">
            <OAuthLogin #="{ props }" class="cursor-pointer">
              <font-awesome-icon v-bind="props" :icon="['fas', 'user']" size="lg" />
            </OAuthLogin>
            <!-- <RouterLink to="/user/">
              <font-awesome-icon :icon="['fas', 'user']" size="lg" />
            </RouterLink> -->
          </li>
          <li class="p-2">
            <LikeList #="{ toggle }">
              <a role="button" tabindex="0" @click="toggle">
                <OverlayBadge :dt="overlayBadgeDt" :value="cartProductCount" severity="danger" size="small">
                  <font-awesome-icon :icon="['fas', 'cart-shopping']" size="lg" />
                </OverlayBadge>
              </a>
            </LikeList>
          </li>
          <li class="p-2">
            <a href="#" role="button" tabindex="0"><font-awesome-icon :icon="['fas', 'heart']" size="lg" /></a>
          </li>
        </ul>
      </template>
    </Menubar>
  </div>
</template>

<style lang="scss" scoped>
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
  background-color: #111;
  transform: scaleX(0);
  transform-origin: center;
  animation: _underline-animation 0.3s forwards;
}
</style>
