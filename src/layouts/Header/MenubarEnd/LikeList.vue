<script setup>
import { Button, Column, DataTable, Popover } from 'primevue'
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
const dt = ref({
  root: {
    arrowOffset: '10px',
  },
})
</script>

<template>
  <slot :toggle="toggle">
    <Button type="button" icon="pi pi-share-alt" label="Share" @click="toggle" />
  </slot>
  <Popover ref="op" :dt="dt" class="right-[10px] !left-auto">
    <div class="w-[400px] card">
      <DataTable :value="products" :rows="5" paginator tableStyle="" class="w-full">
        <Column field="name" header="Name" class="w-1/6" bodyClass="whitespace-nowrap"></Column>
        <Column field="price" header="Price" sortable class="w-1/6">
          <template #body="slotProps">
            $ {{ slotProps.data.price }}
          </template>
        </Column>
        <Column header="Image" class="w-1/6">
          <template #body="slotProps">
            <img :src="`https://primefaces.org/cdn/primevue/images/product/${slotProps.data.image}`" :alt="slotProps.data.image" class="shadow-sm w-16" />
          </template>
        </Column>
        <Column header="Details" class="w-1/6">
          <template #body="slotProps">
            <Button type="button" icon="pi pi-search" severity="secondary" rounded @click="displayProduct($event, slotProps.data)"></Button>
          </template>
        </Column>
      </DataTable>
    </div>
  </Popover>
</template>

<!-- <template #submenuicon="slotProps"></template> -->