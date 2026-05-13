import axios from 'axios'
import router from '../router'
import { debugLog } from "@util";

// 建立 Axios 實例用於 Supabase REST API
export const supabaseApi = axios.create({
  baseURL: `${import.meta.env.VITE_SUPABASE_URL}/rest/v1`,
  headers: {
    'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    'Content-Type': 'application/json',
  },
})

// 建立 Axios 實例用於 Supabase Auth API
export const supabaseAuth = axios.create({
  baseURL: `${import.meta.env.VITE_SUPABASE_URL}/auth/v1`,
  headers: {
    'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    'Content-Type': 'application/json',
  },
})

// ─── Request Interceptor ────────────────────────────────────────────────────
// 每次請求前自動從 localStorage 取得最新 token 注入 Authorization header
// 不在 axios.create 時寫死，是因為 token 可能在 refresh 後更新，
// 每次請求都重新讀取才能確保使用最新的 token
function attachToken (config: any) {
  const token = localStorage.getItem('sb_access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  else {
    // 未登入時退回 publishable key，讓公開資料（商品列表等）仍可存取
    config.headers.Authorization = `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
  }
  return config
}

supabaseApi.interceptors.request.use(attachToken)
supabaseAuth.interceptors.request.use(attachToken)

// ─── Response Interceptor ───────────────────────────────────────────────────
// 統一攔截 401，處理 token 過期的情況
// 設計決策：
//   - 收到 401 → 先嘗試用 refresh token 換新的 access token（靜默續期）
//   - refresh 成功 → 更新 localStorage，重送原本的請求，用戶無感知
//   - refresh 失敗 → refresh token 也失效（過期 / 被撤銷），
//     此時已無任何可用憑證，清除 localStorage 並導向首頁，顯示提示

// 防止 refresh 同時被多個 401 觸發重複呼叫
let isRefreshing = false
// 在 refresh 進行中，暫存其他等待中的請求，refresh 完成後一併重送
let pendingRequests: Array<(token: string) => void> = []

async function handleTokenRefresh () {
  const refreshToken = localStorage.getItem('sb_refresh_token')
  if (!refreshToken) { throw new Error('no refresh token') }

  // 直接用裸 axios 呼叫，避免觸發自身的 interceptor 造成無限循環
  const resp = await axios.post(
    `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
    { refresh_token: refreshToken },
    {
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        'Content-Type': 'application/json',
      },
    },
  )

  const { access_token, refresh_token } = resp.data
  localStorage.setItem('sb_access_token', access_token)
  // Supabase 每次 refresh 都會換發新的 refresh token，需一併更新
  if (refresh_token) { localStorage.setItem('sb_refresh_token', refresh_token) }

  return access_token
}

function clearAuthAndRedirect () {
  // 清除所有 auth 相關資料
  localStorage.removeItem('sb_access_token')
  localStorage.removeItem('sb_refresh_token')
  localStorage.removeItem('sb_user')

  // 導向首頁並顯示提示
  // 使用 router.push 而非 window.location，保持 SPA 不重整頁面
  router.push({ name: 'Home' })

  // 透過自訂事件通知 UI 層顯示 toast，
  // 避免在 service 層直接依賴 PrimeVue 的 useToast（關注點分離）
  window.dispatchEvent(new CustomEvent('auth:session-expired'))
}

function applyResponseInterceptor (instance: typeof supabaseApi) {
  instance.interceptors.response.use(
    // 成功直接放行
    response => response,
    async (error) => {
      const originalRequest = error.config

      // 只處理 401，且避免 refresh 請求本身的 401 再次觸發（_retry 旗標）
      if (error.response?.status !== 401 || originalRequest._retry) {
        return Promise.reject(error)
      }

      if (isRefreshing) {
        // 已有 refresh 進行中，將此請求加入等待佇列
        // refresh 完成後會統一重送
        return new Promise((resolve) => {
          pendingRequests.push((newToken: string) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            resolve(instance(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const newToken = await handleTokenRefresh()

        // 通知所有等待中的請求使用新 token
        pendingRequests.forEach(cb => cb(newToken))
        pendingRequests = []

        // 重送原本的請求
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return instance(originalRequest)
      }
      catch {
        // refresh 失敗：session 完全失效，清除並導向首頁
        pendingRequests = []
        clearAuthAndRedirect()
        return Promise.reject(error)
      }
      finally {
        isRefreshing = false
      }
    },
  )
}

applyResponseInterceptor(supabaseApi)
applyResponseInterceptor(supabaseAuth)
