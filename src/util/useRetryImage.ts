import { ref, watch } from 'vue'

/**
 * 圖片載入失敗自動重試（例如 Google 頭像網址剛授權完成時，CDN 短暫還沒就緒）
 * 用 cache-busting query 參數強迫瀏覽器重新發送請求，而非沿用同一個失敗過的網址
 *
 * ⚠️ 沒有網址（例如該 Google 帳號本來就沒設定大頭貼）時，img 不會觸發 load/error，
 * 若沒有 hasSrc 這個判斷，畫面會卡在 Skeleton 永遠讀不完
 */
export function useRetryImage(src: () => string, maxRetries = 3, retryDelayMs = 1000) {
  const loaded = ref(false)
  const attempt = ref(0)
  const currentSrc = ref('')
  const hasSrc = ref(false)

  function buildSrc() {
    const base = src()
    if (!base) { return '' }
    return attempt.value === 0 ? base : `${base}${base.includes('?') ? '&' : '?'}retry=${attempt.value}`
  }

  function onLoad() {
    loaded.value = true
  }

  function onError() {
    if (attempt.value >= maxRetries) { return }
    setTimeout(() => {
      attempt.value += 1
      currentSrc.value = buildSrc()
    }, retryDelayMs)
  }

  watch(src, (value) => {
    attempt.value = 0
    loaded.value = false
    hasSrc.value = !!value
    currentSrc.value = buildSrc()
  }, { immediate: true })

  return { currentSrc, loaded, hasSrc, onLoad, onError }
}
