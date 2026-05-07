<script setup lang="ts">
import { Button } from 'primevue'
</script>

<template>
  <div class="flex justify-between items-center p-6 bg">
    <div class="mr-2">
      <h5 class="mb-2 text-xl">
        限量 Coupon 大放送
      </h5>
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. A, aliquid cumque iusto necessitatibus quasi tempora.
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
