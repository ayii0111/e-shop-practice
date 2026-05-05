<script setup lang="ts">
import { Breadcrumb } from 'primevue'
import { ProductList, SideNavbar } from './ProductCategory'

const home = ref({
  label: 'Home',
  to: '/',
})

const route = useRoute()

const breadcrumbItems = computed(() => {
  const items: string[] = route.fullPath.split('/').slice(1)

  // 提取路由路徑最後的字串
  const lastSegment = items[items.length - 1] || ''

  // 將 a,b,c
  // 轉換成 /a , /a/b, /a/b/c
  // const _paths = items.reduce((last, current, index) => {
  //   if (index === 0) { return [`/${current}`] }
  //   last[index] = `${last[index - 1]}/${current}`
  //   return last
  // }, [] as string[])

  // // 把麵包屑的 products 位址：改成 /products/all
  // const paths = _paths.map((path) => {
  //   if (path === '/productCategory') { return '/productCategory/all' }
  //   return path
  // })
  return [{ label: lastSegment, disabled: true }]
  // 建構元件所需的數據格式 [ ..., { label: 'ALL', to: '/productCategory/all', disabled: true }]
  // return items.map((item, index) => {
  //   // 如果是最後一個項目，使用提取的最後字串
  //   const label = index === items.length - 1
  //     ? lastSegment.toUpperCase()
  //     : item[0].toUpperCase() + item.slice(1)

  //   return {
  //     label: lastSegment,
  //     to: paths[index],
  //     disabled: false,
  //     //  () => {
  //     //   if (index === items.length - 1) { return true }
  //     //   if (item === 'Products' && items[-1] === 'all') { return true }
  //     //   return false
  //     // },
  //   }
  // })
})
</script>

<template>
  <div class="max-sm:flex max-sm:flex-col max-sm:items-center">
    <Breadcrumb :home="home" :model="breadcrumbItems" class="bg-[--gray-bg] mb-4 px-4 py-3 max-sm:w-full">
      <template #item="{ item }">
        {{ item.label }}
        <!-- <RouterLink :to="item.to">
          <span> {{ item.label }} </span>
        </RouterLink> -->
        <!-- <a class="cursor-pointer" :href="item.to"></a> -->
      </template>
      <template #separator>
        /
      </template>
    </Breadcrumb>
    <div class="relative max-sm:flex max-sm:flex-col gap-2 sm:gap-[32px] md:grid md:grid-cols-12">
      <SideNavbar class="md:top-[16px] md:sticky md:self-start md:col-span-3 lg:col-span-2" />
      <!-- <ProductList class="md:col-span-9 lg:col-span-10 h-[1500px]" /> -->
      <RouterView class="md:col-span-9 lg:col-span-10 h-[1500px]" />
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
