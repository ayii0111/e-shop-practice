import { useToastStore } from '@stores/useToastStore'

// 直接從 toastStore 取得 show，可在任何地方（包括非同步函式）安全呼叫
// toastStore 在 App.vue 的 setup 中已初始化，不需要每個元件再呼叫一次
export function useWarpToast(summary: string, detail: string, severity: 'error' | 'warn' | 'success' | 'info' = 'error') {
  const toastStore = useToastStore()
  toastStore.show(summary, detail, severity)
}
