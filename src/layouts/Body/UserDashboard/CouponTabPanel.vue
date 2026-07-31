<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Message from 'primevue/message'
import { useToast } from 'primevue/usetoast'
import { getCouponTemplatesApi } from '@services'
import type { CouponTemplate } from '@services'

const toast = useToast()

// ── 前端硬編碼假資料（已改為串接 coupon_templates，保留註解供對照）──────────────
// interface Coupon {
//   id: string
//   title: string
//   code: string
//   startDate: string
//   endDate: string
//   status: 'available' | 'used' | 'expired' | 'upcoming'
//   userGroup: 'new_user' | 'vip' | 'all'
//   totalLimit: number
//   usedCount: number
//   remainingCount: number
//   discount?: string
// }
// const coupons = ref<Coupon[]>([...])

const coupons = ref<CouponTemplate[]>([])

onMounted(async () => {
  coupons.value = await getCouponTemplatesApi()
})

// 優惠券目前狀態：沒有 per-user 領取/使用紀錄表，只能依 usability_enable + 有效期間判斷（無法區分「已使用」）
type CouponStatus = 'available' | 'expired' | 'upcoming'
function getStatus(coupon: CouponTemplate): CouponStatus {
  const now = new Date()
  if (now < new Date(coupon.valid_start_at)) { return 'upcoming' }
  if (now > new Date(coupon.valid_end_at) || !coupon.usability_enable) { return 'expired' }
  return 'available'
}

// 折扣說明文字
function getDiscountText(coupon: CouponTemplate): string {
  if (coupon.discount_type === 'threshold_discount') { return `$${coupon.discount_value}` }
  if (coupon.discount_type === 'percentage_discount') { return `${10 - (coupon.discount_value ?? 0) / 10}折` }
  return '免運費'
}

// 根據狀態返回對應的 Message severity
function getSeverity(status: CouponStatus): 'success' | 'info' | 'warn' | 'error' | 'secondary' | 'contrast' {
  const severityMap = {
    available: 'success',
    expired: 'error',
    upcoming: 'info',
  }
  return severityMap[status] as any
}

// 狀態文字
function getStatusText(status: CouponStatus): string {
  const statusMap = {
    available: '可使用',
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
function isWithinValidPeriod(coupon: CouponTemplate): boolean {
  const now = new Date()
  const startDate = new Date(coupon.valid_start_at)
  const endDate = new Date(coupon.valid_end_at)
  return now >= startDate && now <= endDate
}

// 複製優惠券代碼
async function copyCouponCode(coupon: CouponTemplate) {
  try {
    await navigator.clipboard.writeText(coupon.coupon_code)
    toast.add({
      severity: 'success',
      summary: '優惠券代碼已複製',
      detail: `代碼：${coupon.coupon_code}`,
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
  <div class="coupon-panel">
    <!-- 優惠券列表 -->
    <div class="space-y-4">
      <Message v-for="coupon in coupons" :key="coupon.coupon_code" :pt="messagePt" :dt="messageDt" :severity="getSeverity(getStatus(coupon))" class="cursor-pointer coupon-card" :closable="false" @click="copyCouponCode(coupon)">
        <div class="flex md:flex-row flex-row-reverse justify-between items-center gap-2 p-4 w-full">
          <div class="flex items-center gap-2 w-full">
            <div data-section="左側圖標" class="hidden md:block flex-shrink-0 mr-2">
              <font-awesome-icon :icon="['fas', 'ticket']" class="text-3xl" />
            </div>
            <div data-section="中間內容區" class="flex flex-col sm:grid sm:grid-cols-[1fr_1fr] w-full">
              <div class="flex flex-col items-start">
                <div class="flex items-center mb-1">
                  <h3 class="mr-2 font-bold text-xs sm:text-xl">
                    {{ coupon.coupon_name }}
                  </h3>
                  <button class="text-gray-400 hover:text-primary transition-colors">
                    <font-awesome-icon :icon="['fas', 'copy']" class="text-sm" />
                  </button>
                </div>
                <div data-section="活動期限" class="flex items-center justify-center">
                  <!-- 使用期限：已滿足使用期限時只顯示結束時間，未滿足時顯示開始和結束時間 -->
                  <span v-if="isWithinValidPeriod(coupon)" class=" inline-block text-gray-400 sm:text-xs scale-[0.8] sm:scale-100 origin-left whitespace-nowrap">
                    活動結束於: {{ formatDate(coupon.valid_end_at) }}</span>
                  <span v-else class="inline-block text-gray-400 sm:text-xs scale-[0.8] sm:scale-100 origin-left whitespace-nowrap">
                    活動開始於: {{ formatDate(coupon.valid_start_at) }}</span>
                </div>
              </div>
              <!-- 剩餘數量：coupon_templates 未開放 total_quota 給前端讀取，無法顯示 -->
            </div>
          </div>
          <!-- 右側折扣標籤 -->
          <div class="flex-shrink-0 bg-white shadow-md p-2 sm:px-4 sm:py-3 rounded-lg text-center">
            <div class="font-bold text-primary text-2xl whitespace-nowrap">
              {{ getDiscountText(coupon) }}
            </div>
            <div class="text-gray-600 text-xs">
              {{ getStatusText(getStatus(coupon)) }}
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
