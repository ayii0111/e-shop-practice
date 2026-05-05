<script setup lang="ts">
import { OverlayBadge } from 'primevue'
import { LikeList, OAuthLogin } from './MenubarEnd'

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

<style scoped lang="scss"></style>