<script setup lang="ts">
import { Button } from 'primevue'
</script>

<template>
  <div class="flex justify-between items-center p-6 bg">
    <div class="mr-2">
      <h5 class="mb-2 font-bold text-xl">
        新客優惠券
      </h5>
      <p class="font-medium text-gray-700">
        首次下單即享專屬禮遇，訂單金額每滿 $1000 自動折抵 $100，不限商品品項，輕鬆入手心儀好物，優惠直接扣，省錢不費力。
      </p>
    </div>
    <Button class="px-3 py-1.5 w-40 btn-color">
      立即領取
    </Button>
  </div>
</template>

<style scoped lang="scss">
.bg {
  background-color: var(--gray-bg);
}

.btn-color {
  color: #fff;
  background-color: var(--dark-button);
  border-color: var(--dark-button);
}
</style>
