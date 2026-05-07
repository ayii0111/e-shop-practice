<script setup lang="ts">
import { OverlayBadge } from 'primevue'
import { OAuthLogin } from './MenubarEnd'

// #region  購物車 數量圖標: <OverlayBadge> 元件 props ------------------------------
const overlayBadgeDt = ref({
  root: {
    padding: '0px',
  },
})

const cartProductCount = ref(88)
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
        <OverlayBadge :dt="overlayBadgeDt" :value="cartProductCount" severity="danger" size="small">
          <font-awesome-icon :icon="['fas', 'cart-shopping']" size="lg" />
        </OverlayBadge>
      </RouterLink>
    </li>
    <li class="p-2">
      <RouterLink :to="{ path: '/productCategory/ProductList/like' }">
        <font-awesome-icon :icon="['fas', 'heart']" size="lg" />
      </RouterLink>
    </li>
  </ul>
</template>

<style scoped lang="scss"></style>