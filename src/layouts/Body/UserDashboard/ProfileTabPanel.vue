<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { Avatar, Button, Card, Divider, InputMask, InputText, Message, Textarea } from 'primevue'
// import { useToast } from 'primevue/usetoast'
import { debug, useWarpToast } from '@util'
import { supabaseApi, supabaseAuth } from '@services'
import { useAuthStore } from '@stores/useAuthStore'

// const toast = useToast()
const authStore = useAuthStore()

// ISO 8601 日期字串，例如 "2024-01-15T08:30:00.000Z"
type ISODateString = string

// 用戶資料介面
interface UserProfile {
  // Google OAuth 提供的基本資料
  user_id: string
  email: string
  display_name: string // 小名，顯示用
  full_name: string // 真實姓名，配送/收件用
  avatar_url: string
  // 電商業務需要的額外資料
  phone?: string
  birthday?: string
  gender?: 'male' | 'female' | 'other' | ''
  address?: string
  city?: string
  postal_code?: string
  // 會員資訊
  member_level?: 'general' | 'silver' | 'gold' | 'platinum'
  created_at: ISODateString
  updated_at: ISODateString
  liked_products: string[]
}

// 用戶資料
const userProfile = ref<UserProfile>({
  user_id: '',
  email: '',
  display_name: '',
  full_name: '',
  avatar_url: '',
  phone: '',
  birthday: '',
  gender: '',
  address: '',
  city: '',
  postal_code: '',
  member_level: 'general',
  created_at: '',
  updated_at: '',
  liked_products: [],
})

// 編輯模式
const isEditing = ref(false)
const loading = ref(false)
// accessToken 統一從 authStore 取得，不再自行管理
const accessToken = computed(() => authStore.accessToken)

// 從 JWT token 解析 user_id（token payload 的 sub 欄位）
// JWT 使用 URL-safe Base64，需先將 - 換回 +、_ 換回 / 才能用 atob 解析
function getUserIdFromToken(token: string): string {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64))
    return payload.sub ?? ''
  }
  catch {
    return ''
  }
}

// 從 Supabase 取得完整的用戶資料
async function fetchUserProfile() {
  if (!accessToken.value) { return }

  loading.value = true
  try { 
    const userId = getUserIdFromToken(accessToken.value)
    // supabaseApi 已由 interceptor 自動帶入 token，不需手動傳 header
    const [respError, resp] = await to(supabaseApi.get(
      '/user_profiles',
      { params: { user_id: `eq.${userId}` } },
    ))

    if (respError) {
      debug('fetchUserProfile 錯誤', () => respError)
      return
    }

    // user_profiles 資料表直接對應 UserProfile interface
    // Supabase REST API 回傳陣列，取第一筆
    const user: UserProfile = resp!.data[0]
    debug(() => user)

    userProfile.value = {
      ...userProfile.value,
      ...user,
    }
    // sb_user 由 authStore 統一管理，此處不覆寫
  }
  catch (error: any) {
    console.error('取得用戶資料失敗:', error)
    debug('載入失敗', () => error)
    useWarpToast('載入失敗', '無法取得用戶資料')
    // toast.add({
    //   severity: 'error',
    //   summary: '載入失敗',
    //   detail: '無法取得用戶資料',
    //   life: 3000,
    // })
  }
  finally {
    loading.value = false
  }
}

// 更新用戶資料
async function updateUserProfile() {
  if (!accessToken.value) { return }

  loading.value = true
  try {
    // 準備要更新的 user_metadata
    const updatedMetadata = {
      full_name: userProfile.value.display_name,
      phone: userProfile.value.phone,
      birthday: userProfile.value.birthday,
      gender: userProfile.value.gender,
      address: userProfile.value.address,
      city: userProfile.value.city,
      postal_code: userProfile.value.postal_code,
    }

    // supabaseAuth 已由 interceptor 自動帶入 token，不需手動傳 header
    await supabaseAuth.put('/user', { data: updatedMetadata })
    isEditing.value = false

    // 重新載入用戶資料
    await fetchUserProfile()
  }
  catch (error: any) {
    console.error('更新用戶資料失敗:', error)
    useWarpToast('更新失敗', error.response?.data?.message || '無法更新個人資料')
    // toast.add({
    //   severity: 'error',
    //   summary: '更新失敗',
    //   detail: error.response?.data?.message || '無法更新個人資料',
    //   life: 3000,
    // })
  }
  finally {
    loading.value = false
  }
}

// 取消編輯
function cancelEdit() {
  isEditing.value = false
  // loadUserFromLocalStorage()
  fetchUserProfile()
}

// 格式化日期
function formatDate(dateString: string): string {
  if (!dateString) { return '未設定' }
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

// 取得會員等級文字
function getMemberLevelText(level?: string): string {
  const levelMap: Record<string, string> = {
    general: '一般會員',
    silver: '銀卡會員',
    gold: '金卡會員',
    platinum: '白金會員',
  }
  return levelMap[level || 'general'] || '一般會員'
}

// 取得會員等級顏色
function getMemberLevelColor(level?: string): string {
  const colorMap: Record<string, string> = {
    general: 'text-gray-600',
    silver: 'text-gray-400',
    gold: 'text-yellow-500',
    platinum: 'text-purple-500',
  }
  return colorMap[level || 'general'] || 'text-gray-600'
}

// 取得性別文字
function getGenderText(gender?: string): string {
  const genderMap: Record<string, string> = {
    male: '男性',
    female: '女性',
    other: '其他',
  }
  return genderMap[gender || ''] || '未設定'
}

onMounted(() => {
  // accessToken 已由 authStore 統一管理，不需再手動讀 localStorage
  fetchUserProfile()

  // 監聽 interceptor 發出的 session 過期事件，顯示 toast 提示
  // 事件由 api-base.ts 的 clearAuthAndRedirect 觸發，
  // 在 service 層與 UI 層之間用自訂事件解耦，避免 service 直接依賴 useToast
  window.addEventListener('auth:session-expired', onSessionExpired)
})

onUnmounted(() => {
  window.removeEventListener('auth:session-expired', onSessionExpired)
})

function onSessionExpired() {
  useWarpToast('登入已過期', '請重新登入')
  // toast.add({
  //   severity: 'warn',
  //   summary: '登入已過期',
  //   detail: '請重新登入',
  //   life: 5000,
  // })
}
</script>

<template>
  <div class="profile-panel">
    <Card>
      <!-- 頭部：頭像和基本資訊 -->
      <template #header>
        <!-- <div class="flex items-center gap-6 bg-gradient-to-r from-blue-50 to-purple-50 p-6"> -->
        <div class="flex flex-wrap items-center gap-6 bg-gray-100 p-6">
          <Avatar :image="userProfile.avatar_url" size="xlarge" shape="circle" class="shadow-lg border-4 border-white" />
          <div class="flex-1">
            <h2 class="mb-2 font-bold text-2xl">
              {{ userProfile.display_name || '未設定姓名' }}
            </h2>
            <p class="mb-1 text-gray-600">
              <font-awesome-icon :icon="['fas', 'envelope']" class="mr-2" />
              {{ userProfile.email }}
            </p>
            <div class="flex flex-wrap items-center gap-4 mt-2">
              <span class="px-3 py-1 rounded-full font-semibold text-sm" :class="getMemberLevelColor(userProfile.member_level)">
                <font-awesome-icon :icon="['fas', 'crown']" class="mr-1" />
                {{ getMemberLevelText(userProfile.member_level) }}
              </span>
              <span class="text-gray-500 text-sm">
                加入時間：{{ formatDate(userProfile.created_at!) }}
              </span>
            </div>
          </div>
          <div class="text-right">
            <Button v-if="!isEditing" class="" label="編輯資料" icon="pi pi-pencil" @click="isEditing = true" />
            <div v-else class="flex gap-2">
              <Button label="儲存" icon="pi pi-check" :loading="loading" @click="updateUserProfile" />
              <Button label="取消" icon="pi pi-times" severity="secondary" outlined @click="cancelEdit" />
            </div>
          </div>
        </div>
      </template>

      <!-- 內容：詳細資料 -->
      <template #content>
        <div class="space-y-6">
          <!-- 基本資料區塊 -->
          <div>
            <h3 class="flex items-center gap-2 mb-4 font-semibold text-gray-700 text-lg">
              <font-awesome-icon :icon="['fas', 'user']" />
              基本資料
            </h3>
            <div class="gap-4 grid grid-cols-1 md:grid-cols-2">
              <!-- 姓名 -->
              <div class="flex flex-col gap-2">
                <label class="font-medium text-gray-600 text-sm">姓名</label>
                <InputText v-if="isEditing" v-model="userProfile.display_name" placeholder="請輸入姓名" />
                <p v-else class="bg-gray-100 p-3 rounded">
                  {{ userProfile.display_name || '未設定' }}
                </p>
              </div>

              <!-- Email（不可編輯） -->
              <div class="flex flex-col gap-2">
                <label class="font-medium text-gray-600 text-sm">電子郵件</label>
                <InputText v-if="isEditing" v-model="userProfile.email" placeholder="" />

                <p v-else class="bg-gray-100 p-3 rounded text-gray-500">
                  {{ userProfile.email }}
                </p>
              </div>

              <!-- 手機號碼 -->
              <div class="flex flex-col gap-2">
                <label class="font-medium text-gray-600 text-sm">手機號碼</label>
                <InputMask v-if="isEditing" v-model="userProfile.phone" mask="0999-999-999" placeholder="0912-345-678" />
                <p v-else class="bg-gray-100 p-3 rounded">
                  {{ userProfile.phone || '未設定' }}
                </p>
              </div>

              <!-- 生日 -->
              <div class="flex flex-col gap-2">
                <label class="font-medium text-gray-600 text-sm">生日</label>
                <InputText v-if="isEditing" v-model="userProfile.birthday" type="date" />
                <p v-else class="bg-gray-100 p-3 rounded">
                  {{ userProfile.birthday ? formatDate(userProfile.birthday) : '未設定' }}
                </p>
              </div>

              <!-- 性別 -->
              <div class="flex flex-col gap-2">
                <label class="font-medium text-gray-600 text-sm">性別</label>
                <select v-if="isEditing" v-model="userProfile.gender" class="p-3 border border-gray-300 focus:border-blue-500 rounded focus:outline-none">
                  <option value="">
                    請選擇
                  </option>
                  <option value="male">
                    男性
                  </option>
                  <option value="female">
                    女性
                  </option>
                  <option value="other">
                    其他
                  </option>
                </select>
                <p v-else class="bg-gray-100 p-3 rounded">
                  {{ getGenderText(userProfile.gender) }}
                </p>
              </div>
            </div>
          </div>

          <Divider />

          <!-- 配送地址區塊 -->
          <div>
            <h3 class="flex items-center gap-2 mb-4 font-semibold text-gray-700 text-lg">
              <font-awesome-icon :icon="['fas', 'location-dot']" />
              配送地址
            </h3>
            <div class="gap-4 grid grid-cols-1 md:grid-cols-2">
              <!-- 城市 -->
              <div class="flex flex-col gap-2">
                <label class="font-medium text-gray-600 text-sm">城市</label>
                <InputText v-if="isEditing" v-model="userProfile.city" placeholder="例如：台北市" />
                <p v-else class="bg-gray-100 p-3 rounded">
                  {{ userProfile.city || '未設定' }}
                </p>
              </div>

              <!-- 郵遞區號 -->
              <div class="flex flex-col gap-2">
                <label class="font-medium text-gray-600 text-sm">郵遞區號</label>
                <InputText v-if="isEditing" v-model="userProfile.postal_code" placeholder="例如：100" />
                <p v-else class="bg-gray-100 p-3 rounded">
                  {{ userProfile.postal_code || '未設定' }}
                </p>
              </div>

              <!-- 詳細地址 -->
              <div class="flex flex-col gap-2 md:col-span-2">
                <label class="font-medium text-gray-600 text-sm">詳細地址</label>
                <Textarea v-if="isEditing" v-model="userProfile.address" rows="3" placeholder="請輸入詳細地址" />
                <p v-else class="bg-gray-100 p-3 rounded min-h-[80px]">
                  {{ userProfile.address || '未設定' }}
                </p>
              </div>
            </div>
          </div>

          <Divider />
        </div>
      </template>
    </Card>
  </div>
</template>

<style scoped lang="scss">
.profile-panel {
  max-width: 1200px;
  margin: 0 auto;
}

// 自訂輸入框樣式
:deep(.p-inputtext),
:deep(.p-inputmask),
:deep(.p-textarea) {
  width: 100%;
}

// 自訂 Avatar 樣式
:deep(.p-avatar) {
  width: 100px;
  height: 100px;
}
</style>