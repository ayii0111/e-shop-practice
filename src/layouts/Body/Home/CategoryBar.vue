<script setup lang="ts">
import { RouterLink } from 'vue-router'

const items = ref([
  { icon: ['fas', 'gift'], category_cn: '全部商品', category_en: 'ALL', tabName: 'all', path: '/products-display-body/product-list/all' },
  { icon: ['fas', 'shirt'], category_cn: '上半身', category_en: 'TOP', tabName: 'top', path: '/products-display-body/product-list/top' },
  { icon: ['fas', 'socks'], category_cn: '下半身', category_en: 'BOTTOM', tabName: 'bottom', path: '/products-display-body/product-list/bottom' },
  { icon: ['fas', 'shoe-prints'], category_cn: '鞋', category_en: 'SHOES', tabName: 'shoes', path: '/products-display-body/product-list/shoes' },
  { icon: ['fas', 'democrat'], category_cn: '飾品', category_en: 'ACCESSORY', tabName: 'accessory', path: '/products-display-body/product-list/accessory' },
  { icon: ['fas', 'shopping-bag'], category_cn: '配件', category_en: 'LIFE', tabName: 'life', path: '/products-display-body/product-list/life' },
])

function borderPosition(index: number) {
  const clsBase = [] as string[]
  if (index === 5) {
    return clsBase
  }
  if (index === 2) {
    clsBase.push('lg:border-r md:border-r-0 border-r')
    return clsBase
  }
  if (index === 1 || index === 3) {
    clsBase.push('md:border-r border-r-0')
    return clsBase
  }
  clsBase.push('border-r')
  return clsBase
}
function click() {

}
</script>

<template>
  <div>
    <ul class="grid lg:grid-cols-6 md:grid-cols-3 grid-cols-2  text-[var(--gray-icon)] ">
      <li v-for="(item, index) in items" :key="index" :class="borderPosition(index)" class="py-4 border-[var(--secondary-color)] hover " @click="click()">
        <RouterLink :to="item.path" class="flex items-center justify-center ">
          <span><font-awesome-icon :icon="item.icon" size="2x" width="28" /></span>
          <div class="flex flex-col ml-4 text-center">
            <span>{{ item.category_en }}</span>
            <span>{{ item.category_cn }}</span>
          </div>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.hover {
  @apply hover:bg-[var(--secondary-color)] hover:text-[var(--dark-button)];
}
</style>
