<script setup lang="ts">
import OverlayBadge from 'primevue/overlaybadge'
import { Menubar } from 'primevue'
import LoginPage from '../../pages/LoginPage.vue'
import LickList from './Header/LikeList.vue'

const items = ref([
  {
    label: 'Home',
    path: '/',
  },
  {
    label: 'Products',
    path: '/productCategory/ProductList/all',
  },
])

const menubarDt = reactive({
  root: {
    itemFocusBackground: 'intail',
  },
})

const overlayBadgeDt = ref({
  root: {
    padding: '0px',
  },
})

// ------------------------------ 標籤樣式(起) ------------------------------
// 當前頁面的標籤，實際上應該由 router 決定
// 依賴於 router 中的 name ⭐️⭐️⭐️
const activeTabName = ref('Home')

const route = useRoute()

function decideTabStyle(tabName: string) {
  return computed(() => {
    if (tabName === route.name) { return ['text-[var(--primary-text-color)', 'underline-animation'] }
    return ['text-[--secondary-text-color] hover:text-[--primary-text-color]']
  })
}

function clickedTab(tabName: string) {
  activeTabName.value = tabName
}
// ------------------------------ 標籤樣式(迄) ------------------------------

const cartProductCount = ref(88)
const loginVisible = ref(false)
</script>

<template>
  <div>
    <Menubar :model="items" :dt="menubarDt" class="px-0 py-2 border-0">
      <template #start>
        <span class="py-3 h-7.5 font-[700] text-[20px]">Carol's Shop</span>
      </template>
      <template #item="{ item }">
        <RouterLink :to="item.path" @click="clickedTab(item.label as string)">
          <span class="flex justify-center items-center px-3 py-2" :class="decideTabStyle(item.label as string).value"> {{ item.label }}</span>
        </RouterLink>
      </template>
      <template #end>
        <ul class="flex items-center icons">
          <li class="p-2">
            <a role="button" tabindex="0" @click="loginVisible = true">
              <font-awesome-icon :icon="['fas', 'user']" size="lg" />
            </a>
            <LoginPage v-model:visible="loginVisible" />
          </li>
          <li class="p-2">
            <LickList #="{ slotMethod }">
              <a role="button" tabindex="0" @click="slotMethod">
                <OverlayBadge :dt="overlayBadgeDt" :value="cartProductCount" severity="danger" size="small">
                  <font-awesome-icon :icon="['fas', 'cart-shopping']" size="lg" />
                </OverlayBadge>
              </a>
            </LickList>
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
