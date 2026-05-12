<script setup lang="ts">
import { AutoComplete, Button, Select } from 'primevue'
import { Form } from '@primevue/forms'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'

const items = ref([
  { icon: ['fas', 'gift'], category: '全部商品', tabName: 'all', path: '/products-display-body/product-list/all' },
  { icon: ['fas', 'shirt'], category: '上半身', tabName: 'top', path: '/products-display-body/product-list/top' },
  { icon: ['fas', 'socks'], category: '下半身', tabName: 'bottom', path: '/products-display-body/product-list/bottom' },
  { icon: ['fas', 'shoe-prints'], category: '鞋', tabName: 'shoes', path: '/products-display-body/product-list/shoes' },
  { icon: ['fas', 'democrat'], category: '飾品', tabName: 'accessory', path: '/products-display-body/product-list/accessory' },
  { icon: ['fas', 'shopping-bag'], category: '配件', tabName: 'life', path: '/products-display-body/product-list/life' },
])

// #region  標籤樣式:  ------------------------------
const activeTabName = ref('Home')
const route = useRoute()
const router = useRouter()

function decideTabStyle(tabName: string) {
  return computed(() => {
    if (tabName === route.params.productList) { return ['active'] }
    return ['']
  })
}
function clickedTab(tabName: string) {
  activeTabName.value = tabName
}
// #endregion ------------------------------

const breakpoints = useBreakpoints(breakpointsTailwind)
const isDesktop = breakpoints.greaterOrEqual('md') // 自動響應的 Ref<boolean>
// #region  <Form> 元件:  ------------------------------
const initialValues = ref({
  keyword: '',
})
function resolver({ values }: { values: Record<string, any> }) {
  const errors: Record<string, { message: string }[]> = {}

  const keyword = values.keyword?.trim()

  if (!keyword) {
    errors.keyword = [{ message: '請輸入搜尋關鍵字' }]
  }
  else if (keyword.length > 100) {
    errors.keyword = [{ message: '搜尋字串過長（最多 100 字）' }]
  }

  return {
    values, // (Optional) Used to pass current form values to submit event.
    errors,
  }
}

// #region  搜尋歷史紀錄:  ------------------------------
const HISTORY_KEY = 'search_history'
const MAX_HISTORY = 20

// 從 localStorage 讀取歷史紀錄
const initSuggestions = useLocalStorage<string[]>(HISTORY_KEY, [])

// 儲存關鍵字到歷史紀錄
function saveToHistory(keyword: string) {
  const trimmed = keyword.trim()
  if (!trimmed) { return }
  // 去除重複，把最新的放到最前面
  const updated = [trimmed, ...initSuggestions.value.filter(item => item !== trimmed)]
  initSuggestions.value = updated.slice(0, MAX_HISTORY)
}
// #endregion ------------------------------

// 每次輸入框的值改變時就觸發，包含：
// 打每一個英文字母
// 刪除字元
// 貼上文字
// 中文輸入法確認後（注意：中文輸入法組字過程中不會觸發，要按下確認鍵才算）
function search(event: any) {
  if (initSuggestions.value.length === 0) { return }
  const query = event.query.toLowerCase()
  suggestions.value = initSuggestions.value.filter(item => item.toLowerCase().includes(query))
}

const value = ref()
function onFormSubmit({ valid, values }: any) {
  if (valid) {
    saveToHistory(values.keyword)
    router.push({ path: `/products-display-body/product-list/${values.keyword}` })
  }
}
// #endregion ------------------------------

const suggestions = ref([]) as Ref<string[]>

const selectedCategory = ref()

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
</script>

<template>
  <div class="max-md:flex max-sm:flex-col-reverse max-md:items-baseline gap-2">
    <!-- 類別導航 -->
    <div v-if="isDesktop">
      <ul class="mb-4 border border-[rgba(0,0,0,.125)] rounded divide-y divide-[rgba(0,0,0,.125)] text-[--third-color]">
        <li v-for="item in items" :key="item.tabName" class="hover:bg-[var(--gray-bg)]" :class="decideTabStyle(item.tabName).value" @click="clickedTab(item.tabName)">
          <RouterLink :to="item.path" class="block px-5 py-3 size-full">
            <span><font-awesome-icon :icon="item.icon" class="mr-2" /></span>
            <span>{{ item.category }}</span>
          </RouterLink>
        </li>
      </ul>
    </div>
    <!-- 手機裝置版本 -->
    <div v-else class="mr-4 max-sm:w-full">
      <Select v-model="selectedCategory" :dt="dt" :pt="selectPt" :options="items" optionLabel="name" placeholder="商品種類" class="!w-full">
        <template #value="slotProps">
          <div v-if="slotProps.value" class="flex items-center px-3">
            <span><font-awesome-icon :icon="slotProps.value.icon" class="mr-2" /></span>
            <div>{{ slotProps.value.category }}</div>
          </div>
          <span v-else>
            {{ slotProps.placeholder }}
          </span>
        </template>
        <template #option="slotProps">
          <div class="flex items-center px-3">
            <span><font-awesome-icon :icon="slotProps.option.icon" class="mr-2" /></span>
            <div>{{ slotProps.option.category }}</div>
          </div>
        </template>
      </Select>
    </div>

    <!-- 搜尋欄位 -->
    <Form :resolver :initialValues class="flex sm:mb-4 border border-[#ced4da] rounded divide-x divide-[#ced4da] max-sm:w-full max-md:w-[176px] h-[38px] overflow-hidden" @submit="onFormSubmit">
      <AutoComplete v-model="value" name="keyword" class="flex-1" pt:pcInputText:root="w-full rounded-none border-0 shadow-none" :suggestions @complete="search" />
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
