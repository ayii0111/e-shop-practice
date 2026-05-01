<script setup lang="ts">
import { Listbox } from 'primevue'

const selectedOption = ref()
const userOptions = ref([
  // { label: '登出', icon: ['fas', 'right-from-bracket'], name: '' },
  { label: '個人資料', icon: ['fas', 'address-card'], name: 'ProfileTabPanel' },
  { label: '我的優惠券 (2)', icon: ['fas', 'ticket'], name: 'CouponTabPanel' },
  { label: '我的訂單', icon: ['fas', 'file-lines'], name: 'OrderlistTabPanel' },
])

const router = useRouter()
watch(selectedOption, (newValue) => {
  router.push({ name: newValue.name })
})
const dtListbox = {
  root: {
    borderColor: 'opacity',
    shadow: 0,
  },
  option: {
    focusBackground: 'opacity',
    selectedBackground: 'red',
    selectedFocusBackground: 'red',
  },
}
</script>

<template>
  <div class="flex p-4">
    <!-- <div class="border-2 rounded-md"> -->
    <div class="">
      <Listbox v-model="selectedOption" :dt="dtListbox" :options="userOptions" optionLabel="label" class="min-w-40" />
    </div>
    <div>
      <RouterView class="min-h-[550px] border" />
    </div>
  </div>
</template>

<style scoped lang="scss"></style>