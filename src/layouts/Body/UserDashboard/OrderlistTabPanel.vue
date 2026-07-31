<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Accordion, AccordionContent, AccordionHeader, AccordionPanel, Button, Divider, Tag } from 'primevue'
import { useToast } from 'primevue/usetoast'
import { cancelOrderApi, getOrdersApi } from '@services'
import type { Order, OrderStatus } from '@services'
import { useAuthStore } from '@stores/useAuthStore'

const toast = useToast()
const authStore = useAuthStore()

const orders = ref<Order[]>([])

onMounted(async () => {
  if (!authStore.user?.id) { return }
  orders.value = await getOrdersApi(authStore.user.id)
})

// 當前選擇的狀態篩選
const selectedStatus = ref<string>('all')

// 狀態選項
const statusOptions = [
  { label: '全部訂單', value: 'all', icon: ['fas', 'list'] },
  { label: '待付款', value: 'pending', icon: ['fas', 'clock'] },
  { label: '處理中', value: 'processing', icon: ['fas', 'spinner'] },
  { label: '已出貨', value: 'shipped', icon: ['fas', 'truck'] },
  { label: '已送達', value: 'delivered', icon: ['fas', 'check-circle'] },
  { label: '已取消', value: 'cancelled', icon: ['fas', 'times-circle'] },
]

// 根據狀態篩選訂單
const filteredOrders = computed(() => {
  if (selectedStatus.value === 'all') {
    return orders.value
  }
  return orders.value.filter(order => order.status === selectedStatus.value)
})

// 獲取狀態標籤的 severity
function getStatusSeverity(status: OrderStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
  const severityMap: Record<OrderStatus, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
    pending: 'warn',
    processing: 'info',
    shipped: 'info',
    delivered: 'success',
    cancelled: 'secondary',
    refunded: 'danger',
  }
  return severityMap[status]
}

// 獲取狀態文字
function getStatusText(status: OrderStatus): string {
  const statusMap: Record<OrderStatus, string> = {
    pending: '待付款',
    processing: '處理中',
    shipped: '已出貨',
    delivered: '已送達',
    cancelled: '已取消',
    refunded: '已退款',
  }
  return statusMap[status]
}

// 獲取狀態圖標
function getStatusIcon(status: OrderStatus): string[] {
  const iconMap: Record<OrderStatus, string[]> = {
    pending: ['fas', 'clock'],
    processing: ['fas', 'spinner'],
    shipped: ['fas', 'truck'],
    delivered: ['fas', 'check-circle'],
    cancelled: ['fas', 'times-circle'],
    refunded: ['fas', 'undo'],
  }
  return iconMap[status]
}

// 格式化日期
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 格式化金額
function formatCurrency(amount: number): string {
  return `NT$ ${amount.toLocaleString()}`
}

// 複製訂單編號
async function copyOrderNumber(orderNumber: string) {
  try {
    await navigator.clipboard.writeText(orderNumber)
    toast.add({
      severity: 'success',
      summary: '訂單編號已複製',
      detail: orderNumber,
      life: 2000,
    })
  }
  catch (error) {
    toast.add({
      severity: 'error',
      summary: '複製失敗',
      detail: '請手動複製訂單編號',
      life: 2000,
    })
  }
}

// 追蹤物流
function trackShipment(order: Order) {
  if (order.trackingNumber) {
    toast.add({
      severity: 'info',
      summary: '物流追蹤',
      detail: `追蹤編號：${order.trackingNumber}`,
      life: 3000,
    })
  }
  else {
    toast.add({
      severity: 'warn',
      summary: '尚無物流資訊',
      detail: '訂單處理中，請稍後再試',
      life: 3000,
    })
  }
}

// 取消訂單（呼叫 cancel_order RPC：只有 pending 狀態的自己的訂單能取消，後端會回補庫存）
const cancellingOrderIds = ref<Set<string>>(new Set())

async function cancelOrder(order: Order) {
  if (cancellingOrderIds.value.has(order.id)) { return }
  cancellingOrderIds.value.add(order.id)
  try {
    const updated = await cancelOrderApi(order.id)
    if (!updated) { return }

    const target = orders.value.find(o => o.id === order.id)
    if (target) { target.status = updated.status }

    toast.add({
      severity: 'success',
      summary: '訂單已取消',
      detail: `訂單 ${order.orderNumber} 已成功取消`,
      life: 3000,
    })
  }
  finally {
    cancellingOrderIds.value.delete(order.id)
  }
}

// 申請退款：目前後端沒有對應的退款 API（api.ts 只有 create_order / cancel_order RPC），
// 原本這裡只是彈個假 toast 假裝送出成功，並未真的送出任何請求，先註解掉避免誤導使用者
// function requestRefund(order: Order) {
//   toast.add({
//     severity: 'info',
//     summary: '申請退款',
//     detail: `訂單 ${order.orderNumber} 退款申請已送出`,
//     life: 3000,
//   })
// }

const accordionContentPt = {
  content: 'max-sm:!px-3',
}
</script>

<template>
  <div class="mx-auto my-0 max-w-[1200px]">
    <!-- 狀態篩選標籤 -->
    <div data-section="訂單狀態導航" class="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
      <Button v-for="option in statusOptions" :key="option.value" class="shrink-0" :label="option.label" :severity="selectedStatus === option.value ? 'primary' : 'secondary'" :outlined="selectedStatus !== option.value" size="small" @click="selectedStatus = option.value">
        <template #icon>
          <font-awesome-icon :icon="option.icon" class="mr-2" />
        </template>
      </Button>
    </div>
    <div v-if="filteredOrders.length > 0" data-section="某一訂單種類的訂單列表" class="space-y-4">
      <Accordion :multiple="true" class="order-accordion">
        <AccordionPanel v-for="order in filteredOrders" :key="order.id" class="max-sm:!mb-1" :value="order.id">
          <AccordionHeader data-section="手風琴的表頭" class="py-2 sm:py-4">
            <div class="flex items-center pr-2 sm:pr-4 w-full">
              <font-awesome-icon :icon="getStatusIcon(order.status)" class="mr-2 sm:mr-4 text-2xl" />
              <div class="flex max-sm:flex-wrap justify-between items-center w-full">
                <div data-section="訂單編號、訂單成立時間" class="flex items-center gap-4">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-sm">{{ order.orderNumber }}</span>
                      <button class="text-gray-400 hover:text-primary transition-colors" @click.stop="copyOrderNumber(order.orderNumber)">
                        <font-awesome-icon :icon="['fas', 'copy']" class="text-sm" />
                      </button>
                    </div>
                    <div class="text-gray-600 text-sm scale-[0.8] sm:scale-100 origin-left">
                      {{ formatDate(order.orderDate) }}
                    </div>
                  </div>
                </div>
                <div data-section="訂單金額、訂單商品數量" class="flex items-center gap-4">
                  <div class="max-sm:flex max-sm:justify-between max-sm:items-center text-right">
                    <div class="font-bold text-primary text-sm">
                      {{ formatCurrency(order.finalAmount) }}
                    </div>
                    <div class="text-gray-600 scale-[0.8] sm:scale-100 origin">
                      共 {{ order.items.length }} 件商品
                    </div>
                  </div>
                  <Tag class="max-md:hidden" :severity="getStatusSeverity(order.status)" :value="getStatusText(order.status)" />
                </div>
              </div>
            </div>
          </AccordionHeader>

          <AccordionContent data-section="手風琴的內容" :pt="accordionContentPt">
            <div class="space-y-4 pt-4">
              <!-- 商品列表 -->
              <div>
                <h4 class="mb-3 font-semibold text-gray-700">
                  訂購商品
                </h4>
                <div class="space-y-2">
                  <div v-for="item in order.items" :key="item.id" class="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                    <div class="flex items-center gap-3">
                      <div class="flex flex-shrink-0 justify-center items-center bg-gray-200 rounded w-12 h-12 overflow-hidden">
                        <img v-if="item.productImage" :src="item.productImage" :alt="item.productName" class="w-full h-full object-cover">
                        <font-awesome-icon v-else :icon="['fas', 'box']" class="text-gray-400" />
                      </div>
                      <div>
                        <div class="max-sm:max-w-[183px] font-medium truncate">
                          {{ item.productName }}
                        </div>
                        <div class="text-gray-600 text-sm scale-[0.8] sm:scale-100 origin-left">
                          <span v-if="item.originalPrice > item.price" class="mr-1 line-through">{{ formatCurrency(item.originalPrice) }}</span>
                          {{ formatCurrency(item.price) }} × {{ item.quantity }}
                        </div>
                      </div>
                    </div>
                    <div class="max-sm:hidden font-semibold whitespace-nowrap">
                      {{ formatCurrency(item.subtotal) }}
                    </div>
                  </div>
                </div>
              </div>

              <Divider />

              <!-- 金額明細 -->
              <div>
                <h4 class="mb-3 font-semibold text-gray-700">
                  金額明細
                </h4>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-600">商品小計</span>
                    <span>{{ formatCurrency(order.totalAmount) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">運費</span>
                    <span>{{ order.shippingFee === 0 ? '免運費' : formatCurrency(order.shippingFee) }}</span>
                  </div>
                  <div v-if="order.discount > 0" class="flex justify-between text-red-600">
                    <span>折扣優惠</span>
                    <span>- {{ formatCurrency(order.discount) }}</span>
                  </div>
                  <Divider />
                  <div class="flex justify-between font-bold text-lg">
                    <span>訂單總額</span>
                    <span class="text-primary">{{ formatCurrency(order.finalAmount) }}</span>
                  </div>
                </div>
              </div>

              <Divider />

              <!-- 配送資訊 -->
              <div class="gap-6 grid grid-cols-1 md:grid-cols-2">
                <div>
                  <h4 class="mb-2 font-semibold text-gray-700">
                    配送資訊
                  </h4>
                  <div class="space-y-1 text-sm">
                    <div class="flex items-start gap-2">
                      <font-awesome-icon :icon="['fas', 'location-dot']" class="mt-1 text-gray-400" />
                      <span>{{ order.shippingAddress }}</span>
                    </div>
                    <div v-if="order.trackingNumber" class="flex items-center gap-2">
                      <font-awesome-icon :icon="['fas', 'barcode']" class="text-gray-400" />
                      <span>物流編號：{{ order.trackingNumber }}</span>
                    </div>
                    <div v-if="order.estimatedDelivery" class="flex items-start gap-2">
                      <font-awesome-icon :icon="['fas', 'calendar']" class="mt-1 text-gray-400" />
                      <div class="flex">
                        <span class="whitespace-nowrap">預計送達：</span> <span>{{ formatDate(order.estimatedDelivery) }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 class="mb-2 font-semibold text-gray-700">
                    付款資訊
                  </h4>
                  <div class="space-y-1 text-sm">
                    <div class="flex items-center gap-2">
                      <font-awesome-icon :icon="['fas', 'credit-card']" class="text-gray-400" />
                      <span>{{ order.paymentMethod }}</span>
                    </div>
                    <div v-if="order.note" class="flex items-start gap-2">
                      <font-awesome-icon :icon="['fas', 'note-sticky']" class="mt-1 text-gray-400" />
                      <span>備註：{{ order.note }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Divider />

              <!-- 操作按鈕 -->
              <div class="flex flex-wrap gap-2">
                <Button v-if="order.status === 'shipped' || order.status === 'delivered'" label="追蹤物流" icon="pi pi-map-marker" severity="info" size="small" outlined @click="trackShipment(order)" />
                <Button v-if="order.status === 'pending'" label="取消訂單" icon="pi pi-times" severity="danger" size="small" outlined :loading="cancellingOrderIds.has(order.id)" @click="cancelOrder(order)" />
                <!-- 申請退款：後端無對應 API，暫時隱藏，見上方 requestRefund 註解 -->
                <!-- <Button v-if="order.status === 'delivered'" label="申請退款" icon="pi pi-replay" severity="warn" size="small" outlined @click="requestRefund(order)" /> -->
                <Button label="聯絡客服" icon="pi pi-comments" severity="secondary" size="small" outlined />
              </div>
            </div>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>
    </div>

    <!-- 空狀態 -->
    <div v-else class="flex flex-col justify-center items-center py-12 min-h-[400px] text-gray-500 text-center">
      <font-awesome-icon :icon="['fas', 'shopping-bag']" class="mb-4 text-gray-300 text-6xl" />
      <p class="text-lg">
        {{ selectedStatus === 'all' ? '目前沒有訂單' : '目前沒有符合條件的訂單' }}
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss">
// 自訂 Accordion 樣式
:deep(.order-accordion) {
  .p-accordionpanel {
    margin-bottom: 1rem;
    border: 1px solid var(--secondary-color);
    border-radius: 0.5rem;
    overflow: hidden;
    transition: all 0.2s;

    &:hover {
      box-shadow: 0 4px 12px rgba(var(--dark-button-rgb), 0.08);
    }
  }

  .p-accordionheader-toggle-icon {
    order: 1;
  }

  .p-accordioncontent-content {
    padding: 0 1.5rem 1.5rem;
  }
}
</style>