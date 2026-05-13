<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Listbox, Popover } from 'primevue'
import axios from 'axios'
import { debugLog, useWarpToast } from '@util'
import { useAuthStore } from '@stores/useAuthStore'

const loading = ref(false)
const authStore = useAuthStore()

// #region 第三方登入驗證: ------------------------------
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

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

async function loginWithGoogle() {
  loading.value = true

  try {
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

// 重導向回來後，手動用 axios 把 URL 上的 code 換成 access_token
async function exchangeCodeForToken() {
  // 最終 Supabase 頁面跳轉導航回到你原本的頁面時，我們要取出 url 中的 params 字段
  // 跳回原頁面的 url 後面添加 ?... 的 params 字段，vue-router 依然會導回到原 rul
  // 而後面的字段主要用於傳輸「授權 code」數據
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  if (!code) {
    return
  }

  try {
    // 取出跳頁前存好的 code_verifier
    const codeVerifier = sessionStorage.getItem('pkce_code_verifier')
    if (!codeVerifier) {
      // error.value = '找不到 code_verifier，請重新登入'
      useWarpToast('登入失敗', '找不到 code_verifier，請重新登入')
      return
    }

    // 打 Supabase token exchange API，把 code 換成 access_token
    const [respError, resp] = await to(axios.post(
      `${supabaseUrl}/auth/v1/token?grant_type=pkce`,
      { auth_code: code, code_verifier: codeVerifier },
      { headers: { 'apikey': supabasePublishableKey, 'Content-Type': 'application/json' } },
    )) as [Error, any]

    if (respError) {
      useWarpToast('登入失敗', respError.message)
      debugLog('登入失敗', () => respError)
      return
    }
    // 登入成功，統一由 authStore 寫入 localStorage
    authStore.setAuth(resp.data.user, resp.data.access_token, resp.data.refresh_token)

    // 清除 URL 上的 code，避免重新整理時重複換 token
    window.history.replaceState({}, '', window.location.pathname)

    // 登入成功後導回登入前的頁面，若無記錄則回首頁
    const redirectHash = sessionStorage.getItem('login_redirect') || '#/'
    sessionStorage.removeItem('login_redirect')
    window.location.hash = redirectHash
  }
  catch (error: any) {
    useWarpToast('登入失敗', error.message)
  }
}

async function logout() {
  // 統一由 authStore 清除所有 auth 資料與 localStorage
  authStore.clearAuth()
  router.push({ name: 'Home' })
}
onMounted(async () => {
  // 這裡只需處理從 OAuth 跳回來的情況
  await exchangeCodeForToken()
})
// #endregion ------------------------------
// #region  頭像選單: 涵蓋元件 <Popover> <Listbox> ------------------------------

const selectedUserOption = ref()

const userOptions = ref([
  { label: '登出', icon: ['fas', 'right-from-bracket'], routeName: '' },
  { label: '個人資料', icon: ['fas', 'address-card'], routeName: 'ProfileTabPanel' },
  { label: '我的優惠券 (2)', icon: ['fas', 'ticket'], routeName: 'CouponTabPanel' },
  { label: '我的訂單', icon: ['fas', 'file-lines'], routeName: 'OrderlistTabPanel' },
])

const router = useRouter()
const popoverOpreation = ref()
const toggle = (event: any) => popoverOpreation.value.toggle(event)

watch(selectedUserOption, (newValue) => {
  if (!newValue) { return }

  if (newValue.label === '登出') {
    logout()
  }
  else if (newValue.routeName) {
    router.push({ name: newValue.routeName })
    toggle('')
  }

  // 每次點擊完，都重置選擇的選項
  // selectedUserOption.value = null
})
const listBoxDt = {
  root: {
    borderColor: 'opacity',
    optionSelectedBackground: 'opacity',
    optionFocusBackground: 'opacity',
  },
}
const popoverDt = {
  root: {
    contentPadding: 0,
    arrowOffset: '12px',
  },
}

// #endregion ------------------------------
</script>

<template>
  <div class="">
    <!-- 未登入狀態 -->
    <div v-if="!authStore.user">
      <slot :loginWithGoogle>
        <button class="bg-blue-500 hover:bg-blue-700 px-4 py-2 rounded font-bold text-white" :disabled="loading" @click="loginWithGoogle">
          未登入，應登入
        </button>
      </slot>
    </div>
    <!-- 已登入狀態 -->
    <div v-else class="border border-gray-300 rounded-full">
      <!-- <img :src="authStore.user.user_metadata.avatar_url" class="rounded-full size-6" alt=""> -->
      <div class="flex justify-center card">
        <button type="button" class="" @click="toggle">
          <img :src="authStore.user?.user_metadata?.avatar_url" class="rounded-full size-6" alt="">
        </button>

        <Popover ref="popoverOpreation" :dt="popoverDt">
          <div>
            <Listbox v-model="selectedUserOption" :dt="listBoxDt" :options="userOptions" optionLabel="label">
              <template #option="slotProps">
                <div class="flex items-center">
                  <span><font-awesome-icon :icon="slotProps.option.icon" class="mr-2" /></span>

                  <div>{{ slotProps.option.label }}</div>
                </div>
              </template>
            </Listbox>
          </div>
        </Popover>
      </div>
    </div>
  </div>
</template>
