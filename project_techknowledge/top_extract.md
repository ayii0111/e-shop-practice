**toast 初始化**：避免每次使用 toast 元件，都要在每個元件 setup 初始化
在 App.vue 元件中
```html
import { useToastStore } from '@stores/useToastStore' const toastStore = useToastStore() toastStore.init()

<Toast position="top-right" />
```

**透過 localStorage.getItem 取得 access_token**: 在 main.ts 中統一取用，避免在個別元件中重複取得
```
// main.ts 檔
import { useAuthStore } from './stores/useAuthStore'
const authStore = useAuthStore()
authStore.restoreFromStorage()

// useAuthStore.ts 檔
import { ref } from 'vue'
import { defineStore } from 'pinia'

// auth user 的型別（Supabase 登入後回傳的格式）
interface AuthUser {
  id: string
  email: string
  user_metadata: {
    avatar_url: string
    full_name: string
    name: string
    [key: string]: any
  }
  [key: string]: any
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const accessToken = ref<string>('')

  // app 啟動時呼叫一次，從 localStorage 還原狀態
  // 放在 main.ts 而非元件的 onMounted，確保任何元件掛載前狀態就已就緒
  function restoreFromStorage() {
    const savedToken = localStorage.getItem('sb_access_token')
    const savedUser = localStorage.getItem('sb_user')
    if (savedToken && savedUser) {
      try {
        user.value = JSON.parse(savedUser)
        accessToken.value = savedToken
      }
      catch {
        // JSON 格式損壞時清除，避免後續存取出錯
        clearAuth()
      }
    }
  }

  // 登入成功後呼叫，統一由 store 負責寫入 localStorage
  function setAuth(userData: AuthUser, token: string, refreshToken: string) {
    user.value = userData
    accessToken.value = token
    localStorage.setItem('sb_user', JSON.stringify(userData))
    localStorage.setItem('sb_access_token', token)
    localStorage.setItem('sb_refresh_token', refreshToken)
  }

  // 登出或 session 失效時呼叫，統一由 store 負責清除 localStorage
  function clearAuth() {
    user.value = null
    accessToken.value = ''
    localStorage.removeItem('sb_user')
    localStorage.removeItem('sb_access_token')
    localStorage.removeItem('sb_refresh_token')
    sessionStorage.removeItem('pkce_code_verifier')
  }

  const isLoggedIn = () => !!user.value

  return { user, accessToken, restoreFromStorage, setAuth, clearAuth, isLoggedIn }
})

```
