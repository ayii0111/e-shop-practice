<script setup lang="ts">
import { Button, InputText, Toast, useToast } from 'primevue'
// import type { DesignToken, PassThrough } from '@primevue/core'

const toast = useToast()

const email = ref('')
function submit(email: string) {
  // email 的驗證實現
  const regex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
  const isValid = regex.test(email)
  if (isValid) {
    // 寄送訂閱信
    toast.add({ severity: 'success', summary: '訂閱成功', detail: '感謝您的訂閱，我們將會持續提供最新的產品資訊給您。', life: 4000 })
  }
  else {
    toast.add({ severity: 'error', summary: '錯誤', detail: '請輸入正確的電子郵件', life: 4000 })
  }
}

const inputDt = ref({
  root: {
    focusBorderColor: 'var(--gray-icon)',
    focusRing: {
      width: '3px',
      style: 'solid',
      color: 'rgba(var(--dark-button-rgb), .25)',
    },
    transitionDuration: '200ms',
  },
})
const toastDt = ref({
  root: {
    width: '300px',
    borderWidth: '0px',
  },
})
</script>

<template>
  <div class=" px-4 py-20 md:p-20 bg-fixed bg-[url(https://images.unsplash.com/photo-1519974719765-e6559eac2575?auto=format&fit=crop&ixlib=rb-1.2.1&q=80&w=1350)]">
    <Toast :dt="toastDt" />

    <div class="flex flex-col bg-[var(--secondary-color)] px-8 py-12 rounded-[10px]">
      <h3 class="text-shadow mb-6 h3">
        Join our mailing list for updates
      </h3>
      <InputText v-model="email" :dt="inputDt" type="text" class="mb-4" placeholder="Enter your email" />
      <Button label="Submit" class="bg-[var(--dark-button)] px-3 py-[6px] border-[var(--dark-button)] rounded text-white" @click="submit(email)">
        Subscribe Now
      </Button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@font-face {
  font-family: 'Yellowtail';
  /* 載入字型檔案（需指定字體檔案類型） */
  src: url('@/assets/Yellowtail-Regular.ttf') format('opentype');
  font-weight: normal;
  font-style: normal;
}

.text-shadow {
  text-shadow: 1px 1px 1px var(--dark-button);
}

.h3 {
  @apply font-[Yellowtail] text-[28px] text-white text-center leading-[33.6px];
}
</style>
