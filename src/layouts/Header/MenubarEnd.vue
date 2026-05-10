<script setup lang="ts">
import { OverlayBadge } from 'primevue'
import { OAuthLogin } from './MenubarEnd'

// #region  購物車 數量圖標: <OverlayBadge> 元件 props ------------------------------
const overlayBadgeDt = ref({
  root: {
    padding: '1px',
    fontWeight: '600',
    height: '18px',
    minWidth: '18px',
  },
})

const cartProductCount = ref(18)
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
      <RouterLink :to="{ path: '/cart' }">
        <OverlayBadge :dt="overlayBadgeDt" :value="cartProductCount" severity="danger">
          <font-awesome-icon :icon="['fas', 'cart-shopping']" size="lg" />
        </OverlayBadge>
      </RouterLink>
    </li>
    <li class="p-2">
      <RouterLink :to="{ path: '/products-display-body/product-list/like' }">
        <font-awesome-icon :icon="['fas', 'heart']" size="lg" />
      </RouterLink>
    </li>
  </ul>
</template>

<style scoped lang="scss"></style>