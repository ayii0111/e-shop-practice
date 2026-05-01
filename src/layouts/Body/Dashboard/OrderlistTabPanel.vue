<script setup lang="ts">
import { computed, ref } from 'vue'
import { Accordion, AccordionContent, AccordionHeader, AccordionPanel, Button, Divider, Tag } from 'primevue'
import { useToast } from 'primevue/usetoast'

const toast = useToast()

// 訂單狀態類型
type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'

// 訂單項目介面
interface OrderItem {
  id: string
  productName: string
  productImage?: string
  quantity: number
  price: number
  subtotal: number
}

// 訂單介面
interface Order {
  id: string
  orderNumber: string
  orderDate: string
  status: OrderStatus
  items: OrderItem[]
  totalAmount: number
  shippingFee: number
  discount: number
  finalAmount: number
  shippingAddress: string
  paymentMethod: string
  trackingNumber?: string
  estimatedDelivery?: string
  note?: string
}

// 模擬訂單數據
const orders = ref<Order[]>([
  {
    id: '1',
    orderNumber: 'ORD-2026050001',
    orderDate: '2026-05-01 14:30:25',
    status: 'delivered',
    items: [
      {
        id: '1-1',
        productName: '無線藍牙耳機 Pro Max',
        quantity: 1,
        price: 2990,
        subtotal: 2990,
      },
      {
        id: '1-2',
        productName: '手機保護殼',
        quantity: 2,
        price: 299,
        subtotal: 598,
      },
    ],
    totalAmount: 3588,
    shippingFee: 80,
    discount: 100,
    finalAmount: 3568,
    shippingAddress: '台北市信義區信義路五段7號',
    paymentMethod: '信用卡',
    trackingNumber: '1234567890',
    estimatedDelivery: '2026-05-03',
  },
  {
    id: '2',
    orderNumber: 'ORD-2026050002',
    orderDate: '2026-05-02 10:15:00',
    status: 'shipped',
    items: [
      {
        id: '2-1',
        productName: '智能手錶 Series 8',
        quantity: 1,
        price: 8990,
        subtotal: 8990,
      },
    ],
    totalAmount: 8990,
    shippingFee: 0,
    discount: 500,
    finalAmount: 8490,
    shippingAddress: '新北市板橋區文化路一段188號',
    paymentMethod: 'LINE Pay',
    trackingNumber: '0987654321',
    estimatedDelivery: '2026-05-05',
  },
  {
    id: '3',
    orderNumber: 'ORD-2026050003',
    orderDate: '2026-05-03 16:45:30',
    status: 'processing',
    items: [
      {
        id: '3-1',
        productName: '筆記型電腦 15吋',
        quantity: 1,
        price: 35900,
        subtotal: 35900,
      },
      {
        id: '3-2',
        productName: '無線滑鼠',
        quantity: 1,
        price: 890,
        subtotal: 890,
      },
    ],
    totalAmount: 36790,
    shippingFee: 0,
    discount: 0,
    finalAmount: 36790,
    shippingAddress: '台中市西屯區台灣大道三段99號',
    paymentMethod: '貨到付款',
    note: '請於平日上午配送',
  },
  {
    id: '4',
    orderNumber: 'ORD-2026050004',
    orderDate: '2026-05-04 09:20:15',
    status: 'pending',
    items: [
      {
        id: '4-1',
        productName: '運動水壺',
        quantity: 3,
        price: 450,
        subtotal: 1350,
      },
    ],
    totalAmount: 1350,
    shippingFee: 60,
    discount: 0,
    finalAmount: 1410,
    shippingAddress: '高雄市前金區中正四路211號',
    paymentMethod: '超商取貨付款',
  },
  {
    id: '5',
    orderNumber: 'ORD-2026040025',
    orderDate: '2026-04-25 13:10:00',
    status: 'cancelled',
    items: [
      {
        id: '5-1',
        productName: '桌上型電風扇',
        quantity: 1,
        price: 1290,
        subtotal: 1290,
      },
    ],
    totalAmount: 1290,
    shippingFee: 80,
    discount: 0,
    finalAmount: 1370,
    shippingAddress: '台南市東區大學路一段1號',
    paymentMethod: '信用卡',
    note: '客戶要求取消',
  },
])

// 當前選擇的狀態篩選
const selectedStatus = ref<OrderStatus | 'all'>('all')

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

// 取消訂單
function cancelOrder(order: Order) {
  toast.add({
    severity: 'warn',
    summary: '取消訂單',
    detail: `確定要取消訂單 ${order.orderNumber} 嗎？`,
    life: 3000,
  })
}

// 申請退款
function requestRefund(order: Order) {
  toast.add({
    severity: 'info',
    summary: '申請退款',
    detail: `訂單 ${order.orderNumber} 退款申請已送出`,
    life: 3000,
  })
}
</script>

<template>
  <div class="order-panel p-4">
    <!-- 狀態篩選標籤 -->
    <div class="flex flex-wrap gap-2 mb-6">
      <Button v-for="option in statusOptions" :key="option.value" :label="option.label" :severity="selectedStatus === option.value ? 'primary' : 'secondary'" :outlined="selectedStatus !== option.value" size="small" @click="selectedStatus = option.value as any">
        <template #icon>
          <font-awesome-icon :icon="option.icon" class="mr-2" />
        </template>
      </Button>
    </div>

    <!-- 訂單列表 -->
    <div v-if="filteredOrders.length > 0" class="space-y-4">
      <Accordion :multiple="true" class="order-accordion">
        <AccordionPanel v-for="order in filteredOrders" :key="order.id" :value="order.id">
          <!-- 訂單標題 -->
          <AccordionHeader>
            <div class="flex justify-between items-center pr-4 w-full">
              <!-- 左側：訂單資訊 -->
              <div class="flex items-center gap-4">
                <font-awesome-icon :icon="getStatusIcon(order.status)" class="text-2xl" />
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-lg">{{ order.orderNumber }}</span>
                    <button class="text-gray-400 hover:text-primary transition-colors" @click.stop="copyOrderNumber(order.orderNumber)">
                      <font-awesome-icon :icon="['fas', 'copy']" class="text-sm" />
                    </button>
                  </div>
                  <div class="text-gray-600 text-sm">
                    {{ formatDate(order.orderDate) }}
                  </div>
                </div>
              </div>

              <!-- 右側：狀態和金額 -->
              <div class="flex items-center gap-4">
                <div class="text-right">
                  <div class="font-bold text-primary text-lg">
                    {{ formatCurrency(order.finalAmount) }}
                  </div>
                  <div class="text-gray-600 text-sm">
                    共 {{ order.items.length }} 件商品
                  </div>
                </div>
                <Tag :severity="getStatusSeverity(order.status)" :value="getStatusText(order.status)" />
              </div>
            </div>
          </AccordionHeader>

          <!-- 訂單詳細內容 -->
          <AccordionContent>
            <div class="space-y-4 pt-4">
              <!-- 商品列表 -->
              <div>
                <h4 class="mb-3 font-semibold text-gray-700">
                  訂購商品
                </h4>
                <div class="space-y-2">
                  <div v-for="item in order.items" :key="item.id" class="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                    <div class="flex items-center gap-3">
                      <div class="flex justify-center items-center bg-gray-200 rounded w-12 h-12">
                        <font-awesome-icon :icon="['fas', 'box']" class="text-gray-400" />
                      </div>
                      <div>
                        <div class="font-medium">
                          {{ item.productName }}
                        </div>
                        <div class="text-gray-600 text-sm">
                          {{ formatCurrency(item.price) }} × {{ item.quantity }}
                        </div>
                      </div>
                    </div>
                    <div class="font-semibold">
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
                  <div v-if="order.discount > 0" class="flex justify-between text-green-600">
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
                    <div v-if="order.estimatedDelivery" class="flex items-center gap-2">
                      <font-awesome-icon :icon="['fas', 'calendar']" class="text-gray-400" />
                      <span>預計送達：{{ formatDate(order.estimatedDelivery) }}</span>
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
                <Button v-if="order.status === 'pending'" label="取消訂單" icon="pi pi-times" severity="danger" size="small" outlined @click="cancelOrder(order)" />
                <Button v-if="order.status === 'delivered'" label="申請退款" icon="pi pi-replay" severity="warn" size="small" outlined @click="requestRefund(order)" />
                <Button label="聯絡客服" icon="pi pi-comments" severity="secondary" size="small" outlined />
              </div>
            </div>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>
    </div>

    <!-- 空狀態 -->
    <div v-else class="py-12 text-gray-500 text-center">
      <font-awesome-icon :icon="['fas', 'shopping-bag']" class="mb-4 text-gray-300 text-6xl" />
      <p class="text-lg">
        {{ selectedStatus === 'all' ? '目前沒有訂單' : '目前沒有符合條件的訂單' }}
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.order-panel {
  max-width: 1200px;
  margin: 0 auto;
}

// 自訂 Accordion 樣式
:deep(.order-accordion) {
  .p-accordionpanel {
    margin-bottom: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    overflow: hidden;
    transition: all 0.2s;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
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