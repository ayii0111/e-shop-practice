<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Listbox, Popover } from 'primevue'

import axios from 'axios'

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
  error.value = null
  try {
    // PKCE 第一步：產生 code_verifier 並存到 sessionStorage，等重導向回來後使用
    const codeVerifier = generateCodeVerifier()
    sessionStorage.setItem('pkce_code_verifier', codeVerifier)

    // PKCE 第二步：產生 code_challenge 帶進授權 URL
    const codeChallenge = await generateCodeChallenge(codeVerifier)

    // 組出 Supabase OAuth 授權 URL，讓瀏覽器跳頁到 Google 登入頁
    // 要重新跳轉回來的頁面
    // const redirectTo = encodeURIComponent(`${window.location.origin}/assignment3`)
    const redirectTo = encodeURIComponent(`${window.location.origin}${import.meta.env.BASE_URL}`)
    // 透過頁面跳轉導航到 Supabase 處理授權的端點
    window.location.href = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${redirectTo}&code_challenge=${codeChallenge}&code_challenge_method=s256`
  }
  catch (err: any) {
    error.value = err.message
    loading.value = false
  }
}

const userStore = ref({}) as Ref<{ user: any, access_token?: string }>

// 重導向回來後，手動用 axios 把 URL 上的 code 換成 access_token
async function exchangeCodeForToken() {
  // 最終 Supabase 頁面跳轉導航回到你原本的頁面時，我們要取出 url 中的 params 字段
  // 跳回原頁面的 url 後面添加 ?... 的 params 字段，vue-router 依然會導回到原 rul
  // 而後面的字段主要用於傳輸「授權 code」數據
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  if (!code) { return }

  try {
    // 取出跳頁前存好的 code_verifier
    const codeVerifier = sessionStorage.getItem('pkce_code_verifier')
    if (!codeVerifier) {
      error.value = '找不到 code_verifier，請重新登入'
      return
    }

    // 打 Supabase token exchange API，把 code 換成 access_token
    const res = await axios.post(
      `${supabaseUrl}/auth/v1/token?grant_type=pkce`,
      { auth_code: code, code_verifier: codeVerifier },
      { headers: { 'apikey': supabasePublishableKey, 'Content-Type': 'application/json' } },
    )

    userStore.value.user = res.data.user
    userStore.value.access_token = res.data.access_token
    localStorage.setItem('sb_user', JSON.stringify(res.data.user))
    localStorage.setItem('sb_access_token', res.data.access_token)
    localStorage.setItem('sb_refresh_token', res.data.refresh_token)

    // 清除 URL 上的 code，避免重新整理時重複換 token
    window.history.replaceState({}, '', window.location.pathname)
  }
  catch (err: any) {
    error.value = err.response?.data?.msg ?? err.message
  }
}

async function logout() {
  // Supabase OAuth 登出不需要呼叫 API
  // 只需要清除本地的 token 和用戶數據即可
  // 因為 OAuth token 是由 Google 管理的，Supabase 只是中介

  // 清除本地數據
  userStore.value.user = null
  userStore.value.access_token = undefined
  localStorage.removeItem('sb_user')
  localStorage.removeItem('sb_access_token')
  localStorage.removeItem('sb_refresh_token')
  sessionStorage.removeItem('pkce_code_verifier')

  // 導航到首頁
  router.push({ name: 'Home' })
}
onMounted(async () => {
  // 1. 先從 localStorage 還原登入狀態（處理重整的情況）
  const savedUser = localStorage.getItem('sb_user')
  const savedToken = localStorage.getItem('sb_access_token')
  if (savedUser && savedToken) {
    userStore.value.user = JSON.parse(savedUser)
    userStore.value.access_token = savedToken
  }
  console.log('savedUser', JSON.parse(savedUser!))

  // 2. 再檢查是否是從 OAuth 跳回來（有 code 才會執行，沒有就直接 return）
  await exchangeCodeForToken()
})
// #endregion ------------------------------
// #region  頭像選單: 涵蓋元件 <Popover> <Listbox> ------------------------------
const loading = ref(false)
const error = ref<string | null>(null)

const op = ref()
function toggle(event: any) {
  op.value.toggle(event)
}
const selectedUserOption = ref()

const userOptions = ref([
  { label: '登出', icon: ['fas', 'right-from-bracket'], name: '' },
  { label: '個人資料', icon: ['fas', 'address-card'], name: 'ProfileTabPanel' },
  { label: '我的優惠券 (2)', icon: ['fas', 'ticket'], name: 'CouponTabPanel' },
  { label: '我的訂單', icon: ['fas', 'file-lines'], name: 'OrderlistTabPanel' },
])

const router = useRouter()
watch(selectedUserOption, (newValue) => {
  if (!newValue) { return }

  if (newValue.label === '登出') {
    logout()
  }
  else if (newValue.name) {
    router.push({ name: newValue.name })
    toggle(undefined)
  }

  // 重置選擇，避免無法重複點擊同一選項
  selectedUserOption.value = null
})
const dtListbox = {
  root: {
    borderColor: 'opacity',
  },
}
const dtPopover = {
  root: {
    contentPadding: 0,
  },
}

// #endregion ------------------------------
</script>

<template>
  <div class="">
    <!-- 未登入狀態 -->
    <div v-if="!userStore.user">
      <slot :loginWithGoogle>
        <button class="bg-blue-500 hover:bg-blue-700 px-4 py-2 rounded font-bold text-white" :disabled="loading" @click="loginWithGoogle">
          未登入，應登入
        </button>
      </slot>
    </div>
    <!-- 已登入狀態 -->
    <div v-else class="border border-gray-300 rounded-full">
      <!-- <img :src="userStore.user.user_metadata.avatar_url" class="rounded-full size-6" alt=""> -->
      <div class="flex justify-center card">
        <button type="button" class="" @click="toggle">
          <img :src="userStore.user.user_metadata.avatar_url" class="rounded-full size-6" alt="">
        </button>

        <Popover ref="op" :dt="dtPopover">
          <div>
            <Listbox v-model="selectedUserOption" :dt="dtListbox" :options="userOptions" optionLabel="label">
              <template #option="slotProps">
                <div class="flex items-center">
                  <!-- <img :alt="slotProps.option.name" src="https://primefaces.org/cdn/primevue/images/flag/flag_placeholder.png" :class="`flag flag-${slotProps.option.code.toLowerCase()} mr-2`" style="width: 18px" /> -->
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
