<script setup lang="ts">
import { ref } from 'vue'
import Message from 'primevue/message'
import { useToast } from 'primevue/usetoast'

const toast = useToast()

// 優惠券數據結構
interface Coupon {
  id: string
  title: string
  code: string
  startDate: string
  endDate: string
  status: 'available' | 'used' | 'expired' | 'upcoming'
  userGroup: 'new_user' | 'vip' | 'all'
  totalLimit: number
  usedCount: number
  remainingCount: number
  discount?: string // 折扣說明，例如 "$100"
}

// 模擬優惠券數據
const coupons = ref<Coupon[]>([
  {
    id: '1',
    title: '新會員 $100 折價券',
    code: 'WELCOME100',
    startDate: '2026-05-01',
    endDate: '2026-06-30',
    status: 'available',
    userGroup: 'new_user',
    totalLimit: 1000,
    usedCount: 234,
    remainingCount: 766,
    discount: '$100',
  },
  {
    id: '2',
    title: 'VIP 專屬 8 折優惠',
    code: 'VIP80OFF',
    startDate: '2026-05-01',
    endDate: '2026-12-31',
    status: 'available',
    userGroup: 'vip',
    totalLimit: 500,
    usedCount: 89,
    remainingCount: 411,
    discount: '8折',
  },
  {
    id: '3',
    title: '母親節特惠券',
    code: 'MOTHER2026',
    startDate: '2026-04-01',
    endDate: '2026-04-30',
    status: 'expired',
    userGroup: 'all',
    totalLimit: 2000,
    usedCount: 1856,
    remainingCount: 144,
    discount: '$200',
  },
  {
    id: '4',
    title: '夏季購物節優惠',
    code: 'SUMMER2026',
    startDate: '2026-06-01',
    endDate: '2026-08-31',
    status: 'upcoming',
    userGroup: 'all',
    totalLimit: 3000,
    usedCount: 0,
    remainingCount: 3000,
    discount: '$150',
  },
  {
    id: '5',
    title: '滿千折百優惠券',
    code: 'SAVE100',
    startDate: '2026-05-01',
    endDate: '2026-05-15',
    status: 'used',
    userGroup: 'all',
    totalLimit: 1500,
    usedCount: 1500,
    remainingCount: 0,
    discount: '$100',
  },
])

// 根據狀態返回對應的 Message severity
function getSeverity(status: Coupon['status']): 'success' | 'info' | 'warn' | 'error' | 'secondary' | 'contrast' {
  const severityMap = {
    available: 'success',
    used: 'secondary',
    expired: 'error',
    upcoming: 'info',
  }
  return severityMap[status] as any
}

// 狀態文字
function getStatusText(status: Coupon['status']): string {
  const statusMap = {
    available: '可使用',
    used: '已使用',
    expired: '已過期',
    upcoming: '即將開始',
  }
  return statusMap[status]
}

// 格式化日期
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

// 檢查是否在使用期限內
function isWithinValidPeriod(coupon: Coupon): boolean {
  const now = new Date()
  const startDate = new Date(coupon.startDate)
  const endDate = new Date(coupon.endDate)
  return now >= startDate && now <= endDate
}

// 複製優惠券代碼
async function copyCouponCode(coupon: Coupon) {
  try {
    await navigator.clipboard.writeText(coupon.code)
    toast.add({
      severity: 'success',
      summary: '優惠券代碼已複製',
      detail: `代碼：${coupon.code}`,
      life: 3000,
    })
  }
  catch (error) {
    toast.add({
      severity: 'error',
      summary: '複製失敗',
      detail: '請手動複製優惠券代碼',
      life: 3000,
    })
  }
}
const messageDt = {
  content: {
    padding: '0',
  },
}
const messagePt = {
  text: 'w-full',
}
</script>

<template>
  <div class=" coupon-panel">
    <!-- 優惠券列表 -->
    <div class="space-y-4">
      <Message v-for="coupon in coupons" :key="coupon.id" :pt="messagePt" :dt="messageDt" :severity="getSeverity(coupon.status)" class="cursor-pointer coupon-card" :closable="false" @click="copyCouponCode(coupon)">
        <div class="flex items-center gap-2 p-4 w-full">
          <!-- 左側圖標 -->
          <div class="flex-shrink-0">
            <font-awesome-icon :icon="['fas', 'ticket']" class="text-3xl" />
          </div>

          <!-- 中間內容區 -->
          <div class="flex-1 min-w-0">
            <!-- 標題 -->
            <div class="mb-1">
              <h3 class="font-bold text-xl">
                {{ coupon.title }}
              </h3>
            </div>

            <!-- 詳細資訊 -->
            <div class="gap-x-6 gap-y-1 grid grid-cols-1 md:grid-cols-3 px-2 text-gray-400 text-xs">
              <!-- 使用期限：已滿足使用期限時只顯示結束時間，未滿足時顯示開始和結束時間 -->
              <div>
                <span>使用期限：</span>
                <span v-if="isWithinValidPeriod(coupon)">
                  {{ formatDate(coupon.endDate) }} 前
                </span>
                <span v-else>
                  {{ formatDate(coupon.startDate) }} ~ {{ formatDate(coupon.endDate) }}
                </span>
              </div>

              <!-- 已使用：僅在使用期限內顯示 -->
              <div v-if="isWithinValidPeriod(coupon)">
                <span>已使用：</span>
                <span>{{ coupon.usedCount }} / {{ coupon.totalLimit }}</span>
              </div>

              <!-- 剩餘數量：僅在使用期限內顯示 -->
              <div v-if="isWithinValidPeriod(coupon)">
                <span>剩餘數量：</span>
                <span :class="{
                  'text-red-400': coupon.remainingCount < 100,
                  'text-gray-400': coupon.remainingCount >= 100,
                }">
                  {{ coupon.remainingCount }}
                </span>
              </div>
            </div>
          </div>

          <!-- 右側折扣標籤 -->
          <div v-if="coupon.discount" class="flex-shrink-0 bg-white shadow-md px-4 py-3 rounded-lg text-center">
            <div class="font-bold text-primary text-2xl whitespace-nowrap">
              {{ coupon.discount }}
            </div>
            <div class="text-gray-600 text-xs">
              折扣
            </div>
          </div>
        </div>
      </Message>
    </div>

    <!-- 空狀態 -->
    <div v-if="coupons.length === 0" class="py-12 text-gray-500 text-center">
      <font-awesome-icon :icon="['fas', 'ticket']" class="mb-4 text-gray-300 text-6xl" />
      <p class="text-lg">
        目前沒有優惠券
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.coupon-panel {
  max-width: 1200px;
  margin: 0 auto;
}

.coupon-card {
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(var(--dark-button-rgb), 0.15);
  }

  &:active {
    transform: translateY(0);
  }
}
</style>
