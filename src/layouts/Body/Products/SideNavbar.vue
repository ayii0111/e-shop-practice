<script setup lang="ts">
import { AutoComplete, Button } from 'primevue'

const items = reactive([
  { icon: ['fas', 'gift'], en: 'ALL', cn: '全部商品', tabName: 'all', path: '/products/all' },
  { icon: ['fas', 'shirt'], en: 'TOP', cn: '上半身', tabName: 'top', path: '/products/top' },
  { icon: ['fas', 'socks'], en: 'BOTTOM', cn: '下半身', tabName: 'bottom', path: '/products/bottom' },
  { icon: ['fas', 'shoe-prints'], en: 'SHOES', cn: '鞋', tabName: 'shoes', path: '/products/shoes' },
  { icon: ['fas', 'democrat'], en: 'ACCESSORY', cn: '飾品', tabName: 'accessory', path: '/products/accessory' },
  { icon: ['fas', 'shopping-bag'], en: 'LIFE', cn: '配件', tabName: 'life', path: '/products/life' },
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
</script>

<template>
  <div>
    <ul class="text-[--secondary-text-color] mb-4 rounded border-[rgba(0,0,0,.125)] border divide-y divide-[rgba(0,0,0,.125)]">
      <li v-for="item in items" :key="item.en" class=" hover:bg-[#f5f5f5]" :class="decideTabStyle(item.tabName).value" @click="clickedTab(item.tabName)">
        <RouterLink :to="item.path" class="block size-full px-5 py-3">
          <span><font-awesome-icon :icon="item.icon" class="mr-2" /></span>
          <span>{{ item.cn }}</span>
        </RouterLink>
      </li>
    </ul>

    <!-- <Form v-slot="$form" :resolver="resolver" :initialValues="initialValues" class="overflow-hidden  mb-4 flex h-[38px] rounded border-[#ced4da] border divide-x divide-[#ced4da]" @submit="onFormSubmit"> -->
    <Form :resolver="resolver" :initialValues="initialValues" class="overflow-hidden  mb-4 flex h-[38px] rounded border-[#ced4da] border divide-x divide-[#ced4da]" @submit="onFormSubmit">
      <AutoComplete v-model="value" class="flex-1" pt:pcInputText:root="w-full rounded-none border-0 shadow-none" :suggestions="arr" @complete="search" />
      <Button class="px-[12px]  rounded-none flex-none  border-0 shadow-none" type="submit" severity="secondary" label="">
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
