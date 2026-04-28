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

const to = {
  path: '/products/01',

}
// TODO:  標注 like
// like 需先下載用戶 likeList 資料
// 再與當前商品比對商品 id 後，再在商品列表項目添加 like 欄位
</script>

<template>
  <div class="flex flex-col items-center gap-x-[22px] gap-y-[14px] sm:grid sm:grid-cols-2 lg:grid-cols-3 auto-rows-min">
    <div v-for="item in products" :key="item.id" class="border border-[--secondary-color] rounded max-sm:w-[291px] sm:max-w-[291px] min-h-[200px]">
      <div src="" alt="" class="relative border-b h-[200px]">
        <div class="top-2 right-2 z-0 absolute size-[20px]">
          <a v-if="item.isLike" href="" class="flex justify-center items-center w-full h-full">
            <i class="pi pi-heart-fill icon"></i>
          </a>
          <a v-else href="" class="flex justify-center items-center w-full h-full">
            <i class="pi pi-heart icon"></i>
          </a>
        </div>
      </div>
      <div class="px-5 py-2 border-b">
        <h5 class="font-medium text-xl">
          {{ item.name }}
        </h5>
        <div class="flex justify-between items-center">
          <span class="font-normal text-[--gray-icon] text-sm line-through">${{ item.originalPrice }}</span>
          <span class="font-medium text-[--danger-color] text-xl">NT ${{ item.salePrice }}</span>
        </div>
      </div>
      <div class="grid grid-cols-2 text-base text-center">
        <RouterLink :to="to" class="hover:bg-[--secondary-color] py-2 border-r">
          查看商品
        </RouterLink>
        <!-- <a href="" class="hover:bg-[--secondary-color] py-2 border-r">查看商品</a> -->
        <a href="" class="hover:bg-[--secondary-color] py-2">加到購物車</a>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.icon {
  @apply size-[16px] text-[16px] text-[var(--danger-color)] leading-[16px];
  @apply flex justify-center items-center;
}
</style>
