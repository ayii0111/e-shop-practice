<script setup lang="ts">
const products = ref([
  {
    name: '產品標題1',
    id: '001',
    description: '產品描述1',
    originalPrice: 1680,
    salePrice: 99,
    category: '種類1',
    ratings: 5,
    images: ['https://via.placeholder.com/150', 'https://via.placeholder.com/150'],
    quantity: 10,
    isLike: ref(false),
  },
  {
    name: '產品標題2',
    id: '002',
    description: '產品描述2',
    originalPrice: 1880,
    salePrice: 99,
    category: '種類2',
    ratings: 4,
    images: ['https://via.placeholder.com/150', 'https://via.placeholder.com/150'],
    quantity: 5,
    isLike: ref(true),
  },
  {
    name: '產品標題3',
    id: '003',
    description: '產品描述3',
    originalPrice: 1780,
    salePrice: 99,
    category: '種類3',
    ratings: 3,
    images: ['https://via.placeholder.com/150', 'https://via.placeholder.com/150'],
    quantity: 15,
    isLike: ref(false),
  },
  {
    name: '產品標題4',
    id: '004',
    description: '產品描述4',
    originalPrice: 1980,
    salePrice: 99,
    category: '種類4',
    ratings: 2,
    images: ['https://via.placeholder.com/150', 'https://via.placeholder.com/150'],
    quantity: 20,
    isLike: ref(true),
  },
])
// TODO:  標注 like
// like 需先下載用戶 likeList 資料
// 再與當前商品比對商品 id 後，再在商品列表項目添加 like 欄位
</script>

<template>
  <div class="grid grid-cols-3 auto-rows-min gap-x-[22px] gap-y-[14px] ">
    <div v-for="item in products" :key="item.id" class="min-h-[200px] border border-[--secondary-color] rounded">
      <div src="" alt="" class="h-[200px] border-b relative">
        <div class="absolute top-2 right-2 size-[20px] ">
          <a v-if="item.isLike" href="" class="w-full h-full flex items-center justify-center">
            <i class="pi pi-heart-fill icon"></i>
          </a>
          <a v-else href="" class="w-full h-full flex items-center justify-center">
            <i class="pi pi-heart icon"></i>
          </a>
        </div>
      </div>
      <div class=" py-2 px-5 border-b"> 
        <h5 class="text-xl font-medium ">
          {{ item.name }}
        </h5>
        <div class="flex items-center justify-between">
          <span class="text-[--gray-icon] text-sm line-through font-normal">${{ item.originalPrice }}</span>
          <span class="text-xl text-[--danger-color] font-medium">NT ${{ item.salePrice }}</span>
        </div>
      </div>
      <div class="grid grid-cols-2 text-center text-base ">
        <RouterLink :to="{ path: '/products/cloth/product' }" class="hover:bg-[--secondary-color] border-r py-2 ">
          查看商品
        </RouterLink>
        <!-- <a href="" class="hover:bg-[--secondary-color] border-r py-2 ">查看商品</a> -->
        <a href="" class="hover:bg-[--secondary-color] py-2 ">加到購物車</a>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.icon {
  @apply text-[--danger-color] text-[16px] leading-[16px] size-[16px];
  @apply flex items-center justify-center;
}
</style>
