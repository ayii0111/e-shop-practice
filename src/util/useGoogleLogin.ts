import { ref } from 'vue'
import { useWarpToast } from './useWarpToast'

// PKCE 工具函式：產生隨機的 code_verifier
function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  // 轉成 base64url 格式
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

// PKCE 工具函式：把 code_verifier 做 SHA-256 hash 產生 code_challenge
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * Google OAuth 登入（PKCE flow），抽出來讓 Header 上任何需要「未登入時點擊觸發登入」的
 * icon（購物車、收藏…）都能共用同一套邏輯，不用各自重寫一份
 */
export function useGoogleLogin() {
  const loading = ref(false)

  async function loginWithGoogle() {
    loading.value = true

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string

      // PKCE 第一步：產生 code_verifier 並存到 sessionStorage，等重導向回來後使用
      const codeVerifier = generateCodeVerifier()
      sessionStorage.setItem('pkce_code_verifier', codeVerifier)

      // 記住登入前用戶瀏覽到一半的頁面，登入後導回（使用 hash，因為 router 用 createWebHashHistory）
      sessionStorage.setItem('login_redirect', window.location.hash || '#/')

      // PKCE 第二步：產生 code_challenge 帶進授權 URL
      const codeChallenge = await generateCodeChallenge(codeVerifier)

      // 組出 Supabase OAuth 授權 URL，讓瀏覽器跳頁到 Google 登入頁
      // 在 Supabase 後台設定的跳轉回來的白名單網址，他是固定的，因此無法由這裡去設計，每次登入回來的頁面，就是你登入前瀏覽到一半的頁面
      const redirectTo = encodeURIComponent(`${window.location.origin}${import.meta.env.BASE_URL}`)
      // 透過頁面跳轉導航到 Supabase 處理授權的端點
      window.location.href
        = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${redirectTo}&code_challenge=${codeChallenge}&code_challenge_method=s256`
    }
    catch (error: any) {
      useWarpToast('跳轉登入頁面前，發生錯誤', error.message)
      loading.value = false
    }
  }

  return { loginWithGoogle, loading }
}
