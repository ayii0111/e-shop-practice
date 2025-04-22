<script setup lang="ts">
import { Button } from 'primevue'
</script>

<template>
  <div class="p-6 flex items-center justify-between bg">
    <div class="mr-2">
      <h5 class="mb-2 text-xl">
        限量 Coupon 大放送
      </h5>
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. A, aliquid cumque iusto necessitatibus quasi tempora.
      </p>
    </div>
    <Button class="py-1.5 px-3 w-40 btn-color">
      立即領取
    </Button>
  </div>
</template>

<style scoped lang="scss">
.bg {
  background-color: #f8f9fa;
}

.btn-color {
  color: #fff;
  background-color: #343a40;
  border-color: #343a40;
}
</style>
