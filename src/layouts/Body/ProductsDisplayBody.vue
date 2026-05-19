<script setup lang="ts">
import { Breadcrumb } from 'primevue'
import { SideNavbar } from './ProductDisplay'

const route = useRoute()

// #region: <Breadcrumb> 依賴 ------------------------------
const home = ref({
  label: 'Home',
  to: '/',
})

// 依賴 route.fullPath
const breadcrumbItems = computed(() => {
  const items: string[] = route.fullPath.split('/').slice(1)
  // 提取路由路徑最後的字串
  const lastSegment = items[items.length - 1] || ''
  return [{ label: lastSegment, disabled: true }]
})
// #endregion ------------------------------
</script>

<template>
  <div class="max-sm:flex max-sm:flex-col max-sm:items-center ">
    <Breadcrumb :home="home" :model="breadcrumbItems" class="max-sm:hidden bg-[--gray-bg] mb-4 px-4 py-3 max-sm:w-full">
      <template #item="{ item }">
        {{ item.label }}
      </template>
      <template #separator>
        /
      </template>
    </Breadcrumb>
    <div class="relative max-sm:flex max-sm:flex-col gap-2 sm:gap-[32px] md:grid md:grid-cols-12">
      <SideNavbar class="md:top-[16px] md:sticky md:self-start md:col-span-3 lg:col-span-2" />
      <RouterView class="md:col-span-9 lg:col-span-10 min-h-[600px]" />
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
