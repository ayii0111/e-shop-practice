<script setup lang="ts">
import { Breadcrumb, Button, Galleria, InputNumber, Rating, Tag } from 'primevue'
import { productDetailApi, toggleLikeApi } from '@services'
import { useAuthStore } from '@stores/useAuthStore'
import type { Product } from '@services'

const route = useRoute()
const authStore = useAuthStore()

// ── 解析當前用戶 ID ──────────────────────────────────────
function parseUserIdFromToken(token: string): string {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64)).sub ?? ''
  }
  catch { return '' }
}
const userId = computed(() =>
  authStore.accessToken ? parseUserIdFromToken(authStore.accessToken) : null,
)

// ── 商品資料 ─────────────────────────────────────────────
const product = ref<Product | null>(null)
const loading = ref(true)

onMounted(async () => {
  const productId = route.params.id as string
  product.value = await productDetailApi(productId, userId.value)
  loading.value = false
})

// ── Galleria 圖片（從商品 img_urls 轉換） ────────────────
const images = computed(() =>
  (product.value?.img_urls ?? []).map((url, i) => ({
    itemImageSrc: url,
    thumbnailImageSrc: url,
    alt: `${product.value?.name ?? ''} 圖片 ${i + 1}`,
  })),
)

// ── 收藏切換 ─────────────────────────────────────────────
const isLiked = computed(() => product.value?.is_liked ?? false)
const likeLoading = ref(false)

async function toggleLike() {
  if (!userId.value || !product.value) { return }
  likeLoading.value = true
  try {
    await toggleLikeApi(userId.value, product.value.product_id, isLiked.value)
    // 本地同步，不重新拉 API
    product.value = { ...product.value, is_liked: !isLiked.value }
  }
  finally {
    likeLoading.value = false
  }
}

// ── 評分 ─────────────────────────────────────────────────
const ratingLevel = computed(() => product.value?.average_rating ?? 0)

// ── 數量選擇 ─────────────────────────────────────────────
const quantity = ref(1)
const inputNumberDT = ref({
  root: {
    buttonWidth: '30px',
    buttonHoverBackground: 'rgba(var(--dark-button-rgb), .1)',
  },
})
const inputNumberPT = ref({
  pcInputText: {
    root: 'w-[50px] text-center focus:border focus:border-[rgba(52,58,64,.3)] focus:ring-2 ring-[rgba(52,58,64,.1)]',
  },
})

// ── Tag 樣式 ─────────────────────────────────────────────
const tagDT = ref({
  root: { padding: '0 4px' },
})

// ── 商品狀態 Tag 對應 severity ───────────────────────────
function getStatusSeverity(status: string): 'warn' | 'info' | 'danger' | 'secondary' {
  const map: Record<string, 'warn' | 'info' | 'danger' | 'secondary'> = {
    新品: 'warn',
    現貨: 'info',
    預購: 'secondary',
    限購: 'danger',
  }
  return map[status] ?? 'info'
}

// ── 活動資料（硬編碼，日後改接 API）─────────────────────
// 結構設計：空陣列代表無活動，元件依此條件顯示/隱藏
interface Promotion {
  label: string // Tag 文字，例如「滿額增」
  description: string // 活動說明
  expiredAt?: string // 截止日期（選填）
}
const promotions = ref<Promotion[]>([
  // 有活動時填入，無活動時留空陣列即可
  { label: '滿額增', description: '滿 3,000 元送 100 元', expiredAt: '2026-06-30' },
])

// ── Breadcrumb ───────────────────────────────────────────
const categoryLabelMap: Record<string, string> = {
  top: '上半身',
  bottom: '下半身',
  shoes: '鞋',
  accessory: '飾品',
  life: '配件',
}

const homeItem = ref({
  label: '商品列表',
  to: '/products-display-body/product-list/all',
})
const breadcrumbItems = ref([{ label: '', to: '', disabled: true }])

watch(product, (val) => {
  if (!val) { return }
  const categoryLabel = categoryLabelMap[val.category] ?? val.category
  homeItem.value = {
    label: categoryLabel,
    to: `/products-display-body/product-list/${val.category}`,
  }
  breadcrumbItems.value = [{ label: val.name, to: '', disabled: true }]
})

// ── Galleria 響應式設定 ──────────────────────────────────
const responsiveOptions = ref([
  { breakpoint: '1300px', numVisible: 4 },
  { breakpoint: '575px', numVisible: 4 },
])

// ── 分享：複製當前頁面連結 ───────────────────────────────
const currentUrl = computed(() => window.location.href)

async function copyLink() {
  await navigator.clipboard.writeText(currentUrl.value)
}
</script>

<template>
  <div>
    <Breadcrumb :home="homeItem" :model="breadcrumbItems" class="bg-[--gray-bg] mb-4 px-4 py-3 max-sm:w-full">
      <template #item="{ item }">
        <RouterLink v-if="item.to" :to="item.to">
          <span>{{ item.label }}</span>
        </RouterLink>
        <span v-else class="text-gray-500">{{ item.label }}</span>
      </template>
      <template #separator>
        /
      </template>
    </Breadcrumb>

    <!-- 載入中 -->
    <div v-if="loading" class="flex justify-center items-center min-h-[500px]">
      <span class="text-gray-400 text-4xl pi pi-spin pi-spinner" />
    </div>

    <!-- 商品不存在 -->
    <div v-else-if="!product" class="flex justify-center items-center min-h-[500px] text-gray-400">
      <p>找不到此商品</p>
    </div>

    <!-- 商品內容 -->
    <div v-else class="relative max-sm:flex max-sm:flex-col md:grid md:grid-cols-12 pb-16">
      <!-- 左欄：圖片 Galleria -->
      <div class="top-0 md:sticky self-start md:col-span-7">
        <Galleria :value="images" :responsiveOptions :numVisible="5" containerStyle="max-width: 100%;">
          <template #item="slotProps">
            <img :src="slotProps.item.itemImageSrc" :alt="slotProps.item.alt" class="w-full object-cover aspect-square" />
          </template>
          <template #thumbnail="slotProps">
            <img :src="slotProps.item.thumbnailImageSrc" :alt="slotProps.item.alt" class="w-16 h-16 object-cover" />
          </template>
        </Galleria>
      </div>

      <!-- 右欄：商品資訊 -->
      <div class="md:col-span-5 px-2 md:px-8 pt-3">
        <!-- 商品狀態 Tags -->
        <div class="space-x-2 mb-2">
          <Tag v-for="status in product.product_status" :key="status" :severity="getStatusSeverity(status)" :dt="tagDT" :value="status" rounded />
        </div>

        <!-- 商品名稱 / 貨號 -->
        <h1 class="font-bold text-xl sm:text-2xl">
          {{ product.name }}
        </h1>
        <p class="mb-4 text-gray-500 text-sm">
          貨號：{{ product.sku }}
        </p>

        <!-- 評分 / 收藏 -->
        <div class="flex justify-between items-center mb-4">
          <Rating :modelValue="ratingLevel" readonly />
          <button class="flex justify-center items-center transition-colors" :class="isLiked ? 'text-[var(--danger-color)]' : 'text-gray-400 hover:text-[var(--danger-color)]'" :disabled="likeLoading" @click="toggleLike">
            <i :class="isLiked ? 'pi pi-heart-fill' : 'pi pi-heart'" class="text-xl" />
          </button>
        </div>

        <hr class="mb-4">

        <!-- 商品描述 -->
        <p v-if="product.description" class="mb-4 text-gray-600 text-sm leading-relaxed">
          {{ product.description }}
        </p>

        <!-- 活動區塊：有活動才顯示，無活動時整個區塊隱藏 -->
        <div v-if="promotions.length > 0" class="space-y-1 mb-4">
          <div v-for="promo in promotions" :key="promo.label" class="flex flex-wrap items-center gap-2">
            <Tag severity="info" :dt="tagDT" :value="promo.label" rounded />
            <span class="text-sm">{{ promo.description }}</span>
            <span v-if="promo.expiredAt" class="text-gray-400 text-xs">
              截至 {{ promo.expiredAt }}
            </span>
          </div>
        </div>

        <!-- 價格 -->
        <div class="mt-4">
          <p class="mb-1 font-bold text-xl sm:text-2xl">
            NT$ {{ product.sale_price.toLocaleString() }}
          </p>
          <p v-if="product.original_price > product.sale_price" class="mb-2 text-gray-400 text-xs decoration-gray-400 line-through">
            原價：NT$ {{ product.original_price.toLocaleString() }}
          </p>
        </div>

        <!-- 數量 / 庫存 -->
        <div class="flex items-center gap-3 mt-4">
          <InputNumber v-model="quantity" :dt="inputNumberDT" :pt="inputNumberPT" class="h-8" inputId="horizontal-buttons" showButtons buttonLayout="horizontal" :min="1" :max="product.stock">
            <template #incrementbuttonicon>
              <span class="pi pi-plus" />
            </template>
            <template #decrementbuttonicon>
              <span class="pi pi-minus" />
            </template>
          </InputNumber>
          <span class="text-gray-500 text-sm">庫存：{{ product.stock }}</span>
        </div>

        <!-- 分享 -->
        <div class="flex items-center mt-14 mb-4 pr-4">
          <span class="flex gap-1 shrink-0">
            <a href="" @click.prevent="copyLink"><img src="@icon/link.png" class="size-8" alt="複製連結"></a>
            <a :href="`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(currentUrl)}`" target="_blank"><img src="@icon/line.svg" class="size-8" alt="LINE"></a>
            <a :href="`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`" target="_blank"><img src="@icon/facebook.svg" class="size-8" alt="Facebook"></a>
          </span>
        </div>

        <Button label="加入購物車" severity="danger" class="mt-2 rounded-full w-full" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
