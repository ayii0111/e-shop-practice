<script setup lang="ts">
import { Breadcrumb } from 'primevue'

const home = ref({
  label: 'Home',
  to: '/',
})

const route = useRoute()

const breadcrumbItems = computed(() => {
  const items: string[] = route.fullPath.split('/').slice(1)
  // 將 a,b,c
  // 轉換成 /a , /a/b, /a/b/c
  const _paths = items.reduce((last, current, index) => {
    if (index === 0) { return [`/${current}`] }
    last[index] = `${last[index - 1]}/${current}`
    return last
  }, [] as string[])

  // 把麵包屑的 products 位址：改成 /products/all
  const paths = _paths.map((path) => {
    if (path === '/products') { return '/products/all' }
    return path
  })
  // 建構元件所需的數據格式 [ ..., { label: 'ALL', to: '/products/all', disabled: true }]
  return items.map((item, index) => ({
    label: item[0].toUpperCase() + item.slice(1),
    to: paths[index],
    disabled: () => {
      if (index === items.length - 1) { return true }
      if (item === 'Products' && items[-1] === 'all') { return true }
      return false
    },
  }))
})
console.log('breadcrumbItems', breadcrumbItems.value)
</script>

<template>
  <div>
    <Breadcrumb :home="home" :model="breadcrumbItems" class="bg-[--gray-bg] mb-4 py-3 px-4">
      <template #item="{ item }">
        <RouterLink :to="item.to">
          <span> {{ item.label }} </span>
        </RouterLink>
        <!-- <a class="cursor-pointer" :href="item.to"></a> -->
      </template>
      <template #separator>
        /
      </template>
    </Breadcrumb>
    <RouterView />
    <div class="grid grid-cols-6 gap-[32px] relative items-start">
      <RouterView class="col-span-1  sticky top-[16px]" name="SideNavbar" />
      <RouterView class="col-span-5 h-[1500px] " name="ProductList" />
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
