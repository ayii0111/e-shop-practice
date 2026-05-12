<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Avatar, Button, Card, Divider, InputMask, InputText, Message, Textarea } from 'primevue'
import { useToast } from 'primevue/usetoast'
import axios from 'axios'

const toast = useToast()

// Supabase 配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

// 用戶資料介面
interface UserProfile {
  // Google OAuth 提供的基本資料
  id: string
  email: string
  full_name: string
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
  member_since?: string
  total_orders?: number
  total_spent?: number
}

// 用戶資料
const userProfile = ref<UserProfile>({
  id: '',
  email: '',
  full_name: '',
  avatar_url: '',
  phone: '',
  birthday: '',
  gender: '',
  address: '',
  city: '',
  postal_code: '',
  member_level: 'general',
  member_since: '',
  total_orders: 0,
  total_spent: 0,
})

// 編輯模式
const isEditing = ref(false)
const loading = ref(false)
const accessToken = ref('')

// 從 localStorage 載入用戶資料
function loadUserFromLocalStorage() {
  const savedUser = localStorage.getItem('sb_user')
  const savedToken = localStorage.getItem('sb_access_token')

  if (savedUser && savedToken) {
    const user = JSON.parse(savedUser)
    accessToken.value = savedToken

    // 從 Google OAuth 取得的基本資料
    userProfile.value.id = user.id
    userProfile.value.email = user.email
    userProfile.value.full_name = user.user_metadata?.full_name || user.user_metadata?.name || ''
    userProfile.value.avatar_url = user.user_metadata?.avatar_url || ''

    // 嘗試從 user_metadata 或 app_metadata 載入額外資料
    if (user.user_metadata) {
      userProfile.value.phone = user.user_metadata.phone || ''
      userProfile.value.birthday = user.user_metadata.birthday || ''
      userProfile.value.gender = user.user_metadata.gender || ''
      userProfile.value.address = user.user_metadata.address || ''
      userProfile.value.city = user.user_metadata.city || ''
      userProfile.value.postal_code = user.user_metadata.postal_code || ''
    }

    // 會員資訊（這些通常從後端 API 取得）
    userProfile.value.member_since = user.created_at || ''
    userProfile.value.member_level = user.user_metadata?.member_level || 'general'
  }
}

// 從 Supabase 取得完整的用戶資料
async function fetchUserProfile() {
  if (!accessToken.value) { return }

  loading.value = true
  try {
    const response = await axios.get(
      `${supabaseUrl}/auth/v1/user`,
      {
        headers: {
          apikey: supabasePublishableKey,
          Authorization: `Bearer ${accessToken.value}`,
        },
      },
    )

    const user = response.data
    // 更新用戶資料
    userProfile.value.id = user.id
    userProfile.value.email = user.email
    userProfile.value.full_name = user.user_metadata?.full_name || user.user_metadata?.name || ''
    userProfile.value.avatar_url = user.user_metadata?.avatar_url || ''

    // 載入額外資料
    if (user.user_metadata) {
      userProfile.value.phone = user.user_metadata.phone || ''
      userProfile.value.birthday = user.user_metadata.birthday || ''
      userProfile.value.gender = user.user_metadata.gender || ''
      userProfile.value.address = user.user_metadata.address || ''
      userProfile.value.city = user.user_metadata.city || ''
      userProfile.value.postal_code = user.user_metadata.postal_code || ''
      userProfile.value.member_level = user.user_metadata.member_level || 'general'
    }

    userProfile.value.member_since = user.created_at || ''

    // 更新 localStorage
    localStorage.setItem('sb_user', JSON.stringify(user))
  }
  catch (error: any) {
    console.error('取得用戶資料失敗:', error)
    toast.add({
      severity: 'error',
      summary: '載入失敗',
      detail: '無法取得用戶資料',
      life: 3000,
    })
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
      full_name: userProfile.value.full_name,
      phone: userProfile.value.phone,
      birthday: userProfile.value.birthday,
      gender: userProfile.value.gender,
      address: userProfile.value.address,
      city: userProfile.value.city,
      postal_code: userProfile.value.postal_code,
    }

    await axios.put(
      `${supabaseUrl}/auth/v1/user`,
      {
        data: updatedMetadata,
      },
      {
        headers: {
          'apikey': supabasePublishableKey,
          'Authorization': `Bearer ${accessToken.value}`,
          'Content-Type': 'application/json',
        },
      },
    )

    toast.add({
      severity: 'success',
      summary: '更新成功',
      detail: '個人資料已更新',
      life: 3000,
    })

    isEditing.value = false

    // 重新載入用戶資料
    await fetchUserProfile()
  }
  catch (error: any) {
    console.error('更新用戶資料失敗:', error)
    toast.add({
      severity: 'error',
      summary: '更新失敗',
      detail: error.response?.data?.message || '無法更新個人資料',
      life: 3000,
    })
  }
  finally {
    loading.value = false
  }
}

// 取消編輯
function cancelEdit() {
  isEditing.value = false
  loadUserFromLocalStorage()
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
  loadUserFromLocalStorage()
  // 可選：從 Supabase 取得最新資料
  // fetchUserProfile()
})
</script>

<template>
  <div class=" profile-panel">
    <Card>
      <!-- 頭部：頭像和基本資訊 -->
      <template #header>
        <!-- <div class="flex items-center gap-6 bg-gradient-to-r from-blue-50 to-purple-50 p-6"> -->
        <div class="flex items-center gap-6 bg-gray-100 p-6 flex-wrap">
          <Avatar :image="userProfile.avatar_url" size="xlarge" shape="circle" class="shadow-lg border-4 border-white" />
          <div class="flex-1">
            <h2 class="mb-2 font-bold text-2xl">
              {{ userProfile.full_name || '未設定姓名' }}
            </h2>
            <p class="mb-1 text-gray-600">
              <font-awesome-icon :icon="['fas', 'envelope']" class="mr-2" />
              {{ userProfile.email }}
            </p>
            <div class="flex items-center gap-4 mt-2 flex-wrap">
              <span class="px-3 py-1 rounded-full font-semibold text-sm" :class="getMemberLevelColor(userProfile.member_level)">
                <font-awesome-icon :icon="['fas', 'crown']" class="mr-1" />
                {{ getMemberLevelText(userProfile.member_level) }}
              </span>
              <span class="text-gray-500 text-sm">
                加入時間：{{ formatDate(userProfile.member_since!) }}
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
                <InputText v-if="isEditing" v-model="userProfile.full_name" placeholder="請輸入姓名" />
                <p v-else class="bg-gray-100 p-3 rounded">
                  {{ userProfile.full_name || '未設定' }}
                </p>
              </div>

              <!-- Email（不可編輯） -->
              <div class="flex flex-col gap-2">
                <label class="font-medium text-gray-600 text-sm">電子郵件</label>
                <InputText v-if="isEditing" v-model="userProfile.email" placeholder="" />

                <p class="bg-gray-100 p-3 rounded text-gray-500">
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

          <!-- 會員統計區塊 -->
          <!-- <div>
            <h3 class="flex items-center gap-2 mb-4 font-semibold text-gray-700 text-lg">
              <font-awesome-icon :icon="['fas', 'chart-line']" />
              會員統計
            </h3>
            <div class="gap-4 grid grid-cols-1 md:grid-cols-3">
              <div class="bg-blue-50 p-4 rounded-lg text-center">
                <div class="mb-2 font-bold text-blue-600 text-3xl">
                  {{ userProfile.total_orders || 0 }}
                </div>
                <div class="text-gray-600 text-sm">
                  總訂單數
                </div>
              </div>
              <div class="bg-green-50 p-4 rounded-lg text-center">
                <div class="mb-2 font-bold text-green-600 text-3xl">
                  NT$ {{ (userProfile.total_spent || 0).toLocaleString() }}
                </div>
                <div class="text-gray-600 text-sm">
                  累計消費
                </div>
              </div>
              <div class="bg-purple-50 p-4 rounded-lg text-center">
                <div class="mb-2 font-bold text-3xl" :class="getMemberLevelColor(userProfile.member_level)">
                  {{ getMemberLevelText(userProfile.member_level) }}
                </div>
                <div class="text-gray-600 text-sm">
                  會員等級
                </div>
              </div>
            </div>
          </div> -->

          <!-- 提示訊息 -->
          <!-- <Message v-if="!isEditing" severity="info" :closable="false">
            <template #icon>
              <font-awesome-icon :icon="['fas', 'circle-info']" />
            </template>
點擊「編輯資料」按鈕可以更新您的個人資料
</Message> -->
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