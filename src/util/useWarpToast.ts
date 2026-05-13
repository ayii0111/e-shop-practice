import { useToast } from 'primevue/usetoast'

export function useWarpToast(summary: string, detail: string) {
  const toast = useToast()
  toast.add({
    severity: 'error',
    summary,
    detail,
    life: 10000,
  })
}
