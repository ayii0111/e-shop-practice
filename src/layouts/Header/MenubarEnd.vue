<script setup lang="ts">
import { OverlayBadge } from 'primevue'
import { OAuthLogin } from './inMenubarEnd/index'
import { useGoogleLogin } from '@util'
import { useAuthStore } from '@stores/useAuthStore'
import { useCartStore } from '@stores/useCartStore'

// #region  購物車 數量圖標: <OverlayBadge> 元件 props ------------------------------
const overlayBadgeDt = ref({
  root: {
    padding: '1px',
    fontWeight: '600',
    height: '18px',
    minWidth: '18px',
  },
})

const cartStore = useCartStore()
// 依賴 store 的商品件數，移除商品或清空時自動更新
const cartProductCount = computed(() => cartStore.totalItemCount || undefined)

// 未登入時，購物車／收藏 icon 跟頭像 icon 一樣，點擊直接觸發第三方登入，而非導航到頁面
const authStore = useAuthStore()
const { loginWithGoogle } = useGoogleLogin()
// #endregion ------------------------------
</script>

<template>
  <ul class="flex items-center icons">
    <li class="p-2">
      <OAuthLogin #="{ loginWithGoogle }" class="cursor-pointer">
        <font-awesome-icon :icon="['fas', 'user']" size="lg" @click="loginWithGoogle" />
      </OAuthLogin>
    </li>
    <li class="p-2">
      <RouterLink v-if="authStore.user" :to="{ path: '/cart' }">
        <!-- OverlayBadge 沒商品時仍會顯示一顆空心圓點（PrimeVue 設計如此），需靠 v-if 整個不渲染 Badge 才能真的隱藏 -->
        <OverlayBadge v-if="cartProductCount" :dt="overlayBadgeDt" :value="cartProductCount" severity="danger">
          <font-awesome-icon :icon="['fas', 'cart-shopping']" size="lg" />
        </OverlayBadge>
        <font-awesome-icon v-else :icon="['fas', 'cart-shopping']" size="lg" />
      </RouterLink>
      <button v-else type="button" class="cursor-pointer" @click="loginWithGoogle">
        <font-awesome-icon :icon="['fas', 'cart-shopping']" size="lg" />
      </button>
    </li>
    <li class="p-2">
      <RouterLink v-if="authStore.user" :to="{ path: '/products-display-body/product-list/like' }">
        <font-awesome-icon :icon="['fas', 'heart']" size="lg" />
      </RouterLink>
      <button v-else type="button" class="cursor-pointer" @click="loginWithGoogle">
        <font-awesome-icon :icon="['fas', 'heart']" size="lg" />
      </button>
    </li>
  </ul>
</template>

<style scoped lang="scss"></style>