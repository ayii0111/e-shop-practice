<script setup>
import { Button, Checkbox, Column, DataTable, Divider, InputNumber } from 'primevue'
import { ProductService } from './LikeList'

onMounted(() => {
  ProductService.getProductsSmall().then(data => (products.value = data))
})

const op = ref()
const products = ref()
const selectedProduct = ref()

function displayProduct(event, product) {
  op.value.hide()

  if (selectedProduct.value?.id === product.id) {
    selectedProduct.value = null
  }
  else {
    selectedProduct.value = product

    nextTick(() => {
      op.value.show(event)
    })
  }
}

function toggle(event) {
  op.value.toggle(event)
}

const quantity = ref(1)
const inputNumberDt = {
  root: { buttonWidth: '1.5rem' },
}
const inputNumberPt = {
  pcInputText: {
    root: 'py-1 px-2 min-w-1 w-10 text-center',
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
</script>

<template>
  <div class="mx-auto py-2 max-w-[1000px] min-h-[700px]">
    <DataTable :pt="dataTablePT" :value="products" class="mx-4 border-t border-r border-l">
      <Column field="check" class="p-0 border-r w-10 text-center">
        <template #header>
          <Checkbox v-model="selectAll" binary />
        </template>
        <template #body>
          <Checkbox v-model="checked" binary />
        </template>
      </Column>
      <Column header="商品圖" class="w-1/6">
        <template #body="slotProps">
          <div class="flex justify-center">
            <img :src="`https://primefaces.org/cdn/primevue/images/product/${slotProps.data.image}`" :alt="slotProps.data.image" class="shadow-sm w-16" />
          </div>
        </template>
      </Column>
      <Column field="name" header="商品" class="w-1/6" bodyClass="whitespace-nowrap"></Column>
      <Column field="price" header="售價" class="w-1/6">
      </Column>

      <Column header="數量" class="w-1/6">
        <template #body>
          <InputNumber v-model="quantity" :dt="inputNumberDt" :pt="inputNumberPt" class="" inputId="horizontal-buttons" showButtons buttonLayout="horizontal" :step="1" :min="1" :max="99">
            <template #incrementbuttonicon>
              <span class="pi pi-plus" />
            </template>
            <template #decrementbuttonicon>
              <span class="pi pi-minus" />
            </template>
          </InputNumber>
        </template>
      </Column>
      <Column header="" class=""></Column>
      <Column header="小計" class="w-1/6">
        <template #body="slotProps">
          100
        </template>
      </Column>
    </DataTable>
    <Divider />

    <div class="flex justify-between items-center m-4">
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
</template>

<!-- <template #submenuicon="slotProps"></template> -->