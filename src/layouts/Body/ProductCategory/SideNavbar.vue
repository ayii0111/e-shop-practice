<script setup lang="ts">
import { AutoComplete, Button, Select } from 'primevue'

import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'

const items = ref([
  { icon: ['fas', 'gift'], Category: '全部商品', tabName: 'all', path: '/productCategory/ProductList/all' },
  { icon: ['fas', 'shirt'], Category: '上半身', tabName: 'top', path: '/productCategory/ProductList/top' },
  { icon: ['fas', 'socks'], Category: '下半身', tabName: 'bottom', path: '/productCategory/ProductList/bottom' },
  { icon: ['fas', 'shoe-prints'], Category: '鞋', tabName: 'shoes', path: '/productCategory/ProductList/shoes' },
  { icon: ['fas', 'democrat'], Category: '飾品', tabName: 'accessory', path: '/productCategory/ProductList/accessory' },
  { icon: ['fas', 'shopping-bag'], Category: '配件', tabName: 'life', path: '/productCategory/ProductList/life' },
])

// ------------------------------ 標籤樣式(起) ------------------------------

const activeTabName = ref('Home')
const route = useRoute()
function decideTabStyle(tabName: string) {
  return computed(() => {
    if (tabName === route.params.category) { return ['active'] }
    return ['']
  })
}
function clickedTab(tabName: string) {
  activeTabName.value = tabName
}
// ------------------------------ 標籤樣式(迄) ------------------------------

const initialValues = ref({
  country: { name: '' },
})
const resolver = ref()
function search(event: any) {
  arr.value = [...Array(10).keys()].map(item => `${event.query}-${item}`)
}

function onFormSubmit({ valid }: any) {
  if (valid) {
    console.log('valid', valid)
  }
}

const value = ref('')
const arr = ref([]) as Ref<string[]>

const selectedCategory = ref()

const router = useRouter()
watch(selectedCategory, (newValue) => {
  router.push(newValue.path)
})
const dt = {
  root: {
    color: '#fff',
    background: 'var(--secondary-color)',
    borderColor: 'var(--secondary-color)',
    focusBorderColor: 'var(--secondary-color)',
    hoverBorderColor: 'var(--secondary-color)',
    placeholderColor: '#fff',
  },
  dropdownColor: '#fff',
}

const selectPt = {
  overlay: {
    style: {
      '--p-select-option-focus-background': 'transparent',
      '--p-select-option-focus-color': 'var(--secondary-color)',
      '--p-select-option-selected-background': 'var(--secondary-color)',
      '--p-select-option-selected-focus-background': 'var(--secondary-color)',
      '--p-select-option-color': 'var(--secondary-color)',
      '--p-select-option-selected-color': '#fff',
      '--p-select-option-selected-focus-color': '#fff',
    },
  },
}

const breakpoints = useBreakpoints(breakpointsTailwind)
const isMobile = breakpoints.smaller('md') // 自動響應的 Ref<boolean>
</script>

<template>
  <div class="max-md:flex max-sm:flex-col-reverse max-md:items-baseline gap-2">
    <div v-if="!isMobile">
      <ul class="mb-4 border border-[rgba(0,0,0,.125)] rounded divide-y divide-[rgba(0,0,0,.125)] text-[--third-color]">
        <li v-for="item in items" :key="item.tabName" class="hover:bg-[var(--gray-bg)]" :class="decideTabStyle(item.tabName).value" @click="clickedTab(item.tabName)">
          <RouterLink :to="item.path" class="block px-5 py-3 size-full">
            <span><font-awesome-icon :icon="item.icon" class="mr-2" /></span>
            <span>{{ item.Category }}</span>
          </RouterLink>
        </li>
      </ul>
    </div>
    <div v-else class="mr-4 max-sm:w-full">
      <Select v-model="selectedCategory" :dt="dt" :pt="selectPt" :options="items" optionLabel="name" placeholder="商品種類" class="!w-full">
        <template #value="slotProps">
          <div v-if="slotProps.value" class="flex items-center px-3">
            <span><font-awesome-icon :icon="slotProps.value.icon" class="mr-2" /></span>
            <div>{{ slotProps.value.Category }}</div>
          </div>
          <span v-else>
            {{ slotProps.placeholder }}
          </span>
        </template>
        <template #option="slotProps">
          <div class="flex items-center px-3">
            <span><font-awesome-icon :icon="slotProps.option.icon" class="mr-2" /></span>
            <div>{{ slotProps.option.Category }}</div>
          </div>
        </template>
      </Select>
    </div>

    <!-- <Form v-slot="$form" :resolver="resolver" :initialValues="initialValues" class="flex mb-4 border border-[#ced4da] rounded divide-x divide-[#ced4da] h-[38px] overflow-hidden" @submit="onFormSubmit"> -->
    <Form :resolver="resolver" :initialValues="initialValues" class="flex sm:mb-4 border border-[#ced4da] rounded divide-x divide-[#ced4da] max-sm:w-full max-md:w-[176px] h-[38px] overflow-hidden" @submit="onFormSubmit">
      <AutoComplete v-model="value" class="flex-1" pt:pcInputText:root="w-full rounded-none border-0 shadow-none" :suggestions="arr" @complete="search" />
      <Button class="flex-none shadow-none px-[12px] border-0 rounded-none" type="submit" severity="secondary" label="">
        <font-awesome-icon :icon="['fas', 'search']" />
      </Button>
    </Form>
  </div>
</template>

<style scoped lang="scss">
.active {
  color: #fff;
  background-color: var(--secondary-color);
  border-color: var(--secondary-color);
}
</style>
