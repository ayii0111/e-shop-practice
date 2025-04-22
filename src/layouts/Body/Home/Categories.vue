<script setup lang="ts">
const items = reactive([
  { icon: ['fas', 'gift'], en: 'ALL', cn: '全部商品' },
  { icon: ['fas', 'shirt'], en: 'TOP', cn: '上半身' },
  { icon: ['fas', 'socks'], en: 'BOTTOM', cn: '下半身' },
  { icon: ['fas', 'shoe-prints'], en: 'SHOES', cn: '鞋' },
  { icon: ['fas', 'democrat'], en: 'ACCESSORY', cn: '飾品' },
  { icon: ['fas', 'shopping-bag'], en: 'LIFE', cn: '配件' },
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
</script>

<template>
  <div>
    <ul class="grid lg:grid-cols-6 md:grid-cols-3 grid-cols-2  text-[var(--gray-icon)] ">
      <li v-for="(item, index) in items" :key="index" :class="borderPosition(index)" class="py-4 border-[var(--secondary-color)] hover">
        <a href="" class=" flex items-center justify-center">
          <span><font-awesome-icon :icon="item.icon" size="2x" width="28" /></span>
          <div class="flex flex-col ml-4 text-center">
            <span>{{ item.en }}</span>
            <span>{{ item.cn }}</span>
          </div>
        </a>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.hover {
  @apply hover:bg-[var(--secondary-color)] hover:text-[var(--dark-button)];
}
</style>
