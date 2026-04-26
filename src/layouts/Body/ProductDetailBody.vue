<script setup lang="ts">
import { Breadcrumb, Button, Galleria, InputNumber, Rating, Tag } from 'primevue'
import { _images } from './ProductCategory/imgServer'

const value3 = ref(1)
const inputNumberDT = ref({
  root: {
    buttonWidth: '30px',
    buttonHoverBackground: 'rgba(52, 58, 64, .1)',
  },
})
const inputNumberPT = ref({
  pcInputText: {
    root: 'w-[50px] text-center focus:border focus:border-[rgba(52,58,64,.3)] focus:ring-2 ring-[rgba(52,58,64,.1)]',
  },
})

const tagDT = ref({
  root: {
    padding: '0 4px',
  },
})
const buttonDT = ref({
  root: {
    iconOnlyWidth: '25px',

  },
})
const buttonPT = ref({
  icon: 'text-sm',
})
const value = ref(3)
const isLiked = ref(true)

const responsiveOptions = ref([
  {
    breakpoint: '1300px',
    numVisible: 4,
  },
  {
    breakpoint: '575px',
    numVisible: 1,
  },
])

const images = ref(_images)

const productCategory = {
  label: 'TOP',
  to: '/productCategory/ProductList/top',
}

const route = useRoute()
const breadcrumbItems = computed(() => {
  // 取得當前的 route-path
  // 格式 ['products', '01']
  const items: string[] = route.fullPath.split('/').slice(1)

  // 建構元件所需的數據格式 [ ..., { label: 'ALL', to: '/productCategory/all', disabled: true }]
  return [{
    label: items[1],
    to: '',
    disabled: () => true,
  }]
})
</script>

<template>
  <div>
    <Breadcrumb :home="productCategory" :model="breadcrumbItems" class="bg-[--gray-bg] mb-4 px-4 py-3 max-sm:w-full">
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
    <div class="grid grid-cols-12 pb-16">
      <div class="col-span-7">
        <Galleria :value="images" :responsiveOptions="responsiveOptions" :numVisible="5" containerStyle="max-width: 100%;">
          <template #item="slotProps">
            <!-- <img class="max-h-[calc(100vh-138px-92px-32px)]" :src="slotProps.item.itemImageSrc" :alt="slotProps.item.alt" /> -->
            <img :src="slotProps.item.itemImageSrc" :alt="slotProps.item.alt" />
          </template>
          <template #thumbnail="slotProps">
            <img :src="slotProps.item.thumbnailImageSrc" :alt="slotProps.item.alt" />
          </template>
        </Galleria>
      </div>
      <div class="col-span-5 px-8">
        <div class="space-x-2 mb-2">
          <Tag severity="warn" :dt="tagDT" value="new" rounded></Tag>
          <Tag severity="info" :dt="tagDT" value="有現貨" rounded></Tag>
        </div>
        <h1 class="font-bold text-2xl">
          MIT 貓咪藝術品印花短T
        </h1>
        <p class="mb-4 text-base">
          型號：tkt19379
        </p>
        <div class="flex items-center mb-4">
          <Rating v-model="value" readonly class="" />()
        </div>

        <hr class="mb-4">
        <!-- <div class="flex gap-1">
          <div class="border border-gray-300 w-[90px] h-[70px]">
            1
          </div>
          <div class="border border-gray-300 w-[90px] h-[70px]">
            2
          </div>
          <div class="border border-gray-300 w-[90px] h-[70px]">
            3
          </div>
          <div class="border border-gray-300 w-[90px] h-[70px]">
            3
          </div>
        </div> -->
        <div class="mt-12">
          <Tag severity="info" :dt="tagDT" value="滿額增" rounded></Tag>
          <span> 滿 3,000元送 100元</span>
          <p class="mb-2 font-bold text-red-500 text-2xl">
            NT$ 1999
          </p>
          <p class="mb-2 text-gray-500 text-sm">
            原價：NT$ 2499
          </p>
          <p class="text-red-500 text-sm">
            截至 4/24 限定價格期間限定
          </p>
        </div>
        <div class="flex items-center mt-4">
          <InputNumber v-model="value3" :dt="inputNumberDT" :pt="inputNumberPT" class="mr-4 h-8" inputId="horizontal-buttons" showButtons buttonLayout="horizontal" :min="0" :max="99">
            <template #incrementbuttonicon>
              <span class="pi pi-plus" />
            </template>
            <template #decrementbuttonicon>
              <span class="pi pi-minus" />
            </template>
          </InputNumber> 庫存 &lt; 3
        </div>
        <div class="flex items-center mt-14 mb-4 pr-4">
          <Tag severity="danger" value="">
            <span v-if="isLiked"> <i class="text-lg pi pi-heart-fill"></i></span>
            <span v-else> <i class="text-lg pi pi-heart"></i></span>
            Like
          </Tag>

          <a href=""><img src="@icon/link.png" class="ml-10 size-8" alt=""></a>
          <a href=""><img src="@icon/line.svg" class="ml-1 size-8" alt=""></a>
          <a href=""><img src="@icon/facebook.svg" class="ml-1 size-8" alt=""></a>
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
