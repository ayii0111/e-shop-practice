import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useToast } from 'primevue/usetoast'

type Severity = 'error' | 'warn' | 'success' | 'info'

export const useToastStore = defineStore('toast', () => {
  // toast 實例在 store 初始化時取得
  // store 必須在 Vue app 掛載後、setup 階段內第一次使用，才能正確取得 PrimeVue 的 toast 實例
  // 之後任何地方（包括非同步函式、其他 store）都可以直接呼叫 show()
  const _toast = ref<ReturnType<typeof useToast> | null>(null)

  function init() {
    // 在元件 setup 階段呼叫一次，初始化 toast 實例
    _toast.value = useToast()
  }

  function show(summary: string, detail: string, severity: Severity = 'error') {
    if (!_toast.value) {
      console.warn('🫥 ToastStore：尚未初始化，請先在 App.vue 的 setup 中呼叫 toastStore.init()')
      return
    }
    _toast.value.add({ severity, summary, detail, life: 10000 })
  }

  return { init, show }
})
