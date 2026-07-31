<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Listbox, Popover, Skeleton } from 'primevue'
import axios from 'axios'
import { debugLog, useGoogleLogin, useRetryImage, useWarpToast } from '@util'
import { getCouponTemplatesApi } from '@services'
import { useAuthStore } from '@stores/useAuthStore'
import { useCartStore } from '@stores/useCartStore'

const authStore = useAuthStore()
const { loginWithGoogle, loading } = useGoogleLogin()

// 頭像圖片載入失敗自動重試（見 useRetryImage 註解：Google 頭像網址剛授權完成時 CDN 可能短暫還沒就緒）
const { currentSrc: avatarSrc, loaded: avatarLoaded, hasSrc: avatarHasSrc, onLoad: onAvatarLoad, onError: onAvatarError } = useRetryImage(
  () => authStore.user?.user_metadata?.avatar_url ?? '',
)

// 目前可使用的優惠券數量（依 usability_enable + 有效期間判斷，見 CouponTabPanel.vue 的 getStatus）
const availableCouponCount = ref(0)

onMounted(async () => {
  const coupons = await getCouponTemplatesApi()
  const now = new Date()
  availableCouponCount.value = coupons.filter(c =>
    c.usability_enable && now >= new Date(c.valid_start_at) && now <= new Date(c.valid_end_at),
  ).length
})

// #region 第三方登入驗證: ------------------------------
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

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

    // 登入後立即初始化購物車，讓 header badge 馬上顯示正確數量
    const cartStore = useCartStore()
    await cartStore.init(resp.data.user.id)

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

const userOptions = computed(() => [
  { label: '登出', icon: ['fas', 'right-from-bracket'], routeName: '' },
  { label: '個人資料', icon: ['fas', 'address-card'], routeName: 'ProfileTabPanel' },
  { label: `我的優惠券 (${availableCouponCount.value})`, icon: ['fas', 'ticket'], routeName: 'CouponTabPanel' },
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
          <font-awesome-icon v-if="!avatarHasSrc" :icon="['fas', 'circle-user']" class="text-gray-400 text-xl" />
          <Skeleton v-else-if="!avatarLoaded" shape="circle" size="1.5rem" />
          <img v-show="avatarHasSrc && avatarLoaded" :src="avatarSrc" class="rounded-full size-6" alt="" @load="onAvatarLoad" @error="onAvatarError">
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
