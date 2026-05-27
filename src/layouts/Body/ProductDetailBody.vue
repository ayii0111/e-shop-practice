<script setup lang="ts">
import { Breadcrumb, Button, Galleria, InputNumber, Rating, Tag } from 'primevue'
import { _images } from './ProductDisplay/imgServer'

const route = useRoute()

// #region: <InputNumber> ------------------------------
const quantity = ref(1)
const inputNumberDT = ref({
  root: {
    buttonWidth: '30px',
    buttonHoverBackground: 'rgba(var(--dark-button-rgb), .1)',
  },
})
const inputNumberPT = ref({
  pcInputText: {
    root: 'w-[50px] text-center focus:border focus:border-[rgba(52,58,64,.3)] focus:ring-2 ring-[rgba(52,58,64,.1)]',
  },
})
// #endregion ------------------------------

const tagDT = ref({
  root: {
    padding: '0 4px',
  },
})
// const buttonDT = ref({
//   root: {
//     iconOnlyWidth: '25px',

//   },
// })
// const buttonPT = ref({
//   icon: 'text-sm',
// })

const ratingLevel = ref(3)
const isLiked = ref(true)

// #region: <Galleria> 畫廊元件 ------------------------------
const responsiveOptions = ref([
  {
    breakpoint: '1300px',
    numVisible: 4,
  },
  {
    breakpoint: '575px',
    numVisible: 4,
  },
])

const images = ref(_images)
// #endregion ------------------------------

// const items = ref([
//   { icon: ['fas', 'gift'], category: '全部商品', tabName: 'all', path: '/products-display-body/product-list/all' },
//   { icon: ['fas', 'shirt'], category: '上半身', tabName: 'top', path: '/products-display-body/product-list/top' },
//   { icon: ['fas', 'socks'], category: '下半身', tabName: 'bottom', path: '/products-display-body/product-list/bottom' },
//   { icon: ['fas', 'shoe-prints'], category: '鞋', tabName: 'shoes', path: '/products-display-body/product-list/shoes' },
//   { icon: ['fas', 'democrat'], category: '飾品', tabName: 'accessory', path: '/products-display-body/product-list/accessory' },
//   { icon: ['fas', 'shopping-bag'], category: '配件', tabName: 'life', path: '/products-display-body/product-list/life' },
// ])

// #region: <Breadcrumb> ------------------------------
// 依賴: 當前商品詳情 api 數據的: 名稱, 商品種類
// 商品種類對應的 path

const topOfBreadcrumbItems = {
  label: 'TOP',
  to: '/products-display-body/product-list/top',
}
// 依賴: 當前商品詳情 api 數據的: 名稱
// 依賴: route.fullPath,
const breadcrumbItems = computed(() => {
  const items: string[] = route.fullPath.split('/').slice(1)

  // 提取路由路徑最後的字串
  const lastSegment = items[items.length - 1] || ''

  // 建構元件所需的數據格式 [ ..., { label: 'ALL', to: '/products-display-body/all', disabled: true }]
  return [{
    label: lastSegment.toUpperCase(),
    to: '',
    disabled: () => true,
  }]
})
// #endregion ------------------------------
</script>

<template>
  <div>
    <Breadcrumb :home="topOfBreadcrumbItems" :model="breadcrumbItems" class="bg-[--gray-bg] mb-4 px-4 py-3 max-sm:w-full">
      <template #item="{ item }">
        <RouterLink :to="item.to">
          <span> {{ item.label }} </span>
        </RouterLink>
        <a class="cursor-pointer" :href="item.to"></a>
      </template>
      <template #separator>
        /
      </template>
    </Breadcrumb>
    <div class="relative max-sm:flex max-sm:flex-col md:grid md:grid-cols-12 pb-16">
      <div class="top-0 md:sticky self-start md:col-span-7">
        <Galleria :value="images" :responsiveOptions :numVisible="5" containerStyle="max-width: 100%;">
          <template #item="slotProps">
            <!-- <img class="max-h-[calc(100vh-138px-92px-32px)]" :src="slotProps.item.itemImageSrc" :alt="slotProps.item.alt" /> -->
            <img :src="slotProps.item.itemImageSrc" :alt="slotProps.item.alt" />
          </template>
          <template #thumbnail="slotProps">
            <img :src="slotProps.item.thumbnailImageSrc" :alt="slotProps.item.alt" />
          </template>
        </Galleria>
      </div>
      <div class="md:col-span-5 px-2 md:px-8 pt-3">
        <div class="space-x-2 mb-2">
          <Tag severity="warn" :dt="tagDT" value="new" rounded></Tag>
          <Tag severity="info" :dt="tagDT" value="有現貨" rounded></Tag>
        </div>
        <h1 class="font-bold text-xl sm:text-2xl">
          MIT 貓咪藝術品印花短T
        </h1>
        <p class="mb-4 text-base">
          型號：tkt19379
        </p>
        <div class="flex justify-between items-center mb-4">
          <Rating v-model="ratingLevel" readonly class="" />
          <span class="">
            <button v-if="isLiked" class="flex justify-center items-center w-full h-full text-[var(--danger-color)]">
              <i class="pi pi-heart-fill icon"></i>
            </button>
            <button v-else class="flex justify-center items-center w-full h-full text-[var(--danger-color)]">
              <i class="pi pi-heart icon"></i>
            </button>

          </span>
        </div>

        <hr class="mb-4">
        <div v-if="true">
          商品描述:
        </div>
        <div class="mt-12">
          <Tag class="mb-1" severity="info" :dt="tagDT" value="滿額增" rounded></Tag>
          <span class="mr-2"> 滿 3,000元送 100元</span>
          <p class="text-gray-500 text-xs  mt-1 mb-2">
            截至 4/24日
          </p>
          <p class="mb-2 font-bold  text-xl sm:text-2xl">
            NT$ 1999
          </p>
          <p class="mb-2 text-gray-400 decoration-gray-400 text-xs line-through">
            原價：NT$ 2499
          </p>
        </div>
        <div class="flex items-center mt-4">
          <InputNumber v-model="quantity" :dt="inputNumberDT" :pt="inputNumberPT" class="mr-4 h-8" inputId="horizontal-buttons" showButtons buttonLayout="horizontal" :min="0" :max="99">
            <template #incrementbuttonicon>
              <span class="pi pi-plus" />
            </template>
            <template #decrementbuttonicon>
              <span class="pi pi-minus" />
            </template>
          </InputNumber> 庫存: 3
        </div>
        <div class="flex items-center mt-14 mb-4 pr-4">
          <span class="flex gap-1 shrink-0">
            <a href=""><img src="@icon/link.png" class="size-8" alt=""></a>
            <a href=""><img src="@icon/line.svg" class="size-8" alt=""></a>
            <a href=""><img src="@icon/facebook.svg" class="size-8" alt=""></a>
          </span>
        </div>
        <Button label="加入購物車" severity="danger" class="mt-2 rounded-full w-full" />
      </div>
    </div>
    <!-- <div>
      <b>買了此商品的人，也買了...</b>
      <div>
      </div>
    </div> -->
  </div>
</template>

<style scoped lang="scss"></style>
