<script setup lang="ts">
import { Button, Checkbox, Column, DataTable, DataView, Divider, InputNumber } from 'primevue'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import { ProductService } from './LikeList'

const breakpoints = useBreakpoints(breakpointsTailwind)
const isDesktop = breakpoints.greaterOrEqual('md') // 自動響應的 Ref<boolean>
onMounted(() => {
  ProductService.getProductsSmall().then(data => (products.value = data))
})

const products = ref()

const quantity = ref(1)
const inputNumberDt = {
  root: { buttonWidth: '2rem' },
}
const inputNumberPt = {
  pcInputText: {
    root: 'py-1 px-2 !min-w-1 w-10 text-center flex-none',
  },
}

const inputNumberDt2 = {
  root: { buttonWidth: '2.5rem' },
}
const inputNumberPt2 = {
  pcInputText: {
    root: 'py-1 px-2 min-w-1 w-20 text-center',
  },
}

// 這是個別 Column 元件，修改 pt 的方法
// const columnPt = {
//   columnHeaderContent: 'flex justify-center',
// }
const dataTablePT = {
  column: {
    columnHeaderContent: 'justify-center', // 這層才是實際包住文字的 flex container
    bodyCell: 'text-center',
  },
}
const buttonDt = {
  //  var(--p-surface-100)
  root: {
    primaryBackground: 'var(--danger-color)',
    primaryHoverBackground: 'var(--danger-color)',
  },
}
const selectAll = ref(false)
const checked = ref(false)
</script>

<template>
  <div class="relative mx-auto pt-2 max-w-[1000px] min-h-[700px]">
    <DataView :value="products">
      <template #list="slotProps">
        <div class="flex flex-col">
          <div v-for="(item, index) in slotProps.items" :key="index">
            <div class="relative flex sm:flex-row flex-col sm:items-center sm:gap-4 sm:py-3 pt-4 pb-2" :class="{ 'border-t border-surface-200 dark:border-surface-700 ': index !== 0 }">
              <Checkbox v-model="checked" class="sm:mx-4" binary />
              <div data-label="商品圖片" class="relative sm:my-0 mt-1 mb-4 sm:w-32">
                <img class="block xl:block mx-auto rounded w-full" :src="`https://primefaces.org/cdn/primevue/images/product/${item.image}`" :alt="item.name" />
                <div class="absolute bg-black/70 rounded-border" style="left: 4px; top: 4px">
                  <Tag :value="item.inventoryStatus"></Tag>
                </div>
              </div>
              <div class="flex flex-1 justify-between sm:grid sm:grid-cols-[3fr_5fr]">
                <div class="flex flex-row md:flex-col justify-between items-start gap-2">
                  <div>
                    <span class="font-medium text-surface-500 dark:text-surface-400 text-sm">{{ item.category }}</span>
                    <div class="mt-2 font-medium text-lg">
                      {{ item.name }}
                    </div>
                  </div>
                </div>
                <div class="sm:grid sm:grid-cols-[2fr_3fr]">
                  <div data-label="數量" class="flex flex-col items-center mb-4">
                    <InputNumber v-model="quantity" :dt="inputNumberDt" :pt="inputNumberPt" class="mb-2" inputId="horizontal-buttons" showButtons buttonLayout="horizontal" :step="1" :min="1" :max="99">
                      <template #incrementbuttonicon>
                        <span class="pi pi-plus" />
                      </template>
                      <template #decrementbuttonicon>
                        <span class="pi pi-minus" />
                      </template>
                    </InputNumber>
                    <span class="text-center"> 當前總數: 8</span>
                  </div>
                  <div data-label="價格" class="flex flex-col justify-center items-end sm:items-start sm:mr-8 sm:ml-8">
                    <span class="mr-3 sm:mr-0 mb-2 font-semibold text-lg">${{ item.price }}</span>
                    <span class="mr-3 sm:mr-0 text-gray-500 whitespace-nowrap">原價: 988</span>
                    <!-- <div class="flex md:flex-row flex-row-reverse gap-2">
                    </div> -->
                  </div>
                </div>
                <Button icon="pi pi-times" variant="text" size="small" rounded severity="secondary" aria-label="Cancel" class="top-2 md:top-1 right-0 absolute">
                  <template #loadingicon=""></template>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </DataView>

    <div class="bottom-0 sticky !bg-white">
      <Divider />
      <div class="flex justify-between items-center pb-2 px-4">
        <div class="flex items-center">
          <Checkbox v-model="selectAll" inputId="select-all" class="ml-4" binary />
          <label class="ml-2" for="select-all"> 全選 </label>
        </div>
        <div>
          總金額: 0 <Button class="mr-2 ml-8 border-none" :dt="buttonDt" size="small">
            去買單
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<!-- <template #submenuicon="slotProps"></template> -->